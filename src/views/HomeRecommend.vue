<template>
  <div class="page">
    <TopNavBar />

    <div class="shell">
      <section class="hero">
        <div>
          <h3 class="eyebrow">智能推荐</h3>
          <h1>寻一味家常，遇一位良厨</h1>
          <h2>食光私厨，帮你找到更合适你的厨师</h2>
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

        <el-table v-if="filterRows.length" :data="filterRows" border class="package-table">
          <el-table-column label="私厨" width="140">
            <template #default="{ row }">
              <div class="chef-cell">
                <el-avatar :size="40" :src="row.chef?.avatar" />
                <span>{{ row.chef?.realName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="套餐" min-width="180">
            <template #default="{ row }">
              <div class="package-cell">
                <img v-if="row.package?.packageImage" :src="row.package.packageImage" alt="套餐" class="pkg-img" />
                <div class="pkg-info">
                  <div class="pkg-name">{{ row.package?.packageName }}</div>
                  <div class="pkg-desc">{{ row.package?.description || '暂无描述' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="时段" width="200">
            <template #default="{ row }">
              <div class="meal-tags">
                <el-tag v-if="row.package?.mealType === 1" size="small" type="warning">早餐</el-tag>
                <el-tag v-if="row.package?.mealType === 2" size="small" type="success">午餐</el-tag>
                <el-tag v-if="row.package?.mealType === 3" size="small" type="primary">晚餐</el-tag>
                <el-tag v-if="row.package?.mealType === 4" size="small" type="info">宵夜</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="价格" width="130">
            <template #default="{ row }">
              <span class="price">¥{{ row.package?.price }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="goPackageOrder(row.package)">立即预约</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="section">
        <template #header>
          <div class="section-header">
            <span>私厨推荐</span>
            <el-button
              :type="showAllChefs ? 'primary' : 'default'"
              size="small"
              @click="toggleChefView"
            >
              {{ showAllChefs ? '只看推荐' : '显示全部' }}
            </el-button>
          </div>
        </template>
        <div class="grid">
          <div v-for="chef in displayChefs" :key="getChefId(chef)" class="card-item">
            <el-avatar :size="52" :src="chef.avatar" />
            <div class="name">{{ getChefName(chef) }}</div>
            <div class="desc">{{ getCuisineDisplay(chef) }}</div>
            <div class="desc">评分：{{ chef.rating || '5.0' }}</div>
            <div class="actions-row">
              <el-button type="primary" plain @click="$router.push(`/chef/${getChefId(chef)}`)">查看详情</el-button>
              <el-button
                v-if="canFavorite"
                :type="isChefFavorited(getChefId(chef)) ? 'warning' : 'info'"
                plain
                class="btn-fav"
                @click="toggleChefFavorite(getChefId(chef))"
              >
                <el-icon class="fav-icon"><StarFilled v-if="isChefFavorited(getChefId(chef))" /><Star v-else /></el-icon>
                <span>{{ isChefFavorited(getChefId(chef)) ? '已收藏' : '收藏' }}</span>
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
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import TopNavBar from '@/components/TopNavBar.vue'
import { filterPackages, getPublicHomeData } from '@/api/public'
import { getChefRecommendations } from '@/api/recommend'
import { getFavoriteList, toggleFavorite } from '@/api/favorite'

const home = reactive({ chefs: [], packages: [], dishes: [] })
const filterForm = reactive({ mealType: null, dishCount: null, packageName: '' })
const filterRows = ref([])
const favoriteChefIds = ref(new Set())
const favoritePackageIds = ref(new Set())
const canFavorite = JSON.parse(localStorage.getItem('userRoles') || '[]')
  .some(role => ['ROLE_USER', 'ROLE_ADMIN'].includes(role))

// 推荐私厨相关状态
const recommendedChefs = ref([])
const showAllChefs = ref(false)

// 计算属性：显示私厨列表
const displayChefs = computed(() => {
  // "显示全部"：显示所有私厨
  // "只看推荐"：显示推荐的前5名
  if (showAllChefs.value) {
    return home.chefs
  }
  // 默认显示推荐的前5名
  if (recommendedChefs.value.length > 0) {
    return recommendedChefs.value.slice(0, 5)
  }
  // 没有推荐数据时显示首页的前5名
  return home.chefs.slice(0, 5)
})

// 切换"显示全部"和"只看推荐"
function toggleChefView() {
  showAllChefs.value = !showAllChefs.value
}

// 获取厨师ID（兼容推荐对象和首页对象）
function getChefId(chef) {
  return chef.chefId || chef.id
}

// 获取厨师名称（兼容推荐对象和首页对象）
function getChefName(chef) {
  // 推荐API返回 chefName，首页API返回 realName
  return chef.realName || chef.chefName || '未知厨师'
}

// 获取菜系显示（兼容两种数据结构）
function getCuisineDisplay(chef) {
  // 首页API返回的 Chef 对象有 cuisineTagDetails
  if (chef.cuisineTagDetails && chef.cuisineTagDetails.length > 0) {
    return chef.cuisineTagDetails.map(tag => tag.tagName).join(' / ')
  }
  // 推荐API返回的 ChefRecommendItemVO 有 matchedCuisines
  if (chef.matchedCuisines && chef.matchedCuisines.length > 0) {
    return chef.matchedCuisines.join(' / ')
  }
  return '暂无菜系'
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
  await loadRecommendedChefs()
}

async function loadRecommendedChefs() {
  const token = localStorage.getItem('jwtToken')
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  // 如果用户已登录，加载个性化推荐
  if (token && userInfo.id) {
    try {
      const res = await getChefRecommendations(userInfo.id)
      if (res.data && res.data.length > 0) {
        recommendedChefs.value = res.data
      }
    } catch (e) {
      console.error('加载推荐私厨失败:', e)
      recommendedChefs.value = []
    }
  } else {
    // 未登录用户不显示推荐
    recommendedChefs.value = []
  }
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
  max-width: 1200px;
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
  font-size: 19px;
  text-transform: uppercase;
}

.ai-entry {
  border-radius: 20px;
  border: 2px solid #cde4fb;
  background: linear-gradient(135deg, #a8cff5 0%, #b2c8ff 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.ai-entry::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.ai-entry:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(168, 181, 245, 0.4);
  border-color: #a5b4fc;
}

.ai-entry :deep(.el-card__body) {
  position: relative;
  z-index: 1;
  color: #ffffff;
}

.ai-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ai-entry p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  margin-bottom: 16px;
  line-height: 1.6;
}

.ai-entry .el-button {
  background: rgba(255, 255, 255, 0.95);
  color: #7c8ad4;
  border: none;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.ai-entry .el-button:hover {
  background: #ffffff;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.section {
  margin-top: 20px;
  border-radius: 16px;
  border: 1px solid #d6e9ff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* 套餐筛选表格样式 */
.package-table {
  margin-top: 12px;
}

.package-table :deep(.el-table__row) {
  cursor: pointer;
  transition: background 0.2s;
}

.package-table :deep(.el-table__row):hover {
  background: #f0f9ff;
}

.chef-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.package-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pkg-img {
  width: 60px;
  height: 45px;
  object-fit: cover;
  border-radius: 6px;
}

.pkg-info {
  flex: 1;
  min-width: 0;
}

.pkg-name {
  font-weight: 600;
  color: #123d68;
  font-size: 14px;
  margin-bottom: 4px;
}

.pkg-desc {
  color: #606266;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.price {
  color: #f56c6c;
  font-weight: 700;
  font-size: 16px;
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
