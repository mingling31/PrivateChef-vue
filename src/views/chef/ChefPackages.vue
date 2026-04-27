<template>
  <el-card>
    <template #header>套餐管理</template>

    <el-form :inline="true" :model="query">
      <el-form-item label="时段">
        <el-select v-model="query.mealType" clearable placeholder="全部" style="width: 140px">
          <el-option label="早餐" :value="1" />
          <el-option label="午餐" :value="2" />
          <el-option label="晚餐" :value="3" />
          <el-option label="宵夜" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="success" @click="openAddDialog">新增套餐</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="packages" border>
      <el-table-column label="图片" width="100">
        <template #default="{ row }">
          <img class="thumb" :src="row.packageImage || defaultImage" alt="套餐图" @error="handleImageError" />
        </template>
      </el-table-column>
      <el-table-column prop="packageName" label="套餐名称" />
      <el-table-column label="时段">
        <template #default="{ row }">{{ mealText(row.mealType) }}</template>
      </el-table-column>
      <el-table-column prop="dishCount" label="菜品数" width="90" />
      <el-table-column prop="price" label="价格(元)" width="100" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" :type="row.status ? 'warning' : 'success'" @click="toggleStatus(row)">
            {{ row.status ? '下架' : '上架' }}
          </el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="套餐名称" prop="packageName">
          <el-input v-model="form.packageName" placeholder="请输入套餐名称" />
        </el-form-item>

        <el-form-item label="时段" prop="mealType">
          <el-select v-model="form.mealType" placeholder="请选择时段">
            <el-option label="早餐" :value="1" />
            <el-option label="午餐" :value="2" />
            <el-option label="晚餐" :value="3" />
            <el-option label="宵夜" :value="4" />
          </el-select>
        </el-form-item>

        <el-form-item label="菜品数量" prop="dishCount">
          <el-select v-model="form.dishCount" placeholder="请选择菜品数量">
            <el-option v-for="n in [3, 4, 5, 6]" :key="n" :label="`${n}菜`" :value="n" />
          </el-select>
        </el-form-item>

        <el-form-item label="价格" prop="price">
          <el-input v-model="form.price" placeholder="请输入价格" type="number" :min="0" :step="0.01">
            <template #append>元</template>
          </el-input>
        </el-form-item>

        <el-form-item label="套餐图片" prop="packageImage">
          <div class="upload-container">
            <el-upload
              class="uploader"
              :http-request="uploadImage"
              :show-file-list="false"
              :before-upload="beforeUpload"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
            >
              <img v-if="form.packageImage" :src="form.packageImage" class="preview" />
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">支持 jpg/png/gif/webp，大小不超过 5MB</div>
          </div>
        </el-form-item>

        <el-form-item label="套餐描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入套餐描述" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="上架"
            inactive-text="下架"
          />
        </el-form-item>

        <el-form-item label="可选菜品" prop="selectedDishIds">
          <el-select
            v-model="form.selectedDishIds"
            multiple
            filterable
            placeholder="请选择菜品"
            style="width: 100%"
          >
            <el-option
              v-for="dish in dishes"
              :key="dish.dishId"
              :label="dishOptionLabel(dish)"
              :value="dish.dishId"
            />
          </el-select>
          <div class="form-tip">可多选，保存时会按你选择的菜品建立套餐关联。</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getChefByUserId } from '@/api/chef'
import { getChefDishes } from '@/api/dish'
import { deleteChefPackage, getChefPackages, saveChefPackage, updateChefPackage, uploadPackageImage } from '@/api/package'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')

const chefId = ref('')
const dishes = ref([])
const packages = ref([])
const query = reactive({ mealType: null })
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref(null)
const defaultImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80">
      <rect width="100%" height="100%" fill="#eef6ff"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#7f9db9" font-size="12">暂无图片</text>
    </svg>`
  )

const form = reactive({
  packageId: '',
  packageName: '',
  mealType: 2,
  dishCount: 3,
  price: 0,
  packageImage: '',
  description: '',
  status: 1,
  selectedDishIds: []
})

const formRules = {
  packageName: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  mealType: [{ required: true, message: '请选择时段', trigger: 'change' }],
  dishCount: [{ required: true, message: '请选择菜品数量', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  packageImage: [{ required: true, message: '请上传套餐图片', trigger: 'change' }],
  selectedDishIds: [{ required: true, type: 'array', min: 1, message: '请选择菜品', trigger: 'change' }]
}

const dialogTitle = computed(() => (form.packageId ? '编辑套餐' : '新增套餐'))

function resetForm() {
  Object.assign(form, {
    packageId: '',
    packageName: '',
    mealType: 2,
    dishCount: 3,
    price: 0,
    packageImage: '',
    description: '',
    status: 1,
    selectedDishIds: []
  })
}

function mealText(mealType) {
  return { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '宵夜' }[mealType] || '未知'
}

function dishOptionLabel(dish) {
  return dish?.dishName || ''
}

function handleImageError(e) {
  if (e?.target) {
    e.target.onerror = null
    e.target.src = defaultImage
  }
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  saving.value = true
  return true
}

async function uploadImage(options) {
  try {
    const res = await uploadPackageImage(options.file)
    form.packageImage = res.data
    ElMessage.success('图片上传成功')
    options.onSuccess?.(res)
  } catch (error) {
    ElMessage.error('图片上传失败，请重试')
    options.onError?.(error)
  } finally {
    saving.value = false
  }
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

function openAddDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row) {
  Object.assign(form, {
    packageId: row.packageId,
    packageName: row.packageName,
    mealType: row.mealType,
    dishCount: row.dishCount,
    price: row.price,
    packageImage: row.packageImage || '',
    description: row.description || '',
    status: row.status,
    selectedDishIds: (row.dishes || []).map(item => item.dishId)
  })
  dialogVisible.value = true
}

function handleDialogClose() {
  resetForm()
  formRef.value?.resetFields()
}

async function save() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  if (form.selectedDishIds.length < form.dishCount) {
    ElMessage.warning(`套餐需要 ${form.dishCount} 个菜品，当前仅选择 ${form.selectedDishIds.length} 个`)
    return
  }

  saving.value = true
  try {
    const selectedDishes = dishes.value.filter(item => form.selectedDishIds.includes(item.dishId))
    const payload = {
      chefId: chefId.value,
      packageName: form.packageName,
      mealType: form.mealType,
      dishCount: form.dishCount,
      price: Number(form.price || 0),
      packageImage: form.packageImage,
      description: form.description,
      status: form.status,
      dishes: selectedDishes
    }

    if (form.packageId) {
      await updateChefPackage(form.packageId, payload)
    } else {
      await saveChefPackage(payload)
    }

    ElMessage.success('套餐已保存')
    dialogVisible.value = false
    resetForm()
    await loadData()
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row) {
  await updateChefPackage(row.packageId, { ...row, status: row.status ? 0 : 1 })
  ElMessage.success('状态已更新')
  await loadData()
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(`确定要删除套餐“${row.packageName}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteChefPackage(row.packageId)
    ElMessage.success('删除成功')
    await loadData()
  } catch {
    // 用户取消
  }
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

.upload-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.uploader {
  width: 120px;
  height: 120px;
}

:deep(.uploader .el-upload) {
  width: 120px;
  height: 120px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--el-fill-color-light);
}

.preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.uploader-icon {
  font-size: 28px;
  color: var(--el-text-color-secondary);
}

.upload-tip,
.form-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
