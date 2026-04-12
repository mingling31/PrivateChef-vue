import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const routes = [
  { path: '/', redirect: '/discover' },
  { path: '/login', name: 'Login', component: () => import('@/views/login.vue'), meta: { title: '登录' } },
  { path: '/register/chef', name: 'ChefRegister', component: () => import('@/views/ChefRegister.vue'), meta: { title: '私厨注册' } },
  { path: '/discover', name: 'Discover', component: () => import('@/views/HomeRecommend.vue'), meta: { title: '首页' } },
  { path: '/chef/:chefId', name: 'ChefDetail', component: () => import('@/views/ChefDetail.vue'), meta: { title: '私厨详情' } },
  { path: '/order/create/:chefId', name: 'OrderCreate', component: () => import('@/views/OrderCreate.vue'), meta: { requiresAuth: true, title: '预约下单' } },
  { path: '/ai-dialogue', name: 'AiDialogue', component: () => import('@/views/AiDialogue.vue'), meta: { requiresAuth: true, title: '食光小厨' } },
  {
    path: '/userCenter',
    component: () => import('@/views/layouts/UserLayout.vue'),
    meta: { requiresAuth: true, roles: ['ROLE_USER', 'ROLE_CHEF', 'ROLE_ADMIN'] },
    children: [
      { path: '', redirect: '/userCenter/profile' },
      { path: 'profile', component: () => import('@/views/user/UserProfile.vue'), meta: { title: '个人资料' } },
      { path: 'preferences', component: () => import('@/views/user/UserPreferences.vue'), meta: { title: '我的偏好' } },
      { path: 'favorites', component: () => import('@/views/user/UserFavorites.vue'), meta: { title: '我的收藏' } },
      { path: 'orders', component: () => import('@/views/user/UserOrders.vue'), meta: { title: '我的订单' } }
    ]
  },
  {
    path: '/chefCenter',
    component: () => import('@/views/layouts/ChefLayout.vue'),
    meta: { requiresAuth: true, roles: ['ROLE_CHEF', 'ROLE_ADMIN'] },
    children: [
      { path: '', redirect: '/chefCenter/profile' },
      { path: 'profile', component: () => import('@/views/chef/ChefProfile.vue'), meta: { title: '私厨资料' } },
      { path: 'dishes', component: () => import('@/views/chef/ChefDishes.vue'), meta: { title: '菜品管理' } },
      { path: 'packages', component: () => import('@/views/chef/ChefPackages.vue'), meta: { title: '套餐管理' } },
      { path: 'schedules', component: () => import('@/views/chef/ChefSchedules.vue'), meta: { title: '排班管理' } },
      { path: 'orders', component: () => import('@/views/chef/ChefOrders.vue'), meta: { title: '订单处理' } }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/views/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] },
    children: [
      { path: '', redirect: '/admin/users' },
      { path: 'users', component: () => import('@/views/admin/AdminUsers.vue'), meta: { title: '用户管理' } },
      { path: 'chefs', component: () => import('@/views/admin/AdminChefs.vue'), meta: { title: '私厨审核' } },
      { path: 'orders', component: () => import('@/views/admin/AdminOrders.vue'), meta: { title: '订单管理' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/discover' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('jwtToken')
  const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]')

  if (to.meta?.requiresAuth && !token) {
    ElMessage.warning('请先登录')
    return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (to.meta?.roles && !to.meta.roles.some(role => userRoles.includes(role))) {
    ElMessage.error('当前账号无权限访问该页面')
    return next(from.fullPath && from.fullPath !== to.fullPath ? from.fullPath : '/discover')
  }

  document.title = to.meta?.title ? `${to.meta.title} - 食光私厨` : '食光私厨'
  next()
})

export default router
