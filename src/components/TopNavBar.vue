<template>
  <header class="top-nav">
    <div class="inner">
      <div class="left" @click="$router.push('/discover')">
        <div class="logo">食光私厨</div>
      </div>
      <div class="right">

        <el-button text v-if="isLogin" @click="$router.push('/userCenter/profile')">个人中心</el-button>
        <el-button text v-if="isLogin" @click="$router.push('/userCenter/orders')">我的订单</el-button>
        <template v-if="isLogin">
          <el-avatar class="avatar" :src="avatarUrl" @click="$router.push('/userCenter/profile')">
            {{ avatarText }}
          </el-avatar>
          <el-button text type="danger" @click="logoutNow">退出登录</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="$router.push('/login')">登录</el-button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { House } from '@element-plus/icons-vue'
import { logout } from '@/utils/auth'

const router = useRouter()
const userInfo = computed(() => JSON.parse(localStorage.getItem('userInfo') || '{}'))
const isLogin = computed(() => !!localStorage.getItem('jwtToken'))
const avatarUrl = computed(() => userInfo.value.avatar || '')
const avatarText = computed(() => (userInfo.value.nickname || userInfo.value.username || 'U').slice(0, 1))

function logoutNow() {
  logout()
  router.push('/login')
}
</script>

<style scoped>
.top-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  background: #ffffff;
  border-bottom: 1px solid #d6e9ff;
}

.inner {
  min-height: 64px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 8px;
}

.left {
  cursor: pointer;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  color: #1570c9;
  line-height: 1.1;
}

.right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.avatar {
  margin-left: 6px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .inner {
    padding: 0 16px;
  }
  .right {
    gap: 2px;
  }
}
</style>
