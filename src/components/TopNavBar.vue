<template>
  <header class="top-nav">
    <div class="inner">
      <div class="left" @click="goBrandTarget">
        <div class="logo">食光私厨</div>
      </div>
      <div class="right">
        <template v-if="isLogin">
          <el-button v-if="isUser" text @click="$router.push('/userCenter/profile')">个人中心</el-button>
          <el-button v-if="isUser" text @click="$router.push('/userCenter/orders')">我的订单</el-button>
          <el-button v-if="isChef" text @click="$router.push('/chefCenter/profile')">私厨中心</el-button>
          <el-button v-if="isAdmin" text @click="$router.push('/admin/users')">管理后台</el-button>

          <el-avatar class="avatar" :src="avatarUrl" @click="goAvatarTarget">
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
import { logout } from '@/utils/auth'

const router = useRouter()
const userInfo = computed(() => JSON.parse(localStorage.getItem('userInfo') || '{}'))
const roles = computed(() => JSON.parse(localStorage.getItem('userRoles') || '[]'))
const isLogin = computed(() => !!localStorage.getItem('jwtToken'))
const isUser = computed(() => roles.value.includes('ROLE_USER'))
const isChef = computed(() => roles.value.includes('ROLE_CHEF'))
const isAdmin = computed(() => roles.value.includes('ROLE_ADMIN'))
const avatarUrl = computed(() => userInfo.value.avatar || '')
const avatarText = computed(() => (userInfo.value.nickname || userInfo.value.username || 'U').slice(0, 1))

function goBrandTarget() {
  if (!isLogin.value) {
    router.push('/discover')
    return
  }
  if (isAdmin.value) {
    router.push('/admin/users')
    return
  }
  if (isChef.value) {
    router.push('/chefCenter/profile')
    return
  }
  router.push('/discover')
}

function goAvatarTarget() {
  if (isAdmin.value) {
    router.push('/admin/users')
    return
  }
  if (isChef.value) {
    router.push('/chefCenter/profile')
    return
  }
  router.push('/userCenter/profile')
}

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
