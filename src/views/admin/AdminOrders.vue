<template>
  <el-card>
    <template #header>订单管理</template>
    <el-table :data="orders" border>
      <el-table-column prop="orderNo" label="订单号" />
      <el-table-column prop="userId" label="用户" />
      <el-table-column prop="chefId" label="私厨" />
      <el-table-column prop="serviceDate" label="服务日期" />
        <el-table-column prop="serviceTime" label="用餐时间" />
      <el-table-column prop="status" label="状态" />
      <el-table-column prop="totalAmount" label="金额" />
    </el-table>
  </el-card>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getOrders } from '@/api/order'

const orders = ref([])

onMounted(async () => {
  const res = await getOrders({ page: 1, size: 50, tab: 'all' })
  orders.value = res.data.records || []
})
</script>
