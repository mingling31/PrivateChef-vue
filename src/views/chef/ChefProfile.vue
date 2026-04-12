<template>
  <el-card>
    <template #header>私厨资料维护</template>
    <el-form :model="form" label-width="120px">
      <el-form-item label="头像">
        <div class="image-preview-wrap">
          <img v-if="form.avatar" :src="form.avatar" class="preview-img avatar-img" alt="厨师头像" />
          <el-avatar v-else :size="72">{{ (form.realName || 'C').slice(0, 1) }}</el-avatar>
          <el-upload :show-file-list="false" :before-upload="beforeAvatarUpload" :http-request="uploadAvatarRequest">
            <el-button type="primary" plain style="margin-left: 12px;">上传头像</el-button>
          </el-upload>
        </div>
      </el-form-item>
      <el-form-item label="真实姓名"><el-input v-model="form.realName" style="width: 300px;" /></el-form-item>
      <el-form-item label="身份证号"><el-input v-model="form.idCard" style="width: 300px;" /></el-form-item>
      <el-form-item label="健康证照片">
        <div class="image-preview-wrap">
          <img v-if="form.healthCert" :src="form.healthCert" class="preview-img cert-img" alt="健康证照片" />
          <span v-else class="empty-tip">暂无健康证照片</span>
          <el-upload :show-file-list="false" :before-upload="beforeHealthCertUpload" :http-request="uploadHealthCertRequest">
            <el-button type="primary" plain style="margin-left: 12px;">{{ form.healthCert ? '更换' : '上传' }}健康证</el-button>
          </el-upload>
        </div>
      </el-form-item>
      <el-form-item label="从业年限">
        <el-input-number v-model="form.yearsExp" :min="0" :controls="false" />
      </el-form-item>
      <el-form-item label="服务半径(km)">
        <el-input-number v-model="form.serviceRadius" :min="1" :controls="false" />
      </el-form-item>
      <el-form-item label="擅长菜系">
        <el-select v-model="form.cuisineTypeList" multiple>
          <el-option v-for="tag in cuisineTags" :key="tag.tagId" :label="tag.tagName" :value="tag.tagId" />
        </el-select>
      </el-form-item>
      <el-form-item label="代买服务">
        <el-input-number v-model="form.canPurchase" :active-value="1" :inactive-value="0" :controls="false"/>
      </el-form-item>
      <el-form-item label="代买费用"><el-input-number v-model="form.purchaseFee" :min="0" :controls="false"/></el-form-item>
      <el-form-item label="个人介绍"><el-input v-model="form.introduction" type="textarea" :rows="4" style="width: 400px;" /></el-form-item>
      <el-form-item label="所在城市"><el-input v-model="form.city" style="width: 200px;" /></el-form-item>
      <el-form-item label="所在区县"><el-input v-model="form.district" style="width: 200px;" /></el-form-item>
      <el-form-item label="详细地址"><el-input v-model="form.address" style="width: 400px;" /></el-form-item>

      <el-divider />
      <el-form-item label="早餐开放"><el-switch v-model="form.breakfastOpen" :active-value="1" :inactive-value="0" /></el-form-item>
      <el-form-item label="午餐开放"><el-switch v-model="form.lunchOpen" :active-value="1" :inactive-value="0" /></el-form-item>
      <el-form-item label="晚餐开放"><el-switch v-model="form.dinnerOpen" :active-value="1" :inactive-value="0" /></el-form-item>
      <el-form-item label="宵夜开放"><el-switch v-model="form.snackOpen" :active-value="1" :inactive-value="0" /></el-form-item>

      <el-button type="primary" @click="submit">保存资料</el-button>
      <el-tag :type="statusType" style="margin-left: 12px">{{ statusText }}</el-tag>
    </el-form>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { applyChef, getChefByUserId, uploadChefImage, uploadChefCertImage } from '@/api/chef'
import { getCuisineTags } from '@/api/public'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const cuisineTags = ref([])

// 状态映射
const statusMap = {
  pending: { text: '待审核', type: 'warning' },
  approved: { text: '已通过', type: 'success' },
  rejected: { text: '已驳回', type: 'danger' },
  disabled: { text: '已禁用', type: 'info' }
}

const statusType = computed(() => statusMap[form.status]?.type || 'info')
const statusText = computed(() => statusMap[form.status]?.text || '待审核')

function beforeAvatarUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt5M) {
    ElMessage.error('头像大小不能超过 5MB!')
  }
  return isImage && isLt5M
}

async function uploadAvatarRequest(options) {
  try {
    const res = await uploadChefImage(options.file)
    form.avatar = res.data
    ElMessage.success('头像上传成功')
    options.onSuccess(res)
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
    options.onError(error)
  }
}

function beforeHealthCertUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
  }
  return isImage && isLt5M
}

async function uploadHealthCertRequest(options) {
  try {
    const res = await uploadChefCertImage(options.file)
    form.healthCert = res.data
    ElMessage.success('健康证上传成功')
    options.onSuccess(res)
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
    options.onError(error)
  }
}

const form = reactive({
  userId: userInfo.id,
  realName: '',
  idCard: '',
  healthCert: '',
  avatar: '',
  yearsExp: 1,
  serviceRadius: 10,
  cuisineTypeList: [],
  canPurchase: 1,
  purchaseFee: 20,
  introduction: '',
  city: '',
  district: '',
  address: '',
  breakfastOpen: 1,
  lunchOpen: 1,
  dinnerOpen: 1,
  snackOpen: 0,
  status: ''
})

async function loadDetail() {
  const [chefRes, tagsRes] = await Promise.all([getChefByUserId(userInfo.id), getCuisineTags()])
  cuisineTags.value = tagsRes.data || []
  if (chefRes.data) {
    Object.assign(form, chefRes.data, { cuisineTypeList: JSON.parse(chefRes.data.cuisineTypes || '[]') })
  }
}

async function submit() {
  await applyChef({
    ...form,
    cuisineTypes: JSON.stringify(form.cuisineTypeList)
  })
  ElMessage.success('资料已提交')
  await loadDetail()
}

onMounted(loadDetail)
</script>

<style scoped>
.image-preview-wrap {
  display: flex;
  align-items: center;
}

.preview-img {
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #d6e9ff;
  background: #f7fbff;
}

.avatar-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
}

.cert-img {
  width: 260px;
  height: 150px;
  border-radius: 12px;
}

.empty-tip {
  color: #8aa5bf;
}
</style>
