<template>
  <div class="payment-container">
    <el-card class="payment-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button text @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回订单列表
          </el-button>
          <span class="title">订单支付</span>
        </div>
      </template>

      <div v-if="order" class="order-summary">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="服务日期">{{ order.serviceDate }}</el-descriptions-item>
          <el-descriptions-item label="用餐时段">{{ mealText(order.mealType) }}</el-descriptions-item>
          <el-descriptions-item label="服务时间">{{ order.serviceTime }}</el-descriptions-item>
          <el-descriptions-item label="套餐名称">{{ order.packageName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用餐人数">{{ order.persons }}人</el-descriptions-item>
          <el-descriptions-item label="食材方式">{{ order.ingredientOption === 2 ? '私厨代买' : '自备食材' }}</el-descriptions-item>
          <el-descriptions-item label="套餐价格">¥{{ order.packagePrice }}</el-descriptions-item>
          <el-descriptions-item v-if="order.ingredientOption === 2" label="代买服务费">¥{{ order.ingredientFee }}</el-descriptions-item>
          <el-descriptions-item label="订单总金额" class="total-row">
            <span class="total-price">¥{{ order.totalAmount }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="order.status !== 'unpaid'" class="status-alert">
          <el-alert :title="statusText(order.status)" :type="statusType(order.status)" :closable="false" show-icon />
        </div>

        <div class="actions">
          <el-button size="large" @click="goBack">返回订单</el-button>
          <el-button
            type="primary"
            size="large"
            :disabled="order.status !== 'unpaid'"
            :loading="paying"
            @click="handlePay"
          >
            确认支付 ¥{{ order.totalAmount }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getOrderDetail, payOrder } from '@/api/order'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(false)
const paying = ref(false)

const mealMap = { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '宵夜' }
function mealText(t) { return mealMap[t] || '未知' }

const statusMap = {
  unpaid: { text: '待支付', type: 'warning' },
  pending_accept: { text: '已支付，待接单', type: 'success' },
  serving: { text: '服务中', type: 'primary' },
  completed: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'info' }
}
function statusText(s) { return statusMap[s]?.text || s }
function statusType(s) { return statusMap[s]?.type || 'info' }

async function loadOrder() {
  loading.value = true
  try {
    const res = await getOrderDetail(route.params.orderId)
    order.value = res.data
  } catch (e) {
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

async function handlePay() {
  try {
    await ElMessageBox.confirm('确认支付该订单？', '确认支付', {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'warning'
    })
    paying.value = true
    await payOrder(order.value.orderId)
    ElMessage.success('支付成功')
    router.push('/userCenter/orders')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('支付失败')
  } finally {
    paying.value = false
  }
}

function goBack() {
  router.push('/userCenter/orders')
}

onMounted(loadOrder)
</script>

<style scoped>
.payment-container { max-width: 800px; margin: 20px auto; padding: 0 20px; }
.payment-card { border-radius: 12px; }
.card-header { display: flex; align-items: center; gap: 16px; }
.title { font-size: 18px; font-weight: 600; }
.order-summary { padding: 8px 0; }
.total-row { font-weight: 700; }
.total-price { font-size: 20px; color: #e65a5a; }
.status-alert { margin-top: 20px; }
.actions { display: flex; justify-content: center; gap: 16px; margin-top: 24px; }
</style>
