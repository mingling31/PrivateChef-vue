<template>
  <el-card>
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>菜品管理</span>
        <el-button type="primary" @click="openDialog">新增菜品</el-button>
      </div>
    </template>
    <el-form :inline="true" :model="query">
      <el-form-item label="分类">
        <el-select v-model="query.dishCategory" clearable placeholder="全部" style="width: 150px;">
          <el-option label="热菜" value="热菜" />
          <el-option label="凉菜" value="凉菜" />
          <el-option label="汤" value="汤" />
          <el-option label="主食" value="主食" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="loadData">查询</el-button></el-form-item>
    </el-form>

    <el-table :data="dishes" border>
      <el-table-column label="图片" width="95">
        <template #default="{ row }"><img class="thumb" :src="row.dishImage" alt="菜品图" /></template>
      </el-table-column>
      <el-table-column prop="dishName" label="菜品名称" />
      <el-table-column prop="dishCategory" label="分类" />
      <el-table-column prop="ingredients" label="食材" />
      <el-table-column prop="isSignature" label="招牌">
        <template #default="{ row }">{{ row.isSignature ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">{{ row.status ? '启用' : '禁用' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="toggleStatus(row)">{{ row.status ? '禁用' : '启用' }}</el-button>
          <el-button size="small" type="danger" @click="remove(row.dishId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.dishId ? '编辑菜品' : '新增菜品'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="菜品名称" required>
          <el-input v-model="form.dishName" placeholder="请输入菜品名称" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="form.dishCategory" placeholder="请选择分类" style="width: 100%;">
            <el-option label="热菜" value="热菜" />
            <el-option label="凉菜" value="凉菜" />
            <el-option label="汤" value="汤" />
            <el-option label="主食" value="主食" />
          </el-select>
        </el-form-item>
        <el-form-item label="食材" required>
          <el-input v-model="form.ingredients" placeholder="请输入食材，逗号分隔" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="菜品描述">
          <el-input v-model="form.dishDescription" type="textarea" :rows="3" placeholder="请输入菜品描述" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="菜品图片" required>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img v-if="form.dishImage" :src="form.dishImage" class="preview-img" alt="菜品预览" />
            <el-upload
              :http-request="uploadImage"
              :show-file-list="false"
              :before-upload="beforeImageUpload"
              accept="image/*"
            >
              <el-button type="primary" icon="Upload">{{ form.dishImage ? '更换图片' : '上传图片' }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="招牌菜">
          <el-switch v-model="form.isSignature" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getChefByUserId } from '@/api/chef'
import { deleteDish, getChefDishes, saveDish, updateDish, uploadDishImage } from '@/api/dish'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const chefId = ref('')
const dishes = ref([])
const query = reactive({ dishCategory: '' })
const dialogVisible = ref(false)
const form = reactive({
  dishId: '',
  dishName: '',
  dishCategory: '热菜',
  ingredients: '',
  dishImage: '',
  dishDescription: '',
  isSignature: 0,
  status: 1
})

function resetForm() {
  Object.assign(form, {
    dishId: '',
    dishName: '',
    dishCategory: '热菜',
    ingredients: '',
    dishImage: '',
    dishDescription: '',
    isSignature: 0,
    status: 1
  })
}

function openDialog(row = null) {
  resetForm()
  if (row) {
    Object.assign(form, row)
  }
  dialogVisible.value = true
}

async function uploadImage(options) {
  try {
    const res = await uploadDishImage(options.file)
    form.dishImage = res.data
    ElMessage.success('图片上传成功')
    options.onSuccess(res)
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
    options.onError(error)
  }
}

function beforeImageUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}

async function loadData() {
  const chefRes = await getChefByUserId(userInfo.id)
  chefId.value = chefRes.data?.chefId
  if (!chefId.value) return
  const res = await getChefDishes(chefId.value, query.dishCategory)
  dishes.value = res.data || []
}

async function save() {
  if (!form.dishName || !form.dishCategory || !form.ingredients || !form.dishImage) {
    ElMessage.warning('请填写必填项')
    return
  }
  const payload = { ...form, chefId: chefId.value }
  if (form.dishId) {
    await updateDish(form.dishId, payload)
  } else {
    await saveDish(payload)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  resetForm()
  await loadData()
}

function edit(row) {
  Object.assign(form, row)
}

async function toggleStatus(row) {
  await updateDish(row.dishId, { ...row, status: row.status ? 0 : 1 })
  ElMessage.success('状态已更新')
  await loadData()
}

async function remove(dishId) {
  await ElMessageBox.confirm('确定要删除这道菜品吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await deleteDish(dishId)
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

.preview-img {
  width: 100px;
  height: 70px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #dcdfe6;
}
</style>
