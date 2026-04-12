<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">私厨中心</div>
      <el-menu router :default-active="$route.path">
        <el-menu-item index="/chefCenter/profile">资料维护</el-menu-item>
        <el-menu-item index="/chefCenter/dishes">菜品管理</el-menu-item>
        <el-menu-item index="/chefCenter/packages">套餐管理</el-menu-item>
        <el-menu-item index="/chefCenter/schedules">排班管理</el-menu-item>
        <el-menu-item index="/chefCenter/orders">订单处理</el-menu-item>
      </el-menu>
    </aside>
    <main class="main">
      <header class="topbar">
        <div>{{ $route.meta.title }}</div>
        <div class="actions">
          <el-button text @click="$router.push('/discover')">返回首页</el-button>
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
import { useRouter } from 'vue-router'
import { logout } from '@/utils/auth'

const router = useRouter()
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
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  background: #fff;
  border-bottom: 1px solid #d6e9ff;
}

.actions {
  display: flex;
  align-items: center;
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
