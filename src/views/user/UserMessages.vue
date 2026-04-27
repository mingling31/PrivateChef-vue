<template>
  <el-card>
    <template #header>
      <div class="header-row">
        <span>消息中心</span>
        <el-button type="primary" size="small" @click="handleMarkAllRead" :disabled="!unreadCount">
          全部标为已读
        </el-button>
      </div>
    </template>

    <div class="stats-bar">
      <el-tag type="info" effect="plain">全部消息 {{ total }} 条</el-tag>
      <el-tag type="danger" effect="plain" v-if="unreadCount">未读 {{ unreadCount }} 条</el-tag>
    </div>

    <el-empty v-if="!messages.length" description="暂无消息" />

    <div v-else class="message-list">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-item"
        :class="{ unread: msg.isRead === 0 }"
        @click="handleRead(msg)"
      >
        <div class="msg-dot" v-if="msg.isRead === 0"></div>
        <div class="msg-content">
          <div class="msg-title">
            <el-tag :type="typeTag(msg.type)" size="small" effect="plain">{{ typeText(msg.type) }}</el-tag>
            <span class="title-text">{{ msg.title }}</span>
          </div>
          <div class="msg-body">{{ msg.content }}</div>
          <div class="msg-time">{{ msg.createTime }}</div>
        </div>
      </div>
    </div>

    <el-pagination
      v-if="total > pageSize"
      class="pagination"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="handlePageChange"
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/api/notification'

const messages = ref([])
const total = ref(0)
const unreadCount = ref(0)
const currentPage = ref(1)
const pageSize = 10

const typeMap = { order: { text: '订单通知', tag: 'primary' }, system: { text: '系统通知', tag: 'info' }, audit: { text: '审核通知', tag: 'warning' } }

function typeText(type) { return typeMap[type]?.text || type }
function typeTag(type) { return typeMap[type]?.tag || 'info' }

async function loadMessages() {
  const res = await getNotifications({ page: currentPage.value, size: pageSize })
  if (res.code === 200) {
    messages.value = res.data.records || []
    total.value = res.data.total || 0
  }
  loadUnread()
}

async function loadUnread() {
  const res = await getUnreadCount()
  if (res.code === 200) {
    unreadCount.value = res.data || 0
  }
}

async function handleRead(msg) {
  if (msg.isRead === 0) {
    await markAsRead(msg.id)
    msg.isRead = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

async function handleMarkAllRead() {
  await markAllAsRead()
  messages.value.forEach(m => m.isRead = 1)
  unreadCount.value = 0
  ElMessage.success('全部标为已读')
}

function handlePageChange(page) {
  currentPage.value = page
  loadMessages()
}

onMounted(loadMessages)
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
.stats-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.message-list { display: flex; flex-direction: column; gap: 8px; }
.message-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; border: 1px solid #ebeef5; border-radius: 8px;
  cursor: pointer; transition: background 0.2s;
}
.message-item:hover { background: #f5f7fa; }
.message-item.unread { background: #ecf5ff; border-color: #d9ecff; }
.msg-dot { width: 8px; height: 8px; background: #409eff; border-radius: 50%; margin-top: 8px; flex-shrink: 0; }
.msg-content { flex: 1; min-width: 0; }
.msg-title { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.title-text { font-weight: 600; font-size: 14px; }
.msg-body { font-size: 13px; color: #606266; margin-bottom: 4px; }
.msg-time { font-size: 12px; color: #909399; }
.pagination { margin-top: 16px; justify-content: center; }
</style>
