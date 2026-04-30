<template>
  <div class="page" v-loading="loading">
    <TopNavBar />
    <div class="shell">
      <!-- 私厨信息卡片 -->
      <el-card v-if="detail.chef" class="hero-card">
        <div class="chef-header">
          <div class="chef-info">
            <el-avatar :size="80" :src="detail.chef.avatar" class="chef-avatar" />
            <div class="chef-meta">
              <h1>{{ detail.chef.realName }}</h1>
              <p class="chef-intro">{{ detail.chef.introduction || '暂无介绍' }}</p>
              <div class="chef-tags">
                <el-tag
                    v-for="tag in detail.chef.cuisineTagDetails || []"
                    :key="tag.tagId"
                    size="small"
                    effect="plain"
                >
                  {{ tag.tagName }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="chef-rating">
            <div class="rating-score">{{ detail.chef.rating || '5.0' }}</div>
            <div class="rating-label">综合评分</div>
            <div class="rating-stars">
              <span v-for="i in 5" :key="i" class="star-item">
                {{ getStarChar(detail.chef.rating || 5, i) }}
              </span>
            </div>
          </div>
        </div>
        <div class="chef-actions">
          <el-button v-if="canOrder" type="primary" @click="goOrder">
            <el-icon><Calendar /></el-icon>
            预约这位私厨
          </el-button>
          <el-button
              v-if="canFavorite"
              :type="chefFavorited ? 'warning' : 'default'"
              @click="toggleChefFavorite"
          >
            <el-icon>
              <StarFilled v-if="chefFavorited" />
              <Star v-else />
            </el-icon>
            {{ chefFavorited ? '已收藏' : '收藏私厨' }}
          </el-button>
        </div>
      </el-card>

      <!-- 套餐列表 -->
      <el-card class="section">
        <template #header>
          <div class="section-header">
            <span>套餐列表</span>
            <span class="section-count">共 {{ (detail.packages || []).length }} 个套餐</span>
          </div>
        </template>

        <div v-if="detail.packages && detail.packages.length" class="package-grid">
          <div
              v-for="pkg in detail.packages"
              :key="pkg.packageId"
              class="package-card"
              @click="showPackageDetail(pkg)"
          >
            <div class="package-image">
              <img :src="pkg.packageImage" alt="套餐图片" />
              <div class="package-meal-tag">
                <el-tag
                    :type="mealTagType(pkg.mealType)"
                    size="small"
                    effect="dark"
                >
                  {{ mealText(pkg.mealType) }}
                </el-tag>
              </div>
            </div>
            <div class="package-content">
              <h3 class="package-name">{{ pkg.packageName }}</h3>
              <div class="package-meta">
                <span class="meta-item">{{ pkg.dishCount }}道菜</span>
                <span class="meta-item price-text">¥{{ pkg.price }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无套餐" :image-size="80" />
        </div>
      </el-card>

      <!-- 菜品列表 -->
      <el-card class="section">
        <template #header>
          <div class="section-header">
            <span>菜品列表</span>
            <span class="section-count">共 {{ (detail.dishes || []).length }} 道菜品</span>
          </div>
        </template>

        <div v-if="detail.dishes && detail.dishes.length" class="dish-grid">
          <div v-for="dish in detail.dishes" :key="dish.dishId" class="dish-card" @click="showDishDetail(dish)">
            <div class="dish-image">
              <img :src="dish.dishImage" alt="菜品图片" />
            </div>
            <div class="dish-info">
              <h4 class="dish-name">{{ dish.dishName }}</h4>
              <p class="dish-ingredients">{{ dish.ingredients || '精选食材' }}</p>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无菜品" :image-size="80" />
        </div>
      </el-card>
    </div>

    <!-- 套餐详情弹窗 -->
    <el-dialog
        v-model="showPackageDialog"
        :title="selectedPackage?.packageName || '套餐详情'"
        width="600px"
        destroy-on-close
    >
      <div v-if="selectedPackage" class="package-detail">
        <!-- 套餐基本信息 -->
        <div class="package-summary">
          <div class="package-image-large">
            <img :src="selectedPackage.packageImage" alt="套餐图片" />
          </div>
          <div class="package-info-detail">
            <h2>{{ selectedPackage.packageName }}</h2>
            <p class="package-description">{{ selectedPackage.description || '暂无描述' }}</p>
            <div class="package-tags">
              <el-tag :type="mealTagType(selectedPackage.mealType)" size="small" effect="dark">
                {{ mealText(selectedPackage.mealType) }}
              </el-tag>
              <el-tag size="small" type="info">{{ selectedPackage.dishCount }}道菜</el-tag>
              <el-tag size="small" type="danger">¥{{ selectedPackage.price }}</el-tag>
            </div>
          </div>
        </div>

        <!-- 菜品列表 -->
        <div class="dishes-section" v-if="selectedPackage.dishes && selectedPackage.dishes.length">
          <h3 class="dishes-title">包含菜品</h3>
          <div class="dishes-list">
            <div
                v-for="dish in selectedPackage.dishes"
                :key="dish.dishId"
                class="dish-item-detail"
            >
              <div class="dish-image-wrapper">
                <img :src="dish.dishImage" alt="菜品图片" />
              </div>
              <div class="dish-info-detail">
                <h4>{{ dish.dishName }}</h4>
                <div class="dish-ingredients-tags">
                  <el-tag
                      v-for="(item, index) in parseIngredients(dish.ingredients)"
                      :key="index"
                      size="small"
                  >
                    {{ item }}
                  </el-tag>
                </div>
                <p class="dish-description" v-if="dish.description">{{ dish.description }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无菜品信息" :image-size="60" />
        </div>
      </div>
    </el-dialog>

    <!-- 菜品详情弹窗 -->
    <el-dialog
        v-model="showDishDialog"
        :title="selectedDish?.dishName || '菜品详情'"
        width="500px"
        destroy-on-close
    >
      <div v-if="selectedDish" class="dish-detail-dialog">
        <div class="dish-image-display">
          <img :src="selectedDish.dishImage" alt="菜品图片" />
        </div>
        <h3>{{ selectedDish.dishName }}</h3>
        <p class="dish-desc" v-if="selectedDish.description">{{ selectedDish.description }}</p>
        <div class="ingredients-section" v-if="selectedDish.ingredients">
          <h4>食材明细</h4>
          <div class="ingredients-grid">
            <el-tag
                v-for="(item, index) in parseIngredients(selectedDish.ingredients)"
                :key="index"
                size="small"
            >
              {{ item }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Star, StarFilled } from '@element-plus/icons-vue'
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
const roles = JSON.parse(localStorage.getItem('userRoles') || '[]')
const canOrder = roles.includes('ROLE_USER')
const canFavorite = roles.some(role => ['ROLE_USER', 'ROLE_ADMIN'].includes(role))

// 弹窗相关状态
const showPackageDialog = ref(false)
const showDishDialog = ref(false)
const selectedPackage = ref(null)
const selectedDish = ref(null)

function mealText(mealType) {
  return { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '宵夜' }[mealType] || '未知'
}

function mealTagType(mealType) {
  return { 1: 'warning', 2: 'success', 3: '', 4: 'info' }[mealType] || 'info'
}

// 获取星星显示字符（支持小数点）
function getStarChar(rating, index) {
  const fullStars = Math.floor(rating)
  const decimal = rating - fullStars

  if (index <= fullStars) {
    return '⭐' // 整数部分显示实心星
  } else if (index === fullStars + 1 && decimal >= 0.5) {
    return '⭐' // 小数部分 >= 0.5 显示实心星
  } else if (index === fullStars + 1 && decimal > 0 && decimal < 0.5) {
    return '☆' // 小数部分 < 0.5 显示空心星
  } else {
    return '☆' // 其余显示空心星
  }
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

// 套餐详情弹窗
function showPackageDetail(pkg) {
  selectedPackage.value = pkg
  showPackageDialog.value = true
}

// 菜品详情弹窗
function showDishDetail(dish) {
  selectedDish.value = dish
  showDishDialog.value = true
}

// 解析食材字符串为数组
function parseIngredients(ingredients) {
  if (!ingredients) return []
  return ingredients.split(/[,，、；;]/).filter(item => item.trim())
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
  } catch {
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
  background: #f5f7fa;
}

.shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 24px 40px;
}

/* 私厨信息卡片 */
.hero-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.chef-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.chef-info {
  display: flex;
  gap: 20px;
  flex: 1;
}

.chef-avatar {
  border: 3px solid #f0f0f0;
  flex-shrink: 0;
}

.chef-meta h1 {
  font-size: 28px;
  margin: 0 0 8px;
  color: #303133;
}

.chef-intro {
  color: #606266;
  font-size: 14px;
  margin: 0 0 12px;
  line-height: 1.6;
}

.chef-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chef-rating {
  text-align: center;
  padding: 16px 24px;
  background: #f0f9ff;
  border-radius: 12px;
  flex-shrink: 0;
}

.rating-score {
  font-size: 36px;
  font-weight: 700;
  color: #1570c9;
}

.rating-label {
  font-size: 12px;
  color: #909399;
  margin: 4px 0;
}

.rating-stars {
  font-size: 16px;
  letter-spacing: 2px;
}

.star-item {
  display: inline-block;
}

.chef-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* 区域卡片 */
.section {
  margin-bottom: 20px;
  border-radius: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-count {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

/* 套餐网格 - 缩小尺寸 */
.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.package-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.package-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.package-image {
  position: relative;
  height: 130px;
  overflow: hidden;
}

.package-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.package-meal-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.package-content {
  padding: 12px;
}

.package-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-item {
  font-size: 12px;
  color: #909399;
}

.price-text {
  color: #f56c6c;
  font-weight: 600;
  font-size: 14px;
}

/* 菜品网格 */
.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.dish-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.dish-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dish-image {
  height: 130px;
  overflow: hidden;
}

.dish-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-info {
  padding: 10px 12px;
}

.dish-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px;
}

.dish-ingredients {
  font-size: 12px;
  color: #909399;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 套餐详情弹窗 - 缩小尺寸 */
.package-detail {
  padding: 0;
}

.package-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.package-image-large {
  width: 200px;
  height: 140px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.package-image-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.package-info-detail {
  flex: 1;
}

.package-info-detail h2 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 8px;
}

.package-description {
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 12px;
}

.package-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.dishes-title {
  font-size: 15px;
  color: #303133;
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.dishes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dish-item-detail {
  display: flex;
  gap: 12px;
  padding: 10px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.dish-image-wrapper {
  width: 90px;
  height: 68px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.dish-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-info-detail {
  flex: 1;
}

.dish-info-detail h4 {
  font-size: 14px;
  color: #303133;
  margin: 0 0 6px;
}

.dish-ingredients-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.dish-description {
  color: #909399;
  font-size: 12px;
  margin: 0;
}

/* 菜品详情弹窗 - 缩小尺寸 */
.dish-detail-dialog {
  text-align: center;
}

.dish-image-display {
  width: 100%;
  height: 220px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 16px;
}

.dish-image-display img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-detail-dialog h3 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 8px;
}

.dish-desc {
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 16px;
}

.ingredients-section h4 {
  font-size: 14px;
  color: #303133;
  margin: 0 0 8px;
  text-align: left;
}

.ingredients-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.empty-state {
  padding: 30px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .shell {
    padding: 16px 12px;
  }

  .chef-header {
    flex-direction: column;
  }

  .chef-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .chef-tags {
    justify-content: center;
  }

  .chef-rating {
    width: 100%;
  }

  .chef-actions {
    flex-direction: column;
  }

  .package-summary {
    flex-direction: column;
  }

  .package-image-large {
    width: 100%;
    height: 180px;
  }

  .dish-item-detail {
    flex-direction: column;
  }

  .dish-image-wrapper {
    width: 100%;
    height: 120px;
  }
}
</style>