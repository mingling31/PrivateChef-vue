<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <template #header>
        <div class="header">
          <span>私厨独立注册</span>
          <el-button link @click="$router.push('/login')">返回登录</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <div class="section-title">账号信息</div>
        <el-form-item label="私厨账号" prop="chefAccount">
          <el-input v-model="form.chefAccount" placeholder="请输入私厨账号" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="登录密码" prop="chefPassword">
          <el-input v-model="form.chefPassword" type="password" show-password placeholder="请输入登录密码" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>

        <div class="section-title">个人信息</div>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" placeholder="请输入18位身份证号" maxlength="18" />
        </el-form-item>
        <el-form-item label="从业年限" prop="yearsExp">
          <el-input v-model="form.yearsExp" type="number" placeholder="请输入从业年限" :min="0" :max="50" style="width: 180px" />
        </el-form-item>
        <el-form-item label="个人介绍" prop="introduction">
          <el-input
            v-model="form.introduction"
            type="textarea"
            :rows="3"
            placeholder="请介绍一下您的烹饪经历和特长，方便管理员审核"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <div class="section-title">图片上传</div>
        <el-form-item label="厨师头像" prop="avatar">
          <div class="upload-container">
            <el-upload
              class="avatar-uploader"
              :http-request="uploadAvatar"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
            >
              <img v-if="form.avatar" :src="form.avatar" class="avatar-preview" />
              <div v-else class="avatar-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="upload-text">点击上传头像</div>
              </div>
            </el-upload>
            <div class="upload-tip" v-if="!form.avatar">支持 jpg/png/gif/webp，大小不超过 5MB</div>
            <div class="upload-tip success-tip" v-else>头像已上传</div>
          </div>
        </el-form-item>

        <el-form-item label="健康证图片" prop="healthCert">
          <div class="upload-container">
            <el-upload
              class="cert-uploader"
              :http-request="uploadHealthCert"
              :show-file-list="false"
              :before-upload="beforeCertUpload"
              accept="image/jpeg,image/png,image/jpg"
            >
              <img v-if="form.healthCert" :src="form.healthCert" class="cert-preview" />
              <div v-else class="cert-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="upload-text">点击上传健康证</div>
              </div>
            </el-upload>
            <div class="upload-tip" v-if="!form.healthCert">支持 jpg/png，大小不超过 5MB，请上传清晰照片</div>
            <div class="upload-tip success-tip" v-else>健康证已上传</div>
          </div>
        </el-form-item>

        <div class="section-title">服务信息</div>
        <el-form-item label="擅长菜系" prop="cuisineTypeList">
          <el-select v-model="form.cuisineTypeList" multiple placeholder="请至少选择一个菜系" style="width: 100%">
            <el-option v-for="tag in cuisineTags" :key="tag.tagId" :label="tag.tagName" :value="tag.tagId" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务半径(km)" prop="serviceRadius">
          <el-input v-model="form.serviceRadius" type="number" placeholder="请输入服务半径" :min="1" :max="100" style="width: 180px" />
          <span class="form-tip">超出此范围的用户将无法预约您的服务</span>
        </el-form-item>
        <el-form-item label="营业时段" prop="openSlots">
          <el-checkbox-group v-model="form.openSlots">
            <el-checkbox value="1" label="早餐" />
            <el-checkbox value="2" label="午餐" />
            <el-checkbox value="3" label="晚餐" />
            <el-checkbox value="4" label="宵夜" />
          </el-checkbox-group>
          <div class="form-tip">至少选择一个营业时段</div>
        </el-form-item>
        <el-form-item label="代买服务" prop="canPurchase">
          <el-radio-group v-model="form.canPurchase">
            <el-radio :value="1">提供代买</el-radio>
            <el-radio :value="0">不提供</el-radio>
          </el-radio-group>
          <div class="form-tip" v-if="form.canPurchase === 1">提供代买服务后，用户可选择由您代为购买食材</div>
        </el-form-item>
        <el-form-item label="代买服务费(元)" prop="purchaseFee" v-if="form.canPurchase === 1">
          <el-input-number v-model="form.purchaseFee" :min="0" :max="200" :step="1" :precision="2" />
        </el-form-item>

        <div class="section-title">服务地址</div>
        <el-form-item label="地址搜索" prop="addressSearch">
          <div class="address-search-wrapper">
            <el-autocomplete
              ref="addressAutocompleteRef"
              v-model="addressSearch"
              :fetch-suggestions="fetchAddressSuggestions"
              placeholder="输入关键词搜索地址，支持智能联想"
              :debounce="500"
              clearable
              style="width: 100%"
              @select="onAddressSelect"
            >
              <template #default="{ item }">
                <div class="suggestion-item">
                  <div class="suggestion-content">
                    <div class="suggestion-title">{{ item.value }}</div>
                    <div class="suggestion-address">{{ item.address }}</div>
                  </div>
                </div>
              </template>
            </el-autocomplete>
            <el-button type="primary" :loading="locating" @click="locateNow" class="locate-btn">
              <el-icon><Position /></el-icon> 定位
            </el-button>
          </div>
          <div class="form-tip">💡 输入地址关键词后从下拉列表中选择，可自动填充省市区</div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="省份" prop="province">
              <el-select v-model="form.province" placeholder="请选择省份" filterable @change="onProvinceChange" style="width: 100%">
                <el-option v-for="p in provinceOptions" :key="p.code" :label="p.name" :value="p.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市" prop="city">
              <el-select v-model="form.city" placeholder="请选择城市" filterable :disabled="!form.province" @change="onCityChange" style="width: 100%">
                <el-option v-for="c in cityOptions" :key="c.code" :label="c.name" :value="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区/县" prop="district">
              <el-select v-model="form.district" placeholder="请选择区县" filterable :disabled="!form.city" style="width: 100%">
                <el-option v-for="d in districtOptions" :key="d.code" :label="d.name" :value="d.name" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入详细地址，如街道、门牌号等" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit" size="large">提交审核</el-button>
          <el-button @click="resetForm" size="large">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Position } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { chefRegister } from '@/api/auth'
import { getCuisineTags } from '@/api/public'
import { uploadChefImage, uploadChefCertImage } from '@/api/chef'
import { isValidIdCard, PHONE_REGEX } from '@/utils/validators'
import { geocodeAddress, reverseGeocode, suggestAddress } from '@/api/map'
import areas from 'china-area-data'

const router = useRouter()
const loading = ref(false)
const formRef = ref()
const cuisineTags = ref([])
const locating = ref(false)
const addressSearch = ref('')
const addressAutocompleteRef = ref()
const provinceOptions = ref([])
const cityOptions = ref([])
const districtOptions = ref([])

const form = reactive({
  chefAccount: '',
  chefPassword: '',
  phone: '',
  realName: '',
  idCard: '',
  yearsExp: 1,
  introduction: '',
  healthCert: '',
  avatar: '',
  cuisineTypeList: [],
  serviceRadius: 15,
  openSlots: ['2', '3'],
  canPurchase: 0,
  purchaseFee: 20,
  province: '',
  city: '',
  district: '',
  address: ''
})

const rules = {
  chefAccount: [{ required: true, message: '请输入私厨账号', trigger: 'blur' }],
  chefPassword: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: PHONE_REGEX, message: '请输入正确的 11 位手机号', trigger: ['blur', 'change'] }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    {
      pattern: /^\d{17}[\dXx]$/,
      message: '请输入正确的18位身份证号',
      trigger: ['blur', 'change']
    }
  ],
  yearsExp: [{ required: true, message: '请输入从业年限', trigger: 'change' }],
  introduction: [
    { required: true, message: '请输入个人介绍', trigger: 'blur' },
    { min: 10, message: '个人介绍至少10个字', trigger: 'blur' }
  ],
  avatar: [{ required: true, message: '请上传厨师头像', trigger: 'change' }],
  healthCert: [{ required: true, message: '请上传健康证图片', trigger: 'change' }],
  cuisineTypeList: [{ type: 'array', required: true, message: '请至少选择一个菜系', trigger: 'change' }],
  serviceRadius: [{ required: true, message: '请设置服务半径', trigger: 'change' }],
  openSlots: [{ type: 'array', required: true, message: '请至少选择一个营业时段', trigger: 'change' }],
  province: [{ required: true, message: '请输入所在省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入所在城市', trigger: 'blur' }],
  district: [{ required: true, message: '请输入所在区/县', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  canPurchase: [{ required: true, message: '请选择是否提供代买服务', trigger: 'change' }],
  purchaseFee: [{
    validator: (_, value, callback) => {
      if (form.canPurchase === 0) return callback()
      if (value == null || value < 0) return callback(new Error('请输入代买服务费'))
      callback()
    }, trigger: ['blur', 'change']
  }]
}

async function loadCuisineTags() {
  const res = await getCuisineTags()
  cuisineTags.value = res.data || []
}

// 省市区数据初始化
function initAreaData() {
  const list = []
  for (let code in areas['86']) {
    list.push({ code, name: areas['86'][code] })
  }
  provinceOptions.value = list
}

function onProvinceChange() {
  form.city = ''
  form.district = ''
  cityOptions.value = []
  districtOptions.value = []
  const code = Object.keys(areas['86']).find(c => areas['86'][c] === form.province)
  if (code && areas[code]) {
    cityOptions.value = Object.keys(areas[code]).map(c => ({ code, name: areas[code][c] }))
  }
}

function onCityChange() {
  form.district = ''
  districtOptions.value = []
  const cityCode = cityOptions.value.find(c => c.name === form.city)?.code
  if (cityCode && areas[cityCode]) {
    districtOptions.value = Object.keys(areas[cityCode]).map(c => ({ code, name: areas[cityCode][c] }))
  }
}

async function updateCityOptions(provinceName) {
  const provinceCode = Object.keys(areas['86']).find(code => areas['86'][code] === provinceName)
  if (provinceCode && areas[provinceCode]) {
    cityOptions.value = Object.keys(areas[provinceCode]).map(c => ({ code: c, name: areas[provinceCode][c] }))
  }
}

async function updateDistrictOptions(cityName) {
  const cityCode = cityOptions.value.find(c => c.name === cityName)?.code
  if (cityCode && areas[cityCode]) {
    districtOptions.value = Object.keys(areas[cityCode]).map(c => ({ code: c, name: areas[cityCode][c] }))
  }
}

// 地址联想
async function fetchAddressSuggestions(queryString, cb) {
  const q = (queryString || '').trim()
  if (!q) {
    cb([])
    return
  }
  try {
    const res = await suggestAddress({
      query: q,
      city: form.city || undefined,
      province: form.province || undefined
    })
    if (res.code !== 200) {
      cb([])
      return
    }
    const list = (res.data || []).map(item => ({
      value: item.name,
      address: [item.district, item.address].filter(Boolean).join(' · '),
      raw: item
    }))
    cb(list)
  } catch (e) {
    console.error('地址联想失败:', e)
    cb([])
  }
}

// 选择联想地址
async function onAddressSelect(item) {
  const raw = item.raw || {}
  if (raw.province) form.province = raw.province
  if (raw.city) form.city = raw.city
  if (raw.district) form.district = raw.district
  if (raw.province) await updateCityOptions(raw.province)
  if (raw.city) await updateDistrictOptions(raw.city)
  const fullAddress = [raw.name, raw.address].filter(Boolean).join(' ')
  if (fullAddress) form.address = fullAddress
}

// 定位功能
async function locateNow() {
  if (!navigator.geolocation) {
    ElMessage.warning('当前浏览器不支持定位功能')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { longitude, latitude } = position.coords
        const res = await reverseGeocode({ lng: longitude, lat: latitude })
        if (res.data) {
          const geo = res.data
          form.province = geo.province || ''
          form.city = geo.city || ''
          form.district = geo.district || ''
          const prefix = `${geo.province}${geo.city}${geo.district}`
          const formatted = geo.formattedAddress || ''
          form.address = formatted.startsWith(prefix) ? formatted.slice(prefix.length).trim() : formatted
          await updateCityOptions(geo.province)
          await updateDistrictOptions(geo.city)
          addressSearch.value = `${geo.province}${geo.city}${geo.district}${form.address}`
        }
        ElMessage.success('定位成功')
      } catch (e) {
        ElMessage.error('定位解析失败，请手动选择')
      } finally {
        locating.value = false
      }
    },
    (error) => {
      locating.value = false
      const msgs = { 1: '您拒绝了定位权限', 2: '无法获取位置信息', 3: '定位超时' }
      ElMessage.warning(error.code ? msgs[error.code] : '定位失败')
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

// 头像上传前验证
function beforeAvatarUpload(file) {
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
  return true
}

// 健康证上传前验证
function beforeCertUpload(file) {
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
  return true
}

// 上传头像
async function uploadAvatar(options) {
  try {
    const res = await uploadChefImage(options.file)
    form.avatar = res.data
    ElMessage.success('头像上传成功')
    options.onSuccess?.(res)
  } catch (error) {
    ElMessage.error('头像上传失败，请重试')
    options.onError?.(error)
  }
}

// 上传健康证
async function uploadHealthCert(options) {
  try {
    const res = await uploadChefCertImage(options.file)
    form.healthCert = res.data
    ElMessage.success('健康证上传成功')
    options.onSuccess?.(res)
  } catch (error) {
    ElMessage.error('健康证上传失败，请重试')
    options.onError?.(error)
  }
}

function resetForm() {
  formRef.value?.resetFields()
  Object.assign(form, {
    chefAccount: '',
    chefPassword: '',
    phone: '',
    realName: '',
    idCard: '',
    yearsExp: 1,
    introduction: '',
    healthCert: '',
    avatar: '',
    cuisineTypeList: [],
    serviceRadius: 15,
    openSlots: ['2', '3'],
    canPurchase: 0,
    purchaseFee: 20,
    province: '',
    city: '',
    district: '',
    address: ''
  })
  addressSearch.value = ''
  cityOptions.value = []
  districtOptions.value = []
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await chefRegister({
      chefAccount: form.chefAccount,
      chefPassword: form.chefPassword,
      phone: form.phone,
      realName: form.realName,
      idCard: form.idCard,
      yearsExp: form.yearsExp,
      introduction: form.introduction,
      healthCert: form.healthCert,
      avatar: form.avatar,
      cuisineTypes: JSON.stringify(form.cuisineTypeList),
      serviceRadius: form.serviceRadius,
      breakfastOpen: form.openSlots.includes('1') ? 1 : 0,
      lunchOpen: form.openSlots.includes('2') ? 1 : 0,
      dinnerOpen: form.openSlots.includes('3') ? 1 : 0,
      snackOpen: form.openSlots.includes('4') ? 1 : 0,
      canPurchase: form.canPurchase,
      purchaseFee: form.canPurchase === 1 ? form.purchaseFee : 0,
      province: form.province,
      city: form.city,
      district: form.district,
      address: form.address
    })
    ElMessage.success('注册申请已提交，请等待管理员审核')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => { initAreaData(); loadCuisineTags() })
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 28px;
  background: linear-gradient(120deg, #e6f3ff, #f7fbff);
}

.card {
  max-width: 760px;
  margin: 0 auto;
  border-radius: 18px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1570c9;
  margin: 20px 0 16px 0;
  padding-left: 12px;
  border-left: 4px solid #1570c9;
  line-height: 1.2;
}

.upload-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-uploader,
.cert-uploader {
  width: 120px;
  height: 120px;
}

:deep(.avatar-uploader .el-upload),
:deep(.cert-uploader .el-upload) {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--el-fill-color-light);
  transition: all 0.3s;
}

:deep(.avatar-uploader .el-upload:hover),
:deep(.cert-uploader .el-upload:hover) {
  border-color: var(--el-color-primary);
}

.avatar-preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.cert-preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.avatar-placeholder,
.cert-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.upload-icon {
  font-size: 32px;
  color: var(--el-text-color-secondary);
}

.upload-text {
  font-size: 13px;
  text-align: center;
}

.upload-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.success-tip {
  color: var(--el-color-success);
}

.form-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-left: 8px;
  display: inline-block;
}

.address-search-wrapper {
  display: flex;
  gap: 10px;
  width: 100%;
}

.address-search-wrapper .el-autocomplete {
  flex: 1;
}

.locate-btn {
  flex-shrink: 0;
}

.suggestion-item {
  padding: 6px 0;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.suggestion-address {
  font-size: 12px;
  color: #909399;
}
</style>
