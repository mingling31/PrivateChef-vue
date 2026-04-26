<template>
  <div class="page">
    <TopNavBar />

    <div class="shell">
      <section class="hero">
        <div>
          <p class="eyebrow">智能推荐</p>
          <h1>食光私厨，帮你更快找到合适私厨</h1>
          <p>无需登录即可浏览推荐，点击预约和 AI 对话时会自动跳转登录并回跳。</p>
        </div>
        <el-card class="ai-entry" shadow="hover" @click="goAi">
          <div class="ai-title">菜品推荐</div>
          <p>不知道吃什么，让食光小厨帮你推荐</p>
          <el-button type="primary">去对话</el-button>
        </el-card>
      </section>

      <el-card class="section">
        <template #header>套餐筛选</template>
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="时段">
            <el-select v-model="filterForm.mealType" clearable placeholder="全部">
              <el-option label="早餐" :value="1" />
              <el-option label="午餐" :value="2" />
              <el-option label="晚餐" :value="3" />
              <el-option label="宵夜" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="菜品数">
            <el-select v-model="filterForm.dishCount" clearable placeholder="全部">
              <el-option label="3菜" :value="3" />
              <el-option label="4菜" :value="4" />
              <el-option label="5菜" :value="5" />
              <el-option label="6菜" :value="6" />
            </el-select>
          </el-form-item>
          <el-form-item label="套餐名">
            <el-input v-model="filterForm.packageName" placeholder="如：三菜午餐套餐" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runFilter">筛选</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-if="filterRows.length" :data="filterRows" border>
          <el-table-column label="私厨">
            <template #default="{ row }">{{ row.chef?.realName }}</template>
          </el-table-column>
          <el-table-column label="套餐">
            <template #default="{ row }">{{ row.package?.packageName }}</template>
          </el-table-column>
          <el-table-column label="价格">
            <template #default="{ row }">{{ row.package?.price }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="section">
        <template #header>私厨推荐</template>
        <div class="grid">
          <div v-for="chef in home.chefs" :key="chef.chefId" class="card-item">
            <el-avatar :size="52" :src="chef.avatar" />
            <div class="name">{{ chef.realName }}</div>
            <div class="desc">{{ cuisineNames(chef) }}</div>
            <div class="desc">评分：{{ chef.rating || '5.0' }}</div>
            <div class="actions-row">
              <el-button type="primary" plain @click="$router.push(`/chef/${chef.chefId}`)">查看详情</el-button>
              <el-button
                v-if="canFavorite"
                :type="isChefFavorited(chef.chefId) ? 'warning' : 'info'"
                plain
                class="btn-fav"
                @click="toggleChefFavorite(chef.chefId)"
              >
                <el-icon class="fav-icon"><StarFilled v-if="isChefFavorited(chef.chefId)" /><Star v-else /></el-icon>
                <span>{{ isChefFavorited(chef.chefId) ? '已收藏' : '收藏' }}</span>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="section">
        <template #header>套餐推荐</template>
        <div class="grid">
          <div v-for="pkg in home.packages" :key="pkg.packageId" class="card-item clickable" @click="goPackageOrder(pkg)">
            <img class="cover" :src="pkg.packageImage" alt="套餐图片" />
            <div class="name">{{ pkg.packageName }}</div>
            <div class="desc">价格：{{ pkg.price }}</div>
            <div class="desc">所属私厨：{{ pkg.chefInfo?.realName || pkg.chefId }}</div>
            <el-button
              v-if="canFavorite"
              :type="isPackageFavorited(pkg.packageId) ? 'warning' : 'info'"
              plain
              class="btn-fav"
              @click.stop="togglePackageFavorite(pkg.packageId)"
            >
              <el-icon class="fav-icon"><StarFilled v-if="isPackageFavorited(pkg.packageId)" /><Star v-else /></el-icon>
              <span>{{ isPackageFavorited(pkg.packageId) ? '已收藏' : '收藏套餐' }}</span>
            </el-button>
          </div>
        </div>
      </el-card>

      <el-card class="section">
        <template #header>菜品推荐</template>
        <div class="grid">
          <div v-for="dish in home.dishes" :key="dish.dishId" class="card-item clickable" @click="goDishChef(dish)">
            <img class="cover" :src="dish.dishImage" alt="菜品图片" />
            <div class="name">{{ dish.dishName }}</div>
            <div class="desc">{{ dish.ingredients }}</div>
            <div class="chef-info" v-if="dish.chef">
              <el-avatar :size="24" :src="dish.chef.avatar" />
              <span>{{ dish.chef.realName }} · {{ dish.chef.rating || '5.0' }}分</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import TopNavBar from '@/components/TopNavBar.vue'
import { filterPackages, getPublicHomeData } from '@/api/public'
import { getFavoriteList, toggleFavorite } from '@/api/favorite'

const home = reactive({ chefs: [], packages: [], dishes: [] })
const filterForm = reactive({ mealType: null, dishCount: null, packageName: '' })
const filterRows = ref([])
const favoriteChefIds = ref(new Set())
const favoritePackageIds = ref(new Set())
const canFavorite = JSON.parse(localStorage.getItem('userRoles') || '[]')
  .some(role => ['ROLE_USER', 'ROLE_ADMIN'].includes(role))

function cuisineNames(chef) {
  const tags = chef.cuisineTagDetails || []
  return tags.map(tag => tag.tagName).join(' / ') || '暂无'
}

function ensureLoginFor(path) {
  const token = localStorage.getItem('jwtToken')
  if (!token) {
    window.location.href = `/login?redirect=${encodeURIComponent(path)}`
    return false
  }
  return true
}

function goAi() {
  if (!ensureLoginFor('/ai-dialogue')) return
  window.location.href = '/ai-dialogue'
}

function goPackageOrder(pkg) {
  const target = `/order/create/${pkg.chefId}?packageId=${pkg.packageId}`
  if (!ensureLoginFor(target)) return
  window.location.href = target
}

function goDishChef(dish) {
  const chefId = dish.chef?.chefId
  if (!chefId) return
  window.location.href = `/chef/${chefId}`
}

async function loadHome() {
  const res = await getPublicHomeData()
  Object.assign(home, res.data || {})
  await loadFavoriteStatus()
}

async function runFilter() {
  const res = await filterPackages({ ...filterForm })
  filterRows.value = res.data || []
  if (!filterRows.value.length) ElMessage.info('没有匹配到套餐')
}

function resetFilter() {
  filterForm.mealType = null
  filterForm.dishCount = null
  filterForm.packageName = ''
  filterRows.value = []
}

function isChefFavorited(chefId) {
  return favoriteChefIds.value.has(chefId)
}

function isPackageFavorited(packageId) {
  return favoritePackageIds.value.has(packageId)
}

async function loadFavoriteStatus() {
  const token = localStorage.getItem('jwtToken')
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!token || !userInfo.id) return
  try {
    const [chefRes, pkgRes] = await Promise.all([
      getFavoriteList({ userId: userInfo.id, favoriteType: 'chef' }),
      getFavoriteList({ userId: userInfo.id, favoriteType: 'package' })
    ])
    favoriteChefIds.value = new Set((chefRes.data || []).map(i => i.targetId))
    favoritePackageIds.value = new Set((pkgRes.data || []).map(i => i.targetId))
  } catch (e) {
    favoriteChefIds.value = new Set()
    favoritePackageIds.value = new Set()
  }
}

async function toggleChefFavorite(chefId) {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!ensureLoginFor('/discover')) return
  const res = await toggleFavorite({ userId: userInfo.id, favoriteType: 'chef', targetId: chefId })
  if (res.code !== 200 || res.success === false) {
    ElMessage.error(res.message || '操作失败')
    return
  }
  if (res.data?.favorited) {
    favoriteChefIds.value.add(chefId)
    ElMessage.success('收藏成功')
  } else {
    favoriteChefIds.value.delete(chefId)
    ElMessage.success('已取消收藏')
  }
}

async function togglePackageFavorite(packageId) {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!ensureLoginFor('/discover')) return
  const res = await toggleFavorite({ userId: userInfo.id, favoriteType: 'package', targetId: packageId })
  if (res.code !== 200 || res.success === false) {
    ElMessage.error(res.message || '操作失败')
    return
  }
  if (res.data?.favorited) {
    favoritePackageIds.value.add(packageId)
    ElMessage.success('收藏成功')
  } else {
    favoritePackageIds.value.delete(packageId)
    ElMessage.success('已取消收藏')
  }
}

onMounted(loadHome)
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f3f9ff;
}

.shell {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 5% 40px;
}

.hero {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
}

.hero h1 {
  font-size: 40px;
  color: #123d68;
  margin: 8px 0 12px;
}

.hero p {
  color: #406482;
}

.eyebrow {
  color: #1570c9;
  letter-spacing: 0.2em;
  font-size: 12px;
  text-transform: uppercase;
}

.ai-entry {
  border-radius: 16px;
  border: 1px solid #cde4fb;
  cursor: pointer;
}

.ai-title {
  font-size: 24px;
  color: #123d68;
  margin-bottom: 8px;
}

.section {
  margin-top: 20px;
  border-radius: 16px;
  border: 1px solid #d6e9ff;
}

.filter-form :deep(.el-form-item) {
  margin-right: 12px;
  margin-bottom: 12px;
}

.filter-form :deep(.el-select) {
  width: 160px;
}

.filter-form :deep(.el-input) {
  width: 240px;
}

.btn-fav {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.fav-icon {
  font-size: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.card-item {
  background: #ffffff;
  border: 1px solid #dbeeff;
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 8px;
  justify-items: start;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  box-shadow: 0 10px 24px rgba(21, 112, 201, 0.12);
}

.cover {
  width: 100%;
  height: 132px;
  object-fit: cover;
  border-radius: 10px;
}

.name {
  font-weight: 700;
  color: #123d68;
}

.desc {
  color: #406482;
  font-size: 13px;
}

.actions-row {
  display: flex;
  gap: 8px;
}

.chef-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #31597b;
}

@media (max-width: 960px) {
  .shell {
    padding: 16px;
  }

  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
