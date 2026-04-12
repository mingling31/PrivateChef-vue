<template>
  <el-card class="page-card">
    <template #header>时段设置</template>

    <div class="form-section">
      <div class="section-title">单日设置</div>
      <el-form :model="form" label-width="88px" class="grid-form">
        <el-form-item label="日期">
          <el-date-picker v-model="form.workDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="早餐"><el-switch v-model="breakfastOn" /></el-form-item>
        <el-form-item label="午餐"><el-switch v-model="lunchOn" /></el-form-item>
        <el-form-item label="晚餐"><el-switch v-model="dinnerOn" /></el-form-item>
        <el-form-item label="宵夜"><el-switch v-model="snackOn" /></el-form-item>
      </el-form>
      <el-button type="primary" @click="saveOne">保存单日设置</el-button>
    </div>

    <el-divider />

    <div class="form-section">
      <div class="section-title">批量设置</div>
      <el-form :model="batch" label-width="88px" class="grid-form">
        <el-form-item label="开始日期">
          <el-date-picker v-model="batch.startDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="batch.endDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="适用星期" class="week-item">
          <el-checkbox-group v-model="batch.weekDays">
            <el-checkbox :value="1">周一</el-checkbox>
            <el-checkbox :value="2">周二</el-checkbox>
            <el-checkbox :value="3">周三</el-checkbox>
            <el-checkbox :value="4">周四</el-checkbox>
            <el-checkbox :value="5">周五</el-checkbox>
            <el-checkbox :value="6">周六</el-checkbox>
            <el-checkbox :value="7">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="早餐"><el-switch v-model="batch.breakfastOn" /></el-form-item>
        <el-form-item label="午餐"><el-switch v-model="batch.lunchOn" /></el-form-item>
        <el-form-item label="晚餐"><el-switch v-model="batch.dinnerOn" /></el-form-item>
        <el-form-item label="宵夜"><el-switch v-model="batch.snackOn" /></el-form-item>
      </el-form>
      <el-button type="primary" plain @click="saveBatch">保存批量设置</el-button>
    </div>

    <el-divider />

    <el-table :data="schedules" border class="result-table">
      <el-table-column prop="workDate" label="日期" />
      <el-table-column label="早餐">
        <template #default="{ row }">{{ statusText(row.breakfastStatus) }}</template>
      </el-table-column>
      <el-table-column label="午餐">
        <template #default="{ row }">{{ statusText(row.lunchStatus) }}</template>
      </el-table-column>
      <el-table-column label="晚餐">
        <template #default="{ row }">{{ statusText(row.dinnerStatus) }}</template>
      </el-table-column>
      <el-table-column label="宵夜">
        <template #default="{ row }">{{ statusText(row.snackStatus) }}</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getChefByUserId } from '@/api/chef'
import { getChefSchedules, saveChefSchedule, saveChefScheduleBatch } from '@/api/schedule'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const chefId = ref('')
const schedules = ref([])
const form = reactive({ workDate: '' })
const breakfastOn = ref(true)
const lunchOn = ref(true)
const dinnerOn = ref(false)
const snackOn = ref(false)
const batch = reactive({
  startDate: '',
  endDate: '',
  weekDays: [],
  breakfastOn: true,
  lunchOn: true,
  dinnerOn: false,
  snackOn: false
})

function statusText(status) {
  return { 0: '未开放', 1: '可预约', 2: '已约满' }[status] || '未知'
}

async function loadData() {
  const chefRes = await getChefByUserId(userInfo.id)
  chefId.value = chefRes.data?.chefId
  if (!chefId.value) return
  const res = await getChefSchedules({ chefId: chefId.value })
  schedules.value = res.data || []
}

async function saveOne() {
  if (!form.workDate) {
    ElMessage.warning('请先选择日期')
    return
  }
  await saveChefSchedule({
    chefId: chefId.value,
    workDate: form.workDate,
    breakfastStatus: breakfastOn.value ? 1 : 0,
    lunchStatus: lunchOn.value ? 1 : 0,
    dinnerStatus: dinnerOn.value ? 1 : 0,
    snackStatus: snackOn.value ? 1 : 0
  })
  ElMessage.success('排班已保存')
  await loadData()
}

async function saveBatch() {
  if (!batch.startDate || !batch.endDate) {
    ElMessage.warning('请先选择开始和结束日期')
    return
  }
  await saveChefScheduleBatch({
    chefId: chefId.value,
    startDate: batch.startDate,
    endDate: batch.endDate,
    weekDays: batch.weekDays,
    breakfastStatus: batch.breakfastOn ? 1 : 0,
    lunchStatus: batch.lunchOn ? 1 : 0,
    dinnerStatus: batch.dinnerOn ? 1 : 0,
    snackStatus: batch.snackOn ? 1 : 0
  })
  ElMessage.success('批量排班已保存')
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.page-card {
  border-radius: 16px;
}

.form-section {
  padding: 4px 0;
}

.section-title {
  font-weight: 700;
  color: #1b4d7d;
  margin-bottom: 10px;
}

.grid-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 14px;
  margin-bottom: 10px;
}

.week-item {
  grid-column: 1 / -1;
}

.result-table {
  margin-top: 4px;
}
</style>
