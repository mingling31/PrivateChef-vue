<template>
  <el-card>
    <template #header>私厨审核</template>
    <el-radio-group v-model="status" @change="loadData" style="margin-bottom: 16px">
      <el-radio-button label="">全部</el-radio-button>
      <el-radio-button label="pending">待审核</el-radio-button>
      <el-radio-button label="approved">已通过</el-radio-button>
      <el-radio-button label="rejected">已驳回</el-radio-button>
    </el-radio-group>
    <el-table :data="chefs" border>
      <el-table-column prop="chefId" label="私厨ID" />
      <el-table-column prop="realName" label="姓名" />
      <el-table-column prop="city" label="城市" />
      <el-table-column prop="status" label="状态" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="review(row.chefId, 'approved')">通过</el-button>
          <el-button size="small" type="danger" @click="review(row.chefId, 'rejected')">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getChefApplications, reviewChef } from '@/api/admin'

const chefs = ref([])
const status = ref('pending')

async function loadData() {
  const res = await getChefApplications(status.value)
  chefs.value = res.data || []
}

async function review(chefId, nextStatus) {
  await reviewChef(chefId, { status: nextStatus })
  ElMessage.success('审核完成')
  await loadData()
}

onMounted(loadData)
</script>
