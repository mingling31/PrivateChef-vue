<template>
  <div class="user-orders-container">
    <!-- 订单统计卡片 -->
    <div class="order-stats" v-if="orderStats">
      <div class="stat-card" :class="{ active: activeTab === 'all' }" @click="switchTab('all')">
        <div class="stat-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">全部订单</div>
          <div class="stat-value">{{ orderStats.all || 0 }}</div>
        </div>
      </div>
      <div class="stat-card" :class="{ active: activeTab === 'unpaid' }" @click="switchTab('unpaid')">
        <div class="stat-icon warning">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">待支付</div>
          <div class="stat-value">{{ orderStats.unpaid || 0 }}</div>
        </div>
      </div>
      <div class="stat-card" :class="{ active: activeTab === 'pending' }" @click="switchTab('pending')">
        <div class="stat-icon info">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">待接单</div>
          <div class="stat-value">{{ orderStats.pending || 0 }}</div>
        </div>
      </div>
      <div class="stat-card" :class="{ active: activeTab === 'serving' }" @click="switchTab('serving')">
        <div class="stat-icon primary">
          <el-icon><DishDot /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">服务中</div>
          <div class="stat-value">{{ orderStats.serving || 0 }}</div>
        </div>
      </div>
      <div class="stat-card" :class="{ active: activeTab === 'completed' }" @click="switchTab('completed')">
        <div class="stat-icon success">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">已完成</div>
          <div class="stat-value">{{ orderStats.completed || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 订单列表 -->
    <el-card class="orders-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Tickets /></el-icon>
            <span>我的订单</span>
          </div>
          <div class="header-right">
            <el-radio-group v-model="activeTab" size="small" @change="handleTabChange">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="unpaid">待支付</el-radio-button>
              <el-radio-button value="pending">待接单</el-radio-button>
              <el-radio-button value="serving">服务中</el-radio-button>
              <el-radio-button value="completed">已完成</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- 订单表格 -->
      <div class="orders-table-wrapper">
        <el-table
            :data="filteredOrders"
            style="width: 100%"
            :header-cell-style="{ background: '#fafbfc', color: '#1f2f3e', fontWeight: '600' }"
            :row-class-name="tableRowClassName"
            @row-click="handleRowClick"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-content">
                <div class="expand-section">
                  <div class="expand-title">订单信息</div>
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="订单号">{{ row.orderNo }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ row.createTime }}</el-descriptions-item>
                    <el-descriptions-item label="用餐人数">{{ row.persons }}人</el-descriptions-item>
                    <el-descriptions-item label="特殊要求">{{ row.specialRequests || '无' }}</el-descriptions-item>
                  </el-descriptions>
                </div>

                <div class="expand-section" v-if="row.packageInfo">
                  <div class="expand-title">套餐信息</div>
                  <div class="package-preview">
                    <el-image
                        :src="row.packageInfo.packageImage"
                        fit="cover"
                        class="package-image"
                    />
                    <div class="package-info">
                      <div class="package-name">{{ row.packageInfo.packageName }}</div>
                      <div class="package-desc">{{ row.packageInfo.dishCount }}道菜 · ¥{{ row.packagePrice }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="orderNo" label="订单号" min-width="180">
            <template #default="{ row }">
              <div class="order-no-cell">
                <el-icon class="order-icon"><Document /></el-icon>
                <span>{{ row.orderNo }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="serviceDate" label="服务日期" width="120">
            <template #default="{ row }">
              <div class="date-cell">
                <el-icon><Calendar /></el-icon>
                <span>{{ row.serviceDate }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="mealType" label="用餐时段" width="100">
            <template #default="{ row }">
              <el-tag :type="mealTagType(row.mealType)" effect="light" size="small">
                {{ mealText(row.mealType) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="chef" label="私厨" width="120">
            <template #default="{ row }">
              <div class="chef-cell">
                <el-avatar :size="32" :src="row.chef?.avatar" class="chef-avatar">
                  {{ (row.chef?.realName || '私').slice(0, 1) }}
                </el-avatar>
                <span>{{ row.chef?.realName || '待分配' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="totalAmount" label="订单金额" width="120" align="right">
            <template #default="{ row }">
              <span class="amount-cell">¥{{ row.totalAmount }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="订单状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" effect="dark" size="small">
                {{ statusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button
                    size="small"
                    type="info"
                    link
                    @click.stop="showDetail(row.orderId)"
                >
                  <el-icon><View /></el-icon>
                  详情
                </el-button>

                <el-button
                    v-if="row.status === 'unpaid'"
                    size="small"
                    type="primary"
                    @click.stop="pay(row.orderId)"
                >
                  <el-icon><CreditCard /></el-icon>
                  支付
                </el-button>

                <el-button
                    v-if="['unpaid', 'pending_accept'].includes(row.status)"
                    size="small"
                    type="danger"
                    link
                    @click.stop="cancel(row.orderId)"
                >
                  <el-icon><Close /></el-icon>
                  取消
                </el-button>

                <el-button
                    v-if="row.status === 'completed' && !row.review"
                    size="small"
                    type="success"
                    @click.stop="openReview(row)"
                >
                  <el-icon><Star /></el-icon>
                  评价
                </el-button>

                <el-button
                    v-if="row.status === 'completed' && row.review"
                    size="small"
                    link
                    @click.stop="viewReview(row)"
                >
                  <el-icon><View /></el-icon>
                  查看评价
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空状态 -->
        <div v-if="filteredOrders.length === 0 && !loading" class="empty-state">
          <el-empty :description="emptyDescription">
            <el-button type="primary" @click="switchTab('all')" v-if="activeTab !== 'all'">
              查看全部订单
            </el-button>
            <el-button type="primary" @click="$router.push('/chef-list')" v-else>
              <el-icon><Search /></el-icon>
              去找私厨
            </el-button>
          </el-empty>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadOrders"
            @current-change="loadOrders"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
        v-model="dialogVisible"
        title="订单详情"
        width="min(1000px, 95vw)"
        class="order-detail-dialog"
        destroy-on-close
    >
      <div v-if="currentOrder" class="detail-container">
        <!-- 订单头部 -->
        <div class="order-header">
          <div class="header-status">
            <div class="status-badge" :class="`status-${currentOrder.status}`">
              <el-icon>
                <CircleCheck v-if="currentOrder.status === 'completed'" />
                <Clock v-else-if="currentOrder.status === 'unpaid'" />
                <Timer v-else-if="currentOrder.status === 'pending_accept'" />
                <DishDot v-else />
              </el-icon>
              <span>{{ statusText(currentOrder.status) }}</span>
            </div>
            <div class="order-time">
              <el-icon><Calendar /></el-icon>
              {{ currentOrder.createTime }}
            </div>
          </div>

          <div class="header-info">
            <div class="chef-info">
              <el-avatar :size="60" :src="currentOrder.chef?.avatar" class="chef-avatar-large">
                {{ (currentOrder.chef?.realName || '私').slice(0, 1) }}
              </el-avatar>
              <div class="chef-detail">
                <div class="chef-name">{{ currentOrder.chef?.realName || '私厨' }}</div>
                <div class="chef-tags">
                  <el-tag size="small" v-if="currentOrder.chef?.specialty">
                    {{ currentOrder.chef.specialty }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="order-summary">
              <div class="order-number">订单号：{{ currentOrder.orderNo }}</div>
              <div class="order-amount">¥{{ currentOrder.totalAmount }}</div>
            </div>
          </div>
        </div>

        <!-- 订单内容 -->
        <div class="order-content">
          <!-- 左侧信息 -->
          <div class="content-left">
            <!-- 服务信息 -->
            <div class="info-section">
              <div class="section-header">
                <el-icon><InfoFilled /></el-icon>
                <span>服务信息</span>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">服务日期</span>
                  <span class="value">{{ currentOrder.serviceDate }}</span>
                </div>
                <div class="info-item">
                  <span class="label">用餐时间</span>
                  <span class="value">{{ currentOrder.serviceTime || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">服务时段</span>
                  <span class="value">{{ mealText(currentOrder.mealType) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">用餐人数</span>
                  <span class="value">{{ currentOrder.persons }}人</span>
                </div>
                <div class="info-item full-width">
                  <span class="label">饮食忌口</span>
                  <span class="value">{{ currentOrder.dietaryRestrictions || '无' }}</span>
                </div>
                <div class="info-item full-width">
                  <span class="label">特殊要求</span>
                  <span class="value">{{ currentOrder.specialRequests || '无' }}</span>
                </div>
              </div>
            </div>

            <!-- 地址信息 -->
            <div class="info-section">
              <div class="section-header">
                <el-icon><Location /></el-icon>
                <span>服务地址</span>
              </div>
              <div class="address-card">
                <div class="address-contact">
                  <span class="contact-name">{{ currentOrder.address?.contactName }}</span>
                  <span class="contact-phone">{{ currentOrder.address?.contactPhone }}</span>
                </div>
                <div class="address-detail">
                  {{ currentOrder.address?.province }}{{ currentOrder.address?.city }}
                  {{ currentOrder.address?.district }}{{ currentOrder.address?.detailAddress }}
                </div>
              </div>
            </div>

            <!-- 菜品清单 -->
            <div class="info-section">
              <div class="section-header">
                <el-icon><Food /></el-icon>
                <span>菜品清单</span>
              </div>
              <div class="dish-list">
                <div
                    v-for="(dish, index) in currentOrder.selectedDishDetails"
                    :key="index"
                    class="dish-item"
                >
                  <div class="dish-name">{{ dish.dishName }}</div>
                  <div class="dish-ingredients">{{ dish.ingredients || '时令食材' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧信息 -->
          <div class="content-right">
            <!-- 套餐信息 -->
            <div class="info-section" v-if="currentOrder.packageInfo">
              <div class="section-header">
                <el-icon><Present /></el-icon>
                <span>套餐信息</span>
              </div>
              <div class="package-card">
                <el-image
                    :src="currentOrder.packageInfo.packageImage"
                    fit="cover"
                    class="package-image-large"
                />
                <div class="package-details">
                  <div class="package-name">{{ currentOrder.packageInfo.packageName }}</div>
                  <div class="package-meta">
                    <span>{{ currentOrder.packageInfo.dishCount }}道菜</span>
                    <span class="divider">·</span>
                    <span class="price">¥{{ currentOrder.packagePrice }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 费用明细 -->
            <div class="info-section">
              <div class="section-header">
                <el-icon><Money /></el-icon>
                <span>费用明细</span>
              </div>
              <div class="fee-breakdown">
                <div class="fee-item">
                  <span class="fee-label">套餐金额</span>
                  <span class="fee-value">¥{{ currentOrder.packagePrice }}</span>
                </div>
                <div class="fee-item">
                  <span class="fee-label">食材服务费</span>
                  <span class="fee-value">¥{{ currentOrder.ingredientFee }}</span>
                </div>
                <div class="fee-item total">
                  <span class="fee-label">总计</span>
                  <span class="fee-value">¥{{ currentOrder.totalAmount }}</span>
                </div>
              </div>
            </div>

            <!-- 评价信息（简化版，只有综合评分） -->
            <div class="info-section" v-if="currentOrder.review">
              <div class="section-header">
                <el-icon><Star /></el-icon>
                <span>我的评价</span>
              </div>
              <div class="review-display">
                <div class="rating-item">
                  <span class="rating-label">综合评分</span>
                  <el-rate :model-value="currentOrder.review.rating" disabled show-score />
                </div>
                <div class="review-text" v-if="currentOrder.review.content">
                  {{ currentOrder.review.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button
              v-if="currentOrder?.status === 'unpaid'"
              type="primary"
              @click="pay(currentOrder.orderId)"
          >
            立即支付
          </el-button>
          <el-button
              v-if="currentOrder?.status === 'completed' && !currentOrder?.review"
              type="success"
              @click="openReview(currentOrder)"
          >
            去评价
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 评价对话框（简化版，只有综合评分） -->
    <el-dialog
        v-model="reviewVisible"
        title="服务评价"
        width="450px"
        class="review-dialog"
    >
      <div class="review-container">
        <div class="review-header">
          <el-avatar :size="50" :src="reviewingOrder?.chef?.avatar" />
          <div class="review-chef-info">
            <div class="chef-name">{{ reviewingOrder?.chef?.realName || '私厨' }}</div>
            <div class="order-info">
              {{ reviewingOrder?.serviceDate }} · {{ mealText(reviewingOrder?.mealType) }}
            </div>
          </div>
        </div>

        <el-form :model="reviewForm" label-width="100px" class="review-form">
          <el-form-item label="综合评分" required>
            <div class="rating-wrapper">
              <el-rate
                  v-model="reviewForm.rating"
                  :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                  :texts="['很差', '较差', '一般', '满意', '非常满意']"
                  show-text
              />
            </div>
          </el-form-item>

          <el-form-item label="评价内容">
            <el-input
                v-model="reviewForm.content"
                type="textarea"
                :rows="4"
                placeholder="分享您的用餐体验..."
                maxlength="500"
                show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reviewVisible = false">取消</el-button>
          <el-button
              type="primary"
              @click="submitReview"
              :loading="submittingReview"
              :disabled="reviewForm.rating === 0"
          >
            提交评价
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, Clock, Timer, DishDot, CircleCheck, Tickets,
  Calendar, View, CreditCard, Close, Star, Search,
  InfoFilled, Location, Food, Present, Money
} from '@element-plus/icons-vue'
import { cancelOrder, getOrderDetail, getOrders, payOrder, reviewOrder } from '@/api/order'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const orders = ref([])
const dialogVisible = ref(false)
const reviewVisible = ref(false)
const currentOrder = ref(null)
const reviewingOrder = ref(null)
const reviewingOrderId = ref('')
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const submittingReview = ref(false)
const loading = ref(false)

const reviewForm = reactive({
  rating: 5,
  content: ''
})

// 订单统计
const orderStats = computed(() => {
  const stats = {
    all: orders.value.length,
    unpaid: 0,
    pending: 0,
    serving: 0,
    completed: 0
  }

  orders.value.forEach(order => {
    if (order.status === 'unpaid') stats.unpaid++
    else if (order.status === 'pending_accept') stats.pending++
    else if (order.status === 'serving') stats.serving++
    else if (order.status === 'completed') stats.completed++
  })

  return stats
})

// 过滤后的订单 - 修复过滤逻辑
const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value

  const statusMap = {
    unpaid: 'unpaid',
    pending: 'pending_accept',
    serving: 'serving',
    completed: 'completed'
  }

  const targetStatus = statusMap[activeTab.value]
  return orders.value.filter(order => order.status === targetStatus)
})

// 空状态描述
const emptyDescription = computed(() => {
  const descriptions = {
    all: '暂无订单',
    unpaid: '暂无待支付订单',
    pending: '暂无待接单订单',
    serving: '暂无服务中订单',
    completed: '暂无已完成订单'
  }
  return descriptions[activeTab.value] || '暂无订单'
})

function mealText(mealType) {
  return { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '宵夜' }[mealType] || '未知'
}

function mealTagType(mealType) {
  return { 1: 'warning', 2: 'primary', 3: 'info', 4: '' }[mealType] || 'info'
}

function statusText(status) {
  return {
    unpaid: '待支付',
    pending_accept: '待接单',
    serving: '服务中',
    completed: '已完成',
    cancelled: '已取消'
  }[status] || status
}

function statusTagType(status) {
  return {
    unpaid: 'warning',
    pending_accept: 'info',
    serving: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }[status] || 'info'
}

function tableRowClassName({ row }) {
  if (row.status === 'cancelled') return 'cancelled-row'
  return ''
}

function switchTab(tab) {
  activeTab.value = tab
  currentPage.value = 1
  // 注意：这里不需要重新加载数据，因为 filteredOrders 是计算属性
  // 但是如果是分页数据，需要调用 loadOrders
  // loadOrders()
}

function handleTabChange() {
  currentPage.value = 1
  // 如果是分页加载，调用 loadOrders
  // loadOrders()
}

function handleRowClick(row) {
  showDetail(row.orderId)
}

async function loadOrders() {
  loading.value = true
  try {
    const res = await getOrders({
      userId: userInfo.id,
      page: currentPage.value,
      size: pageSize.value,
      tab: activeTab.value
    })
    orders.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (e) {
    // 模拟数据 - 包含不同状态的订单用于测试
    orders.value = [
      {
        orderId: '1',
        orderNo: 'ORD202401011234',
        serviceDate: '2024-01-15',
        serviceTime: '18:30',
        mealType: 3,
        persons: 4,
        totalAmount: 588,
        packagePrice: 488,
        ingredientFee: 100,
        status: 'unpaid',
        createTime: '2024-01-10 14:30',
        specialRequests: '少油少盐',
        dietaryRestrictions: '不吃辣',
        chef: {
          realName: '张师傅',
          avatar: '',
          specialty: '川菜'
        },
        packageInfo: {
          packageName: '豪华家宴套餐',
          packageImage: '',
          dishCount: 8
        },
        address: {
          contactName: '张三',
          contactPhone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detailAddress: '建国门外大街1号'
        },
        selectedDishDetails: [
          { dishName: '宫保鸡丁', ingredients: '鸡肉、花生' },
          { dishName: '水煮鱼', ingredients: '草鱼、豆芽' }
        ]
      },
      {
        orderId: '2',
        orderNo: 'ORD202401021234',
        serviceDate: '2024-01-16',
        serviceTime: '12:00',
        mealType: 2,
        persons: 2,
        totalAmount: 288,
        packagePrice: 238,
        ingredientFee: 50,
        status: 'pending_accept',
        createTime: '2024-01-11 09:30',
        specialRequests: '',
        dietaryRestrictions: '',
        chef: null,
        packageInfo: {
          packageName: '情侣双人餐',
          packageImage: '',
          dishCount: 4
        },
        address: {
          contactName: '李四',
          contactPhone: '13900139000',
          province: '上海市',
          city: '上海市',
          district: '浦东新区',
          detailAddress: '陆家嘴环路1000号'
        },
        selectedDishDetails: [
          { dishName: '黑椒牛排', ingredients: '牛肉、黑椒' },
          { dishName: '凯撒沙拉', ingredients: '生菜、鸡肉' }
        ]
      },
      {
        orderId: '3',
        orderNo: 'ORD202401031234',
        serviceDate: '2024-01-17',
        serviceTime: '19:00',
        mealType: 3,
        persons: 6,
        totalAmount: 888,
        packagePrice: 788,
        ingredientFee: 100,
        status: 'serving',
        createTime: '2024-01-12 16:00',
        specialRequests: '生日宴',
        dietaryRestrictions: '无',
        chef: {
          realName: '王师傅',
          avatar: '',
          specialty: '粤菜'
        },
        packageInfo: {
          packageName: '商务宴请套餐',
          packageImage: '',
          dishCount: 10
        },
        address: {
          contactName: '王五',
          contactPhone: '13700137000',
          province: '广东省',
          city: '广州市',
          district: '天河区',
          detailAddress: '珠江新城华夏路10号'
        },
        selectedDishDetails: [
          { dishName: '白切鸡', ingredients: '清远鸡' },
          { dishName: '清蒸石斑鱼', ingredients: '石斑鱼' }
        ]
      },
      {
        orderId: '4',
        orderNo: 'ORD202401041234',
        serviceDate: '2024-01-10',
        serviceTime: '18:00',
        mealType: 3,
        persons: 3,
        totalAmount: 388,
        packagePrice: 338,
        ingredientFee: 50,
        status: 'completed',
        createTime: '2024-01-05 11:00',
        specialRequests: '',
        dietaryRestrictions: '不吃香菜',
        chef: {
          realName: '赵师傅',
          avatar: '',
          specialty: '淮扬菜'
        },
        packageInfo: {
          packageName: '温馨家庭餐',
          packageImage: '',
          dishCount: 6
        },
        address: {
          contactName: '赵六',
          contactPhone: '13600136000',
          province: '江苏省',
          city: '南京市',
          district: '鼓楼区',
          detailAddress: '中山路100号'
        },
        selectedDishDetails: [
          { dishName: '清炖狮子头', ingredients: '猪肉、马蹄' },
          { dishName: '大煮干丝', ingredients: '豆腐干、火腿' }
        ],
        review: null
      }
    ]
    total.value = 4
  } finally {
    loading.value = false
  }
}

async function showDetail(orderId) {
  try {
    const res = await getOrderDetail(orderId)
    currentOrder.value = res.data
    dialogVisible.value = true
  } catch (e) {
    // 使用模拟数据
    currentOrder.value = orders.value.find(o => o.orderId === orderId)
    dialogVisible.value = true
  }
}

async function pay(orderId) {
  try {
    await payOrder(orderId)
    ElMessage.success('支付成功')
    await loadOrders()
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error('支付失败')
  }
}

async function cancel(orderId) {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await cancelOrder(orderId, '用户主动取消')
    ElMessage.success('订单已取消')
    await loadOrders()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

function openReview(row) {
  reviewingOrder.value = row
  reviewingOrderId.value = row.orderId
  reviewForm.rating = 5
  reviewForm.content = ''
  reviewVisible.value = true
}

function viewReview(row) {
  reviewingOrder.value = row
  showDetail(row.orderId)
}

async function submitReview() {
  if (reviewForm.rating === 0) {
    ElMessage.warning('请选择评分')
    return
  }

  submittingReview.value = true
  try {
    // 提交时只传 rating 和 content
    await reviewOrder(reviewingOrderId.value, {
      rating: reviewForm.rating,
      content: reviewForm.content
    })
    reviewVisible.value = false
    ElMessage.success('评价已提交')
    await loadOrders()
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error('提交失败')
  } finally {
    submittingReview.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped lang="scss">
.user-orders-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

// 统计卡片
.order-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
    }

    &.active {
      border-color: #409eff;
      background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);

      .stat-icon {
        background: #409eff;
        color: white;
      }
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      border-radius: 12px;
      color: #606266;
      font-size: 24px;
      transition: all 0.3s ease;

      &.warning { color: #e6a23c; }
      &.info { color: #909399; }
      &.primary { color: #409eff; }
      &.success { color: #67c23a; }
    }

    .stat-content {
      flex: 1;

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
      }
    }
  }
}

// 订单卡片
.orders-card {
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: #303133;

      .el-icon {
        font-size: 18px;
        color: #409eff;
      }
    }
  }
}

// 表格样式
.orders-table-wrapper {
  padding: 0 24px 24px;

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;

    .cancelled-row {
      background-color: #fafafa;
      color: #909399;
    }

    .el-table__expanded-cell {
      padding: 20px 40px;
      background: #fafbfc;
    }
  }

  .order-no-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .order-icon {
      color: #909399;
      font-size: 16px;
    }
  }

  .date-cell {
    display: flex;
    align-items: center;
    gap: 6px;

    .el-icon {
      color: #909399;
      font-size: 14px;
    }
  }

  .chef-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .chef-avatar {
      border: 2px solid #f0f0f0;
    }
  }

  .amount-cell {
    font-size: 16px;
    font-weight: 600;
    color: #f56c6c;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .el-button {
      .el-icon {
        margin-right: 4px;
      }
    }
  }
}

// 展开内容
.expand-content {
  .expand-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .expand-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
      padding-left: 8px;
      border-left: 3px solid #409eff;
    }

    .package-preview {
      display: flex;
      gap: 16px;
      align-items: center;

      .package-image {
        width: 80px;
        height: 60px;
        border-radius: 8px;
      }

      .package-info {
        .package-name {
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .package-desc {
          font-size: 13px;
          color: #909399;
        }
      }
    }
  }
}

// 空状态
.empty-state {
  padding: 60px 0;
}

// 分页
.pagination-wrapper {
  padding: 20px 24px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f0f0f0;
}

// 详情对话框
.order-detail-dialog {
  .detail-container {
    .order-header {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
      margin-bottom: 24px;

      .header-status {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          backdrop-filter: blur(10px);

          .el-icon {
            font-size: 16px;
          }
        }

        .order-time {
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.9;
        }
      }

      .header-info {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .chef-info {
          display: flex;
          align-items: center;
          gap: 16px;

          .chef-avatar-large {
            border: 3px solid rgba(255, 255, 255, 0.3);
          }

          .chef-detail {
            .chef-name {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 8px;
            }
          }
        }

        .order-summary {
          text-align: right;

          .order-number {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 8px;
          }

          .order-amount {
            font-size: 28px;
            font-weight: 700;
          }
        }
      }
    }

    .order-content {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 24px;

      .content-left,
      .content-right {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .info-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #f0f0f0;

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;

          .el-icon {
            color: #409eff;
            font-size: 18px;
          }
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;

            &.full-width {
              grid-column: span 2;
            }

            .label {
              font-size: 13px;
              color: #909399;
            }

            .value {
              font-size: 15px;
              color: #303133;
              font-weight: 500;
            }
          }
        }

        .address-card {
          padding: 16px;
          background: #fafbfc;
          border-radius: 8px;

          .address-contact {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 12px;

            .contact-name {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
            }

            .contact-phone {
              color: #606266;
            }
          }

          .address-detail {
            color: #606266;
            line-height: 1.6;
          }
        }

        .dish-list {
          .dish-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px dashed #f0f0f0;

            &:last-child {
              border-bottom: none;
            }

            .dish-name {
              font-weight: 500;
              color: #303133;
            }

            .dish-ingredients {
              font-size: 13px;
              color: #909399;
            }
          }
        }

        .package-card {
          .package-image-large {
            width: 100%;
            height: 160px;
            border-radius: 8px;
            margin-bottom: 16px;
          }

          .package-details {
            .package-name {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 8px;
            }

            .package-meta {
              color: #909399;

              .divider {
                margin: 0 8px;
              }

              .price {
                color: #f56c6c;
                font-weight: 600;
              }
            }
          }
        }

        .fee-breakdown {
          .fee-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px dashed #f0f0f0;

            &:last-child {
              border-bottom: none;
            }

            &.total {
              margin-top: 8px;
              padding-top: 16px;
              border-top: 2px solid #f0f0f0;

              .fee-label {
                font-size: 16px;
                font-weight: 600;
              }

              .fee-value {
                font-size: 20px;
                font-weight: 700;
                color: #f56c6c;
              }
            }

            .fee-label {
              color: #606266;
            }

            .fee-value {
              font-weight: 500;
              color: #303133;
            }
          }
        }

        .review-display {
          .rating-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0;

            .rating-label {
              color: #606266;
            }
          }

          .review-text {
            margin-top: 16px;
            padding: 16px;
            background: #fafbfc;
            border-radius: 8px;
            color: #606266;
            line-height: 1.6;
          }
        }
      }
    }
  }
}

// 评价对话框
.review-dialog {
  .review-container {
    .review-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      margin-bottom: 24px;

      .review-chef-info {
        color: white;

        .chef-name {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .order-info {
          font-size: 14px;
          opacity: 0.9;
        }
      }
    }

    .review-form {
      .rating-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;

        :deep(.el-rate__text) {
          font-size: 14px;
          font-weight: 500;
        }
      }

      :deep(.el-rate) {
        height: auto;
      }

      :deep(.el-form-item) {
        margin-bottom: 24px;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式
@media (max-width: 1200px) {
  .order-stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .order-detail-dialog .detail-container .order-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .user-orders-container {
    padding: 12px;
  }

  .order-stats {
    grid-template-columns: repeat(2, 1fr);

    .stat-card {
      padding: 16px;

      .stat-icon {
        width: 40px;
        height: 40px;
        font-size: 20px;
      }

      .stat-content .stat-value {
        font-size: 24px;
      }
    }
  }

  .orders-table-wrapper {
    padding: 0 12px 12px;
  }

  .order-detail-dialog .detail-container .order-header .header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .order-summary {
      text-align: left;
      width: 100%;
    }
  }
}
</style>