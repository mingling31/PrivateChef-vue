<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo" @click="$router.push('/discover')">个人中心</div>
      <el-menu router :default-active="$route.path">
        <el-menu-item index="/userCenter/profile">个人资料</el-menu-item>
        <el-menu-item index="/userCenter/preferences">我的偏好</el-menu-item>
        <el-menu-item index="/userCenter/favorites">我的收藏</el-menu-item>
        <el-menu-item index="/userCenter/orders">我的订单</el-menu-item>
        <el-menu-item index="/userCenter/messages">消息中心</el-menu-item>
      </el-menu>
    </aside>
    <main class="main">
      <header class="topbar">
        <div>{{ $route.meta.title }}</div>
        <div class="actions">
          <el-button text @click="$router.push('/discover')">🏠 首页</el-button>
          <el-avatar :src="userInfo.avatar">{{ avatarText }}</el-avatar>
          <el-button text @click="$router.push('/userCenter/profile')">个人中心</el-button>
          <el-button text @click="$router.push('/userCenter/orders')">我的订单</el-button>
          <el-button text type="danger" @click="logoutNow">退出登录</el-button>
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
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: #f3f9ff;
}

.sidebar {
  background: linear-gradient(180deg, #d9edff, #eaf5ff);
  color: #123d68;
  padding: 22px 14px;
  border-right: 1px solid #d6e9ff;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  cursor: pointer;
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  background: #ffffff;
  border-bottom: 1px solid #d6e9ff;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content {
  padding: 0;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
