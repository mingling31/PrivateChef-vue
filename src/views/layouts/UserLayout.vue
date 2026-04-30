<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo" @click="$router.push('/discover')">
        <el-icon><HomeFilled /></el-icon>
        <span>个人中心</span>
      </div>
      <el-menu
          router
          :default-active="$route.path"
          background-color="transparent"
          text-color="#475569"
          active-text-color="#1570c9"
          class="sidebar-menu"
      >
        <el-menu-item index="/userCenter/profile">
          <el-icon><User /></el-icon>
          <span>个人资料</span>
        </el-menu-item>
        <el-menu-item index="/userCenter/preferences">
          <el-icon><SetUp /></el-icon>
          <span>我的偏好</span>
        </el-menu-item>
        <el-menu-item index="/userCenter/favorites">
          <el-icon><Star /></el-icon>
          <span>我的收藏</span>
        </el-menu-item>
        <el-menu-item index="/userCenter/orders">
          <el-icon><Document /></el-icon>
          <span>我的订单</span>
        </el-menu-item>
        <el-menu-item index="/userCenter/messages">
          <el-icon><Message /></el-icon>
          <span>消息中心</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="page-title">{{ $route.meta.title }}</div>
        <div class="topbar-actions">
          <el-button text @click="$router.push('/discover')">
            <el-icon><HomeFilled /></el-icon>
            首页
          </el-button>
          <el-avatar :size="32" :src="userInfo.avatar" class="user-avatar">
            {{ avatarText }}
          </el-avatar>
          <el-button text @click="$router.push('/userCenter/profile')">个人中心</el-button>
          <el-button text @click="$router.push('/userCenter/orders')">我的订单</el-button>
          <el-button text type="danger" @click="logoutNow">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </header>
      <div class="content">
        <div class="page-shell">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  HomeFilled, User, SetUp, Star, Document, Message, SwitchButton
} from '@element-plus/icons-vue'
import { logout } from '@/utils/auth'

const router = useRouter()
const userInfo = computed(() => JSON.parse(localStorage.getItem('userInfo') || '{}'))
const avatarText = computed(() => (userInfo.value.nickname || userInfo.value.username || 'U').slice(0, 1))

function logoutNow() {
  logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
  background: #f3f9ff;
}

.sidebar {
  background: linear-gradient(180deg, #e8f4fd 0%, #f0f7ff 100%);
  border-right: 1px solid #d6e9ff;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 24px 20px 20px;
  font-size: 20px;
  font-weight: 700;
  color: #1570c9;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #d6e9ff;
  cursor: pointer;
}

.logo .el-icon {
  font-size: 24px;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
  padding: 8px 0;
}

.sidebar-menu :deep(.el-menu-item) {
  margin: 2px 8px;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
  font-size: 14px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: rgba(21, 112, 201, 0.08);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: rgba(21, 112, 201, 0.12);
  font-weight: 600;
}

.sidebar-menu :deep(.el-icon) {
  font-size: 18px;
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #d6e9ff;
  flex-shrink: 0;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.topbar-actions .el-button {
  font-size: 14px;
}

.topbar-actions .el-button--danger {
  color: #909399;
}

.topbar-actions .el-button--danger:hover {
  color: #f56c6c;
}

.user-avatar {
  border: 2px solid #d6e9ff;
  margin: 0 4px;
}

.content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }
}
</style>