<template>
  <el-card>
    <template #header>订单处理</template>
    <el-table :data="orders" border>
      <el-table-column prop="orderNo" label="订单号" />
      <el-table-column prop="serviceDate" label="服务日期" />
        <el-table-column prop="serviceTime" label="用餐时间" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">{{ statusText(row.status) }}</template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="金额" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" v-if="row.status === 'pending_accept'" type="primary" @click="accept(row.orderId)">接单</el-button>
          <el-button size="small" v-if="row.status === 'serving'" type="success" @click="complete(row.orderId)">完成</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getChefByUserId } from '@/api/chef'
import { acceptOrder, completeOrder, getOrders } from '@/api/order'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const chefId = ref('')
const orders = ref([])

function statusText(status) {
  return {
    unpaid: '待支付',
    pending_accept: '待接单',
    serving: '待服务',
    completed: '已完成',
    cancelled: '已取消'
  }[status] || status
}

async function loadOrders() {
  const chefRes = await getChefByUserId(userInfo.id)
  chefId.value = chefRes.data?.chefId
  if (!chefId.value) return
  const res = await getOrders({ chefId: chefId.value, page: 1, size: 20, tab: 'all' })
  orders.value = res.data.records || []
}

async function accept(orderId) {
  await acceptOrder(orderId)
  ElMessage.success('已接单')
  await loadOrders()
}

async function complete(orderId) {
  await completeOrder(orderId)
  ElMessage.success('订单已完成')
  await loadOrders()
}

onMounted(loadOrders)
</script>
