<template>
  <div class="page" v-loading="loading">
    <TopNavBar />
    <div class="shell">
      <el-card v-if="detail.chef" class="hero">
        <div class="header">
          <div class="left">
            <el-avatar :size="72" :src="detail.chef.avatar" />
            <div>
              <h1>{{ detail.chef.realName }}</h1>
              <p>{{ detail.chef.introduction || '暂无介绍' }}</p>
            </div>
          </div>
          <div class="score">
            <span>{{ detail.chef.rating || '5.0' }}</span>
            <small>综合评分</small>
          </div>
        </div>
        <div class="tags">
          <el-tag v-for="tag in detail.chef.cuisineTagDetails || []" :key="tag.tagId">{{ tag.tagName }}</el-tag>
        </div>
        <div class="actions">
          <el-button type="primary" @click="goOrder">预约这位私厨</el-button>
          <el-button v-if="canFavorite" :type="chefFavorited ? 'warning' : 'info'" plain class="btn-fav" @click="toggleChefFavorite">
            <el-icon class="fav-icon"><StarFilled v-if="chefFavorited" /><Star v-else /></el-icon>
            <span>{{ chefFavorited ? '已收藏' : '收藏私厨' }}</span>
          </el-button>
        </div>
      </el-card>

      <el-card class="section">
        <template #header>套餐列表</template>
        <el-table :data="detail.packages || []" border>
          <el-table-column label="图片" width="100">
            <template #default="{ row }"><img class="thumb" :src="row.packageImage" alt="套餐图" /></template>
          </el-table-column>
          <el-table-column prop="packageName" label="套餐名称" />
          <el-table-column prop="mealType" label="时段">
            <template #default="{ row }">{{ mealText(row.mealType) }}</template>
          </el-table-column>
          <el-table-column prop="dishCount" label="菜品数" />
          <el-table-column prop="price" label="价格" />
          <el-table-column label="收藏" width="120">
            <template #default="{ row }">
              <el-button
                v-if="canFavorite"
                size="small"
                :type="isPackageFavorited(row.packageId) ? 'warning' : 'info'"
                plain
                class="btn-fav"
                @click="togglePackageFavorite(row.packageId)"
              >
                <el-icon class="fav-icon"><StarFilled v-if="isPackageFavorited(row.packageId)" /><Star v-else /></el-icon>
                <span>{{ isPackageFavorited(row.packageId) ? '已收藏' : '收藏' }}</span>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="section">
        <template #header>菜品列表</template>
        <div class="dish-grid">
          <div v-for="dish in detail.dishes || []" :key="dish.dishId" class="dish-item">
            <img class="thumb-lg" :src="dish.dishImage" alt="菜品图" />
            <strong>{{ dish.dishName }}</strong>
            <p>{{ dish.ingredients }}</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import TopNavBar from '@/components/TopNavBar.vue'
import { getChefDetail } from '@/api/chef'
import { getFavoriteList, toggleFavorite } from '@/api/favorite'

const route = useRoute()
const router = useRouter()
const detail = ref({})
const loading = ref(false)
const chefFavorited = ref(false)
const packageFavoriteIds = ref(new Set())
const canFavorite = JSON.parse(localStorage.getItem('userRoles') || '[]')
  .some(role => ['ROLE_USER', 'ROLE_ADMIN'].includes(role))

function mealText(mealType) {
  return { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '宵夜' }[mealType] || '未知'
}

function goOrder() {
  const token = localStorage.getItem('jwtToken')
  const target = `/order/create/${route.params.chefId}`
  if (!token) {
    router.push(`/login?redirect=${encodeURIComponent(target)}`)
    return
  }
  router.push(target)
}

async function loadDetail() {
  loading.value = true
  try {
    const res = await getChefDetail(route.params.chefId)
    detail.value = res.data || {}
    await loadFavoriteStatus()
  } finally {
    loading.value = false
  }
}

function isPackageFavorited(packageId) {
  return packageFavoriteIds.value.has(packageId)
}

async function loadFavoriteStatus() {
  const token = localStorage.getItem('jwtToken')
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!token || !userInfo.id) {
    chefFavorited.value = false
    packageFavoriteIds.value = new Set()
    return
  }
  try {
    const [chefRes, pkgRes] = await Promise.all([
      getFavoriteList({ userId: userInfo.id, favoriteType: 'chef' }),
      getFavoriteList({ userId: userInfo.id, favoriteType: 'package' })
    ])
    const chefSet = new Set((chefRes.data || []).map(i => i.targetId))
    packageFavoriteIds.value = new Set((pkgRes.data || []).map(i => i.targetId))
    chefFavorited.value = chefSet.has(route.params.chefId)
  } catch (e) {
    chefFavorited.value = false
    packageFavoriteIds.value = new Set()
  }
}

async function toggleChefFavorite() {
  const token = localStorage.getItem('jwtToken')
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!token) {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  const res = await toggleFavorite({ userId: userInfo.id, favoriteType: 'chef', targetId: route.params.chefId })
  if (res.code !== 200 || res.success === false) {
    ElMessage.error(res.message || '操作失败')
    return
  }
  chefFavorited.value = !!res.data?.favorited
  ElMessage.success(chefFavorited.value ? '收藏成功' : '已取消收藏')
}

async function togglePackageFavorite(packageId) {
  const token = localStorage.getItem('jwtToken')
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!token) {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  const res = await toggleFavorite({ userId: userInfo.id, favoriteType: 'package', targetId: packageId })
  if (res.code !== 200 || res.success === false) {
    ElMessage.error(res.message || '操作失败')
    return
  }
  if (res.data?.favorited) {
    packageFavoriteIds.value.add(packageId)
    ElMessage.success('收藏成功')
  } else {
    packageFavoriteIds.value.delete(packageId)
    ElMessage.success('已取消收藏')
  }
}

onMounted(loadDetail)
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f3f9ff;
}

.shell {
  max-width: 1400px;
  margin: 0 auto;
  padding: 18px 5% 40px;
}

.hero,
.section {
  border-radius: 20px;
  margin-bottom: 18px;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.left {
  display: flex;
  gap: 12px;
}

.header h1 {
  font-size: 34px;
  margin: 0 0 8px;
}

.score {
  width: 160px;
  display: grid;
  place-items: center;
  background: #eef6ff;
  border-radius: 16px;
}

.score span {
  font-size: 36px;
  font-weight: 700;
  color: #135697;
}

.tags {
  display: flex;
  gap: 10px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-fav {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.fav-icon {
  font-size: 16px;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.dish-item {
  background: #f7fbff;
  border-radius: 14px;
  padding: 12px;
}

.thumb {
  width: 72px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}

.thumb-lg {
  width: 100%;
  height: 132px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
}

@media (max-width: 960px) {
  .shell {
    padding: 16px;
  }

  .header {
    flex-direction: column;
  }
}
</style>
