<template>
  <el-card>
    <template #header>套餐管理</template>
    <el-form :inline="true" :model="query">
      <el-form-item label="时段">
        <el-select v-model="query.mealType" clearable placeholder="全部">
          <el-option label="早餐" :value="1" />
          <el-option label="午餐" :value="2" />
          <el-option label="晚餐" :value="3" />
          <el-option label="宵夜" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="loadData">查询</el-button></el-form-item>
    </el-form>

    <el-form :inline="true" :model="form">
      <el-form-item><el-input v-model="form.packageName" placeholder="套餐名称" /></el-form-item>
      <el-form-item>
        <el-select v-model="form.mealType" placeholder="时段">
          <el-option label="早餐" :value="1" />
          <el-option label="午餐" :value="2" />
          <el-option label="晚餐" :value="3" />
          <el-option label="宵夜" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="form.dishCount" placeholder="菜品数量">
          <el-option v-for="n in [3,4,5,6]" :key="n" :label="`${n}菜`" :value="n" />
        </el-select>
      </el-form-item>
      <el-form-item><el-input v-model="form.price" placeholder="价格" /></el-form-item>
      <el-form-item><el-input v-model="form.packageImage" placeholder="套餐图片地址" /></el-form-item>
      <el-form-item><el-input v-model="form.description" placeholder="套餐描述" /></el-form-item>
      <el-form-item><el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" /></el-form-item>
      <el-form-item>
        <el-select v-model="form.selectedDishIds" multiple placeholder="可选菜品">
          <el-option v-for="dish in dishes" :key="dish.dishId" :label="dish.dishName" :value="dish.dishId" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="save">保存套餐</el-button></el-form-item>
    </el-form>

    <el-table :data="packages" border>
      <el-table-column label="图片" width="95">
        <template #default="{ row }"><img class="thumb" :src="row.packageImage" alt="套餐图" /></template>
      </el-table-column>
      <el-table-column prop="packageName" label="套餐名称" />
      <el-table-column label="时段">
        <template #default="{ row }">{{ mealText(row.mealType) }}</template>
      </el-table-column>
      <el-table-column prop="dishCount" label="菜品数" />
      <el-table-column prop="price" label="价格" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">{{ row.status ? '上架' : '下架' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" @click="edit(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="toggleStatus(row)">{{ row.status ? '下架' : '上架' }}</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getChefByUserId } from '@/api/chef'
import { getChefDishes } from '@/api/dish'
import { deleteChefPackage, getChefPackages, saveChefPackage, updateChefPackage } from '@/api/package'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const chefId = ref('')
const dishes = ref([])
const packages = ref([])
const query = reactive({ mealType: null })
const form = reactive({
  packageId: '',
  packageName: '',
  mealType: 2,
  dishCount: 3,
  price: '',
  packageImage: '',
  description: '',
  status: 1,
  selectedDishIds: []
})

function resetForm() {
  Object.assign(form, {
    packageId: '',
    packageName: '',
    mealType: 2,
    dishCount: 3,
    price: '',
    packageImage: '',
    description: '',
    status: 1,
    selectedDishIds: []
  })
}

function mealText(mealType) {
  return { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '宵夜' }[mealType] || '未知'
}

async function loadData() {
  const chefRes = await getChefByUserId(userInfo.id)
  chefId.value = chefRes.data?.chefId
  if (!chefId.value) return
  const [dishRes, packageRes] = await Promise.all([
    getChefDishes(chefId.value),
    getChefPackages(chefId.value, query.mealType)
  ])
  dishes.value = dishRes.data || []
  packages.value = packageRes.data || []
}

async function save() {
  const payload = {
    chefId: chefId.value,
    packageName: form.packageName,
    mealType: form.mealType,
    dishCount: form.dishCount,
    price: Number(form.price || 0),
    packageImage: form.packageImage,
    description: form.description,
    status: form.status,
    dishes: dishes.value.filter(item => form.selectedDishIds.includes(item.dishId))
  }
  if (form.packageId) {
    await updateChefPackage(form.packageId, payload)
  } else {
    await saveChefPackage(payload)
  }
  ElMessage.success('套餐已保存')
  resetForm()
  await loadData()
}

function edit(row) {
  Object.assign(form, {
    packageId: row.packageId,
    packageName: row.packageName,
    mealType: row.mealType,
    dishCount: row.dishCount,
    price: row.price,
    packageImage: row.packageImage,
    description: row.description,
    status: row.status,
    selectedDishIds: (row.dishes || []).map(item => item.dishId)
  })
}

async function toggleStatus(row) {
  await updateChefPackage(row.packageId, { ...row, status: row.status ? 0 : 1 })
  ElMessage.success('状态已更新')
  await loadData()
}

async function remove(row) {
  await deleteChefPackage(row.packageId)
  ElMessage.success('删除成功')
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.thumb {
  width: 62px;
  height: 42px;
  border-radius: 6px;
  object-fit: cover;
}
</style>
