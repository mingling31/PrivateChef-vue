<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">Admin</div>
      <el-menu router :default-active="$route.path">
        <el-menu-item index="/admin/users">用户管理</el-menu-item>
        <el-menu-item index="/admin/chefs">私厨审核</el-menu-item>
        <el-menu-item index="/admin/orders">订单管理</el-menu-item>
      </el-menu>
    </aside>
    <main class="main">
      <header class="topbar">
        <div>{{ $route.meta.title }}</div>
        <el-button link @click="logoutNow">退出登录</el-button>
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
import { useRouter } from 'vue-router'
import { logout } from '@/utils/auth'

const router = useRouter()
function logoutNow() {
  logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; background: #f5f7fa; }
.sidebar { background: #18212e; color: white; padding: 24px 16px; }
.logo { font-size: 28px; font-weight: 700; margin-bottom: 20px; }
.topbar { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; background: white; border-bottom: 1px solid #e8edf4; }
.content { padding: 0; }
</style>
