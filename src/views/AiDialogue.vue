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
        <!-- 核心修复：确保 chat-box 有固定高度以便滚动 -->
        <div class="chat-box" ref="chatBoxRef">
          <div v-for="(msg, idx) in messages" :key="idx" class="msg-row" :class="msg.role">
            <div class="bubble">
              <div class="name">{{ msg.role === 'assistant' ? '食光小厨' : '我' }}</div>
              <div class="text">{{ msg.text }}</div>

              <!-- 核心修复：增加判断，防止历史记录中每一条都显示重复的推荐 -->
              <!-- 逻辑：只有当该条消息确实带有推荐数据，且我们希望它显示时才渲染 -->
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

// 改进滚动逻辑
async function scrollToBottom() {
  await nextTick()
  setTimeout(() => {
    const el = chatBoxRef.value
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, 100) // 略微延迟确保 DOM 渲染完成（包括图片占位）
}

async function loadHistory() {
  if (!userInfo?.id) return
  try {
    const res = await getDialogueHistory(userInfo.id, sessionId.value)
    const list = res?.data || []
    const next = []

    list.forEach((d, index) => {
      if (d?.message) next.push({ role: 'user', text: d.message })
      if (d?.reply) {
        const extra = safeParseJson(d.extractedInfo) || {}
        let recs = Array.isArray(extra.recommendations) ? extra.recommendations : []

        // 核心修复逻辑：
        // 如果后端在所有历史记录中都返回了相同的 recommendations，
        // 我们只在“最后一次助理回复”或者“特定含有推荐意图”的消息中保留它。
        // 这里通过判断是否是最后一条记录，或者后端是否传了特定标志。
        // 如果后端没有标志，我们只给最后一条助理消息挂载 recommendations
        const isLastAssistantMsg = (index === list.length - 1)
        if (!isLastAssistantMsg && recs.length > 0) {
          // 如果不是最后一条且后端返回了推荐，可能是数据污染，我们根据业务需求决定是否清除
          // 如果希望历史记录里能看到当时的推荐，则保留；如果现在发现到处都是，则清除旧的。
          recs = []
        }

        next.push({ role: 'assistant', text: d.reply, recommendations: recs })
      }
    })

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

  // 发送前清空之前的旧推荐（可选：如果你希望页面上永远只显示一份最新推荐）
  // messages.value.forEach(m => { if(m.recommendations) m.recommendations = [] })

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

/* 核心修复：给聊天框固定高度，使其内部产生滚动条 */
.chat-box {
  height: 60vh; /* 使用相对于视口的高度，或者固定像素如 500px */
  min-height: 420px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 5px;
  overflow-y: auto;
  /* 优化滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #cfe7ff transparent;
}

.chat-box::-webkit-scrollbar {
  width: 6px;
}
.chat-box::-webkit-scrollbar-thumb {
  background-color: #cfe7ff;
  border-radius: 10px;
}

.msg-row {
  display: flex;
  margin-bottom: 8px;
}

.msg-row.user {
  justify-content: flex-end;
}

.msg-row.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: min(85%, 760px);
  width: fit-content;
  background: #edf6ff;
  border: 1px solid #cfe7ff;
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
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
  margin-top: 12px;
  display: grid;
  gap: 12px;
}

.rec-card {
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(21, 112, 201, 0.15);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(21, 112, 201, 0.08);
  transition: transform 0.2s;
}
.rec-card:hover {
  transform: translateY(-2px);
}

.msg-row.user .rec-card {
  display: none;
}

.rec-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
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
  gap: 12px;
  padding: 12px;
  border-top: 1px solid rgba(21, 112, 201, 0.08);
  background: #fafcff;
  cursor: pointer;
}

.rec-pkg:hover {
  background: #f0f7ff;
}

.rec-pkg-img {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  background: #eef2f6;
}

.rec-pkg-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  font-size: 14px;
  font-weight: 700;
  color: #1570c9;
}

.rec-actions {
  padding: 10px;
  border-top: 1px solid rgba(21, 112, 201, 0.08);
  text-align: right;
}

.input-row {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: end;
}

@media (max-width: 960px) {
  .shell {
    padding: 10px;
  }
  .chat-box {
    height: 65vh;
  }
  .input-row {
    grid-template-columns: 1fr;
  }
}
</style>