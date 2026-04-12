<template>
  <el-card>
    <template #header>用户管理</template>
    <el-table :data="users" border>
      <el-table-column prop="userId" label="用户ID" />
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="userType" label="角色" />
      <el-table-column prop="status" label="状态" />
    </el-table>
  </el-card>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getUsers } from '@/api/user'

const users = ref([])

onMounted(async () => {
  const res = await getUsers({ pageNum: 1, pageSize: 50 })
  users.value = res.data.records || []
})
</script>
