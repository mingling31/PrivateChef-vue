<template>
  <el-card>
    <template #header>我的订单</template>
    <el-table :data="orders" border>
      <el-table-column prop="orderNo" label="订单号" min-width="160" />
      <el-table-column prop="serviceDate" label="服务日期" />
      <el-table-column prop="mealType" label="时段">
        <template #default="{ row }">{{ mealText(row.mealType) }}</template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="金额" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">{{ statusText(row.status) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="360">
        <template #default="{ row }">
          <el-button size="small" @click="showDetail(row.orderId)">详情</el-button>
          <el-button size="small" type="primary" v-if="row.status === 'unpaid'" @click="pay(row.orderId)">支付</el-button>
          <el-button size="small" type="danger" v-if="['unpaid','pending_accept'].includes(row.status)" @click="cancel(row.orderId)">取消</el-button>
          <el-button size="small" type="success" v-if="row.status === 'completed' && !row.review" @click="openReview(row)">评价</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="订单详情" width="min(920px, 92vw)" class="order-detail-dialog">
      <div v-if="currentOrder" class="detail-panel">
        <div class="order-hero">
          <div class="hero-left">
            <el-avatar :size="52" :src="currentOrder.chef?.avatar" />
            <div class="hero-meta">
              <div class="hero-title">
                <span class="hero-chef">{{ currentOrder.chef?.realName || '私厨' }}</span>
                <el-tag :type="statusTagType(currentOrder.status)" effect="light">{{ statusText(currentOrder.status) }}</el-tag>
              </div>
              <div class="hero-sub">
                {{ currentOrder.serviceDate }} {{ currentOrder.serviceTime || '' }} · {{ mealText(currentOrder.mealType) }} · {{ currentOrder.persons }}人
              </div>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-amount">¥{{ currentOrder.totalAmount }}</div>
            <div class="hero-order">订单号：{{ currentOrder.orderNo }}</div>
          </div>
        </div>

        <div class="detail-wrap">
          <div class="section">
            <div class="section-title">订单信息</div>
            <div class="kv">
              <div class="kv-item"><span class="k">创建时间</span><span class="v">{{ currentOrder.createTime }}</span></div>
              <div class="kv-item"><span class="k">备注</span><span class="v">{{ currentOrder.specialRequests || '无' }}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">服务信息</div>
            <div class="kv two-col">
              <div class="kv-item"><span class="k">服务日期</span><span class="v">{{ currentOrder.serviceDate }}</span></div>
              <div class="kv-item"><span class="k">用餐时间</span><span class="v">{{ currentOrder.serviceTime || '-' }}</span></div>
              <div class="kv-item"><span class="k">服务时段</span><span class="v">{{ mealText(currentOrder.mealType) }}</span></div>
              <div class="kv-item"><span class="k">忌口</span><span class="v">{{ currentOrder.dietaryRestrictions || '无' }}</span></div>
            </div>
          </div>

          <div class="section" v-if="currentOrder.packageInfo">
            <div class="section-title">套餐信息</div>
            <div class="pkg">
              <img class="pkg-img" :src="currentOrder.packageInfo.packageImage" alt="套餐图" />
              <div class="pkg-meta">
                <div class="pkg-name">{{ currentOrder.packageInfo.packageName }}</div>
                <div class="pkg-sub">{{ currentOrder.packageInfo.dishCount }}道菜 · ¥{{ currentOrder.packagePrice }}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">服务地址</div>
            <div class="addr">
              <div class="addr-line">
                {{ currentOrder.address?.province }}{{ currentOrder.address?.city }}{{ currentOrder.address?.district }}{{ currentOrder.address?.detailAddress }}
              </div>
              <div class="addr-sub">
                {{ currentOrder.address?.contactName }} {{ currentOrder.address?.contactPhone }}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">菜品清单</div>
            <el-table :data="currentOrder.selectedDishDetails || []" border>
              <el-table-column prop="dishName" label="菜品名称" />
              <el-table-column prop="ingredients" label="食材" />
            </el-table>
          </div>

          <div class="section">
            <div class="section-title">费用明细</div>
            <div class="kv two-col">
              <div class="kv-item"><span class="k">套餐金额</span><span class="v">¥{{ currentOrder.packagePrice }}</span></div>
              <div class="kv-item"><span class="k">食材服务费</span><span class="v">¥{{ currentOrder.ingredientFee }}</span></div>
              <div class="kv-item"><span class="k">人数</span><span class="v">{{ currentOrder.persons }} 人</span></div>
              <div class="kv-item"><span class="k">总金额</span><span class="v strong">¥{{ currentOrder.totalAmount }}</span></div>
            </div>
          </div>

          <div class="section" v-if="currentOrder.review">
            <div class="section-title">已评价</div>
            <div class="review-box">
              <div class="review-row">
                <span class="k">综合</span>
                <el-rate :model-value="currentOrder.review.rating" disabled />
              </div>
              <div class="review-row">
                <span class="k">口味</span>
                <el-rate :model-value="currentOrder.review.tasteRating" disabled />
              </div>
              <div class="review-row">
                <span class="k">服务</span>
                <el-rate :model-value="currentOrder.review.serviceRating" disabled />
              </div>
              <div class="review-content">{{ currentOrder.review.content || '（无文字评价）' }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="currentOrder?.status === 'completed' && !currentOrder?.review" type="success" @click="openReview(currentOrder)">去评价</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewVisible" title="服务评价" width="500px">
      <el-form :model="reviewForm" label-width="90px">
        <el-form-item label="综合评分"><el-rate v-model="reviewForm.rating" /></el-form-item>
        <el-form-item label="口味评分"><el-rate v-model="reviewForm.tasteRating" /></el-form-item>
        <el-form-item label="服务评分"><el-rate v-model="reviewForm.serviceRating" /></el-form-item>
        <el-form-item label="评价内容"><el-input v-model="reviewForm.content" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交评价</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { cancelOrder, getOrderDetail, getOrders, payOrder, reviewOrder } from '@/api/order'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const orders = ref([])
const dialogVisible = ref(false)
const reviewVisible = ref(false)
const currentOrder = ref(null)
const reviewingOrderId = ref('')
const reviewForm = reactive({ rating: 5, tasteRating: 5, serviceRating: 5, content: '' })

function mealText(mealType) {
  return { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '宵夜' }[mealType] || '未知'
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

async function loadOrders() {
  const res = await getOrders({ userId: userInfo.id, page: 1, size: 20, tab: 'all' })
  orders.value = res.data.records || []
}

async function showDetail(orderId) {
  const res = await getOrderDetail(orderId)
  currentOrder.value = res.data
  dialogVisible.value = true
}

async function pay(orderId) {
  await payOrder(orderId)
  ElMessage.success('支付成功')
  await loadOrders()
}

async function cancel(orderId) {
  await cancelOrder(orderId, '用户主动取消')
  ElMessage.success('订单已取消')
  await loadOrders()
}

function openReview(row) {
  reviewingOrderId.value = row.orderId
  reviewForm.rating = 5
  reviewForm.tasteRating = 5
  reviewForm.serviceRating = 5
  reviewForm.content = ''
  reviewVisible.value = true
}

async function submitReview() {
  await reviewOrder(reviewingOrderId.value, reviewForm)
  reviewVisible.value = false
  ElMessage.success('评价已提交')
  await loadOrders()
}

onMounted(loadOrders)
</script>

<style scoped>
.detail-panel {
  padding: 10px 4px 2px;
}

.detail-wrap {
  display: grid;
  gap: 14px;
}

.order-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 14px 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, #eef7ff, #ffffff);
  border: 1px solid rgba(21, 112, 201, 0.14);
  box-shadow: 0 10px 24px rgba(17, 61, 104, 0.06);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.hero-meta {
  min-width: 0;
}

.hero-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-chef {
  font-weight: 800;
  color: #123d68;
}

.hero-sub {
  margin-top: 4px;
  color: #4c6f8e;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-right {
  text-align: right;
  flex: 0 0 auto;
}

.hero-amount {
  font-size: 20px;
  font-weight: 800;
  color: #1570c9;
}

.hero-order {
  margin-top: 4px;
  font-size: 12px;
  color: #4c6f8e;
}

.section {
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid rgba(21, 112, 201, 0.14);
  box-shadow: 0 10px 24px rgba(17, 61, 104, 0.04);
  padding: 12px;
}

.section-title {
  font-weight: 800;
  color: #123d68;
  margin-bottom: 10px;
}

.kv {
  display: grid;
  gap: 10px;
}

.kv.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.kv-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.k {
  color: #4c6f8e;
  font-size: 12px;
  flex: 0 0 auto;
}

.v {
  color: #123d68;
  font-weight: 600;
  font-size: 12px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.v.strong {
  font-size: 14px;
  color: #1570c9;
}

.pkg {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  align-items: center;
}

.pkg-img {
  width: 96px;
  height: 72px;
  border-radius: 12px;
  object-fit: cover;
  background: #eef2f6;
}

.pkg-name {
  font-weight: 800;
  color: #123d68;
}

.pkg-sub {
  margin-top: 6px;
  color: #4c6f8e;
  font-size: 12px;
}

.addr-line {
  color: #123d68;
  font-weight: 700;
}

.addr-sub {
  margin-top: 6px;
  color: #4c6f8e;
  font-size: 12px;
}

.review-box {
  display: grid;
  gap: 10px;
}

.review-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.review-content {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f6fbff;
  border: 1px solid rgba(21, 112, 201, 0.12);
  color: #123d68;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.review-detail {
  display: grid;
  gap: 12px;
}

:deep(.order-detail-dialog .el-dialog__body) {
  padding-top: 8px;
}

:deep(.order-detail-dialog .el-descriptions) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(17, 61, 104, 0.06);
}

:deep(.order-detail-dialog .el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(17, 61, 104, 0.06);
}

@media (max-width: 720px) {
  .kv.two-col {
    grid-template-columns: 1fr;
  }
  .pkg {
    grid-template-columns: 1fr;
  }
  .pkg-img {
    width: 100%;
    height: 140px;
  }
  .hero-right {
    display: none;
  }
}
</style>
