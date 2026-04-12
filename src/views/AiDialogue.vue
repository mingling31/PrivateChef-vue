<template>
  <div class="page">
    <TopNavBar />
    <div class="shell">
      <el-card class="card">
        <template #header>
          <div class="card-header">
            <div class="card-title">食光小厨</div>
            <div class="card-actions">
              <el-button type="danger" plain size="small" @click="clearHistory">清空聊天记录</el-button>
            </div>
          </div>
        </template>
        <div class="chat-box" ref="chatBoxRef">
          <div v-for="(msg, idx) in messages" :key="idx" class="msg-row" :class="msg.role">
            <div class="bubble">
              <div class="name">{{ msg.role === 'assistant' ? '食光小厨' : '我' }}</div>
              <div class="text">{{ msg.text }}</div>
              <div v-if="msg.role === 'assistant' && msg.recommendations?.length" class="rec-wrap">
                <div v-for="(item, i) in msg.recommendations" :key="item.chefId || i" class="rec-card">
                  <div class="rec-head" @click="openChef(item.chefId)">
                    <el-avatar :size="40" :src="item.avatar" />
                    <div class="rec-meta">
                      <div class="rec-title">
                        <span class="rec-name">{{ item.chefName }}</span>
                        <span class="rec-rating">评分 {{ item.rating || '-' }}</span>
                        <span class="rec-distance" v-if="item.distanceKm != null">· {{ item.distanceKm }} km</span>
                      </div>
                      <div class="rec-sub" v-if="item.matchedCuisines?.length">擅长：{{ item.matchedCuisines.join(' / ') }}</div>
                    </div>
                  </div>
                  <div v-if="item.referencePackage" class="rec-pkg" @click="openOrder(item.chefId, item.referencePackage.packageId)">
                    <img class="rec-pkg-img" :src="item.referencePackage.packageImage" alt="套餐图" />
                    <div class="rec-pkg-meta">
                      <div class="rec-pkg-name">{{ item.referencePackage.packageName }}</div>
                      <div class="rec-pkg-price">¥{{ item.referencePackage.price }}</div>
                    </div>
                  </div>
                  <div v-else class="rec-actions">
                    <el-button size="small" @click="openChef(item.chefId)">进入主页</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="input-row">
          <el-input
            v-model="message"
            type="textarea"
            :rows="2"
            placeholder="例如：周五聚餐，4人，喜欢川菜，不吃香菜，预算200元"
            @keydown.enter.prevent="submit"
          />
          <el-button type="primary" :loading="loading" @click="submit">发送</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import TopNavBar from '@/components/TopNavBar.vue'
import { chatDialogue, getDialogueHistory } from '@/api/dialogue'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const route = useRoute()
const router = useRouter()
const message = ref('')
const loading = ref(false)
const messages = ref([])
const chatBoxRef = ref(null)
const sessionId = ref('')

const SESSION_KEY = 'aiDialogueSessionId'
const WELCOME_TEXT = '你好，我是食光小厨。告诉我你的用餐时段、人数、菜系偏好、忌口和预算，我来帮你推荐。'

function safeParseJson(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch (e) {
    return null
  }
}

function buildNewSessionId() {
  const uid = userInfo?.id || 'guest'
  return `sess_${uid}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

function resolveSessionId() {
  const fromQuery = route.query?.sessionId
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    localStorage.setItem(SESSION_KEY, fromQuery)
    return fromQuery
  }
  const cached = localStorage.getItem(SESSION_KEY)
  if (cached && cached.trim()) return cached
  const fresh = buildNewSessionId()
  localStorage.setItem(SESSION_KEY, fresh)
  return fresh
}

async function scrollToBottom() {
  await nextTick()
  const el = chatBoxRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

async function loadHistory() {
  if (!userInfo?.id) return
  try {
    const res = await getDialogueHistory(userInfo.id, sessionId.value)
    const list = res?.data || []
    const next = []
    for (const d of list) {
      if (d?.message) next.push({ role: 'user', text: d.message })
      if (d?.reply) {
        const extra = safeParseJson(d.extractedInfo) || {}
        const recs = Array.isArray(extra.recommendations) ? extra.recommendations : []
        next.push({ role: 'assistant', text: d.reply, recommendations: recs })
      }
    }
    messages.value = next.length ? next : [{ role: 'assistant', text: WELCOME_TEXT }]
    await scrollToBottom()
  } catch (error) {
    messages.value = [{ role: 'assistant', text: WELCOME_TEXT }]
  }
}

function startNewSession() {
  sessionId.value = buildNewSessionId()
  localStorage.setItem(SESSION_KEY, sessionId.value)
  messages.value = [{ role: 'assistant', text: WELCOME_TEXT }]
  scrollToBottom()
}

function clearHistory() {
  ElMessageBox.confirm('确定要清空当前的聊天记录并重新开始吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    startNewSession()
    ElMessage.success('聊天记录已清空')
  }).catch(() => {})
}

async function submit() {
  const text = message.value.trim()
  if (!text) {
    ElMessage.warning('请先输入需求')
    return
  }
  message.value = ''
  messages.value.push({ role: 'user', text })
  await scrollToBottom()
  loading.value = true
  try {
    const res = await chatDialogue(userInfo.id, { message: text, sessionId: sessionId.value })
    const aiReply = res.data?.reply || '收到，我会根据你的需求继续推荐。'
    const recs = Array.isArray(res.data?.recommendations) ? res.data.recommendations : []
    messages.value.push({
      role: 'assistant',
      text: aiReply,
      recommendations: recs
    })
    await scrollToBottom()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'AI 服务暂时不可用')
  } finally {
    loading.value = false
  }
}

function openChef(chefId) {
  if (!chefId) return
  router.push(`/chef/${chefId}`)
}

function openOrder(chefId, packageId) {
  if (!chefId) return
  router.push({ path: `/order/create/${chefId}`, query: packageId ? { packageId } : {} })
}

onMounted(async () => {
  sessionId.value = resolveSessionId()
  await loadHistory()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f3f9ff;
}

.shell {
  max-width: var(--pc-shell-max);
  margin: 0 auto;
  padding: 20px 5% 40px;
}

.card {
  border-radius: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-title {
  font-weight: 600;
}

.chat-box {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 2px 0;
  overflow-y: auto;
}

.msg-row {
  display: flex;
}

.msg-row.user {
  justify-content: flex-end;
}

.msg-row.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: min(80%, 760px);
  width: fit-content;
  display: inline-block;
  background: #edf6ff;
  border: 1px solid #cfe7ff;
  border-radius: 12px;
  padding: 10px 12px;
}

.msg-row.user .bubble {
  background: #1570c9;
  border-color: #1570c9;
  color: #fff;
}

.name {
  font-size: 12px;
  opacity: 0.85;
  margin-bottom: 4px;
}

.text {
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.rec-wrap {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.rec-card {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(21, 112, 201, 0.18);
  overflow: hidden;
}

.msg-row.user .rec-card {
  display: none;
}

.rec-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  cursor: pointer;
}

.rec-meta {
  min-width: 0;
}

.rec-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.rec-name {
  font-weight: 700;
  color: #123d68;
}

.rec-rating,
.rec-distance {
  font-size: 12px;
  color: #4c6f8e;
}

.rec-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #4c6f8e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-pkg {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid rgba(21, 112, 201, 0.12);
  cursor: pointer;
}

.rec-pkg-img {
  width: 80px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
  background: #eef2f6;
}

.rec-pkg-meta {
  min-width: 0;
}

.rec-pkg-name {
  font-weight: 600;
  color: #123d68;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-pkg-price {
  margin-top: 4px;
  font-size: 12px;
  color: #1570c9;
}

.rec-actions {
  padding: 10px;
  border-top: 1px solid rgba(21, 112, 201, 0.12);
}

.input-row {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

@media (max-width: 960px) {
  .shell {
    padding: 16px;
  }

  .input-row {
    grid-template-columns: 1fr;
  }
}
</style>
