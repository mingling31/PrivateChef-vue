<template>
  <div class="user-profile-container">
    <!-- 个人资料卡片 -->
    <el-card class="profile-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><User /></el-icon>
          <span>个人资料</span>
        </div>
      </template>

      <el-form :model="form" :rules="profileRules" ref="profileRef" label-width="100px" class="profile-form">
        <el-form-item label="头像">
          <div class="avatar-row">
            <el-avatar :size="80" :src="form.avatar" class="user-avatar">
              {{ (form.nickname || 'U').slice(0, 1) }}
            </el-avatar>
            <el-upload
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="uploadAvatarRequest"
                class="avatar-upload"
            >
              <el-button type="primary" plain>
                <el-icon><Upload /></el-icon>
                上传头像
              </el-button>
            </el-upload>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="form.userName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称">
              <el-input v-model="form.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="saveProfile" :loading="savingProfile">
            <el-icon><Check /></el-icon>
            保存资料
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 地址管理卡片 -->
    <el-card class="address-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Location /></el-icon>
          <span>地址管理</span>
        </div>
      </template>

      <!-- 地址表格 -->
      <div class="address-table-wrapper">
        <el-table
            :data="addresses"
            style="width: 100%"
            stripe
            :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: '600' }"
        >
          <el-table-column prop="contactName" label="联系人" width="120" />
          <el-table-column prop="contactPhone" label="联系电话" width="140" />
          <el-table-column label="所在地区" width="200">
            <template #default="{ row }">
              {{ row.province }} {{ row.city }} {{ row.district }}
            </template>
          </el-table-column>
          <el-table-column prop="detailAddress" label="详细地址" min-width="250" show-overflow-tooltip />
          <el-table-column label="默认地址" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isDefault" type="success" effect="plain" size="small">
                <el-icon><CircleCheck /></el-icon>
                默认
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button type="primary" link @click="editAddress(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button
                    v-if="!row.isDefault"
                    type="success"
                    link
                    @click="setDefaultAddress(row.id)"
                >
                  <el-icon><Select /></el-icon>
                  设为默认
                </el-button>
                <el-button type="danger" link @click="deleteAddress(row.id)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="addresses.length === 0" class="empty-state">
          <el-empty description="暂无地址，请添加收货地址" :image-size="100">
            <el-button type="primary" @click="showAddressForm = true">
              <el-icon><Plus /></el-icon>
              添加地址
            </el-button>
          </el-empty>
        </div>
      </div>

      <!-- 添加地址按钮 -->
      <div class="add-address-action" v-if="addresses.length > 0">
        <el-button type="primary" @click="showAddressForm = true">
          <el-icon><Plus /></el-icon>
          新增地址
        </el-button>
      </div>

      <!-- 地址表单对话框 -->
      <el-dialog
          v-model="showAddressForm"
          :title="editingAddress ? '编辑地址' : '新增地址'"
          width="700px"
          destroy-on-close
          @closed="resetAddressForm"
      >
        <el-form
            ref="addressFormRef"
            :model="addressForm"
            :rules="addressRules"
            label-width="100px"
            class="address-form-dialog"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系人" prop="contactName">
                <el-input v-model="addressForm.contactName" placeholder="请输入联系人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号" prop="contactPhone">
                <el-input v-model="addressForm.contactPhone" placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
          </el-row>

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
                    <el-icon class="suggestion-icon"><Location /></el-icon>
                    <div class="suggestion-content">
                      <div class="suggestion-title">{{ item.value }}</div>
                      <div class="suggestion-address">{{ item.address }}</div>
                    </div>
                  </div>
                </template>
              </el-autocomplete>
              <el-button
                  type="primary"
                  :loading="locating"
                  @click="locateNow"
                  class="locate-btn"
              >
                <el-icon><Position /></el-icon>
                定位
              </el-button>
            </div>
            <div class="form-tip">💡 输入地址关键词后从下拉列表中选择，可自动填充省市区</div>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="省份" prop="province">
                <el-select
                    v-model="addressForm.province"
                    placeholder="请选择省份"
                    filterable
                    @change="onProvinceChange"
                >
                  <el-option
                      v-for="p in provinceOptions"
                      :key="p.code"
                      :label="p.name"
                      :value="p.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="城市" prop="city">
                <el-select
                    v-model="addressForm.city"
                    placeholder="请选择城市"
                    filterable
                    :disabled="!addressForm.province"
                    @change="onCityChange"
                >
                  <el-option
                      v-for="c in cityOptions"
                      :key="c.code"
                      :label="c.name"
                      :value="c.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="区县" prop="district">
                <el-select
                    v-model="addressForm.district"
                    placeholder="请选择区县"
                    filterable
                    :disabled="!addressForm.city"
                >
                  <el-option
                      v-for="d in districtOptions"
                      :key="d.code"
                      :label="d.name"
                      :value="d.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="详细地址" prop="detailAddress">
            <el-input
                v-model="addressForm.detailAddress"
                type="textarea"
                :rows="2"
                placeholder="请输入详细地址，如街道、门牌号等"
            />
          </el-form-item>

          <el-form-item label="默认地址">
            <el-switch
                v-model="addressForm.isDefault"
                active-text="设为默认地址"
                :disabled="editingAddress?.isDefault"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showAddressForm = false">取消</el-button>
            <el-button type="primary" @click="saveAddress" :loading="savingAddress">
              <el-icon><Check /></el-icon>
              保存地址
            </el-button>
          </div>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  User, Upload, Check, Location, Edit, Delete,
  Select, CircleCheck, Plus, Position
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserById, updateUser, getUserAddresses, saveUserAddress, uploadUserAvatar } from '@/api/user'
import { geocodeAddress, reverseGeocode, suggestAddress } from '@/api/map'
import { EMAIL_REGEX, PHONE_REGEX } from '@/utils/validators'
// 导入中国省市区数据（需要安装 china-area-data 或使用静态JSON）
import areas from 'china-area-data'

const storedUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
const form = reactive({
  userName: storedUser.username || storedUser.account || '',
  nickname: storedUser.nickname || storedUser.username || '',
  phone: storedUser.phone || '',
  email: storedUser.email || '',
  avatar: storedUser.avatar || ''
})

const profileRef = ref()
const addressFormRef = ref()
const addresses = ref([])
const showAddressForm = ref(false)
const savingProfile = ref(false)
const savingAddress = ref(false)
const locating = ref(false)
const editingAddress = ref(null)
const addressSearch = ref('')
const addressAutocompleteRef = ref()

// 省市区数据
const provinceOptions = ref([])
const cityOptions = ref([])
const districtOptions = ref([])

// 初始化省市区数据
function initAreaData() {
  const provinceList = []
  for (let code in areas['86']) {
    provinceList.push({
      code,
      name: areas['86'][code]
    })
  }
  provinceOptions.value = provinceList
}

function onProvinceChange() {
  addressForm.city = ''
  addressForm.district = ''
  cityOptions.value = []
  districtOptions.value = []

  const provinceCode = Object.keys(areas['86']).find(
      code => areas['86'][code] === addressForm.province
  )

  if (provinceCode && areas[provinceCode]) {
    const cityList = []
    for (let code in areas[provinceCode]) {
      cityList.push({
        code,
        name: areas[provinceCode][code]
      })
    }
    cityOptions.value = cityList
  }
}

function onCityChange() {
  addressForm.district = ''
  districtOptions.value = []

  const provinceCode = Object.keys(areas['86']).find(
      code => areas['86'][code] === addressForm.province
  )
  const cityCode = cityOptions.value.find(c => c.name === addressForm.city)?.code

  if (provinceCode && cityCode && areas[cityCode]) {
    const districtList = []
    for (let code in areas[cityCode]) {
      districtList.push({
        code,
        name: areas[cityCode][code]
      })
    }
    districtOptions.value = districtList
  }
}

const addressForm = reactive({
  id: '',
  contactName: '',
  contactPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: false,
  longitude: '',
  latitude: ''
})

const profileRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: PHONE_REGEX, message: '请输入正确的11位手机号', trigger: ['blur', 'change'] }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: EMAIL_REGEX, message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ]
}

const addressRules = {
  contactName: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2-20个字符', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: PHONE_REGEX, message: '请输入正确的11位手机号', trigger: ['blur', 'change'] }
  ],
  province: [{ required: true, message: '请选择省份', trigger: 'change' }],
  city: [{ required: true, message: '请选择城市', trigger: 'change' }],
  district: [{ required: true, message: '请选择区县', trigger: 'change' }],
  detailAddress: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '长度在5-100个字符', trigger: 'blur' }
  ]
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
      city: addressForm.city || undefined,
      province: addressForm.province || undefined
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

  if (raw.province) addressForm.province = raw.province
  if (raw.city) addressForm.city = raw.city
  if (raw.district) addressForm.district = raw.district

  // 更新级联选择器的选项
  if (raw.province) {
    await updateCityOptions(raw.province)
    if (raw.city) {
      await updateDistrictOptions(raw.city)
    }
  }

  const fullAddress = [raw.name, raw.address].filter(Boolean).join(' ')
  if (fullAddress) {
    addressForm.detailAddress = fullAddress
  }

  if (raw.lng != null && raw.lat != null) {
    addressForm.longitude = String(raw.lng)
    addressForm.latitude = String(raw.lat)
  } else {
    // 如果没有坐标，尝试地理编码
    await geocodeSelectedAddress()
  }
}

// 更新城市选项
async function updateCityOptions(provinceName) {
  const provinceCode = Object.keys(areas['86']).find(
      code => areas['86'][code] === provinceName
  )

  if (provinceCode && areas[provinceCode]) {
    const cityList = []
    for (let code in areas[provinceCode]) {
      cityList.push({
        code,
        name: areas[provinceCode][code]
      })
    }
    cityOptions.value = cityList
  }
}

// 更新区县选项
async function updateDistrictOptions(cityName) {
  const cityCode = cityOptions.value.find(c => c.name === cityName)?.code

  if (cityCode && areas[cityCode]) {
    const districtList = []
    for (let code in areas[cityCode]) {
      districtList.push({
        code,
        name: areas[cityCode][code]
      })
    }
    districtOptions.value = districtList
  }
}

// 地理编码
async function geocodeSelectedAddress() {
  try {
    const full = `${addressForm.province}${addressForm.city}${addressForm.district}${addressForm.detailAddress}`.trim()
    if (!full) return

    const res = await geocodeAddress({
      address: full,
      city: addressForm.city
    })

    if (res.data && res.data.lng && res.data.lat) {
      addressForm.longitude = String(res.data.lng)
      addressForm.latitude = String(res.data.lat)
    }
  } catch (e) {
    console.error('地理编码失败:', e)
  }
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
          addressForm.longitude = String(longitude)
          addressForm.latitude = String(latitude)

          const res = await reverseGeocode({
            lng: longitude,
            lat: latitude
          })

          if (res.data) {
            const geo = res.data
            addressForm.province = geo.province || ''
            addressForm.city = geo.city || ''
            addressForm.district = geo.district || ''
            addressForm.detailAddress = buildDetailAddress(geo)

            // 更新级联选项
            if (geo.province) await updateCityOptions(geo.province)
            if (geo.city) await updateDistrictOptions(geo.city)

            // 更新搜索框显示
            addressSearch.value = `${geo.province}${geo.city}${geo.district}${addressForm.detailAddress}`
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
        const errorMsg = {
          1: '您拒绝了定位权限',
          2: '无法获取位置信息',
          3: '定位超时'
        }
        ElMessage.warning(errorMsg[error.code] || '定位失败')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
  )
}

function buildDetailAddress(geocode) {
  const formatted = String(geocode?.formattedAddress || '').trim()
  if (!formatted) return ''

  const province = String(geocode?.province || '').trim()
  const city = String(geocode?.city || '').trim()
  const district = String(geocode?.district || '').trim()
  const prefix = `${province}${city}${district}`

  if (prefix && formatted.startsWith(prefix)) {
    return formatted.slice(prefix.length).trim() || formatted
  }
  return formatted
}

// 编辑地址
function editAddress(addr) {
  editingAddress.value = addr
  Object.assign(addressForm, {
    id: addr.id,
    contactName: addr.contactName,
    contactPhone: addr.contactPhone,
    province: addr.province,
    city: addr.city,
    district: addr.district,
    detailAddress: addr.detailAddress,
    isDefault: addr.isDefault,
    longitude: addr.longitude || '',
    latitude: addr.latitude || ''
  })

  addressSearch.value = `${addr.province}${addr.city}${addr.district}${addr.detailAddress}`

  // 更新级联选项
  updateCityOptions(addr.province)
  updateDistrictOptions(addr.city)

  showAddressForm.value = true
}

// 删除地址
async function deleteAddress(id) {
  try {
    await ElMessageBox.confirm('确定要删除这个地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // await deleteUserAddress(storedUser.id, id)
    addresses.value = addresses.value.filter(addr => addr.id !== id)
    ElMessage.success('地址已删除')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 设置默认地址
async function setDefaultAddress(id) {
  try {
    // await setDefaultUserAddress(storedUser.id, id)
    addresses.value.forEach(addr => {
      addr.isDefault = addr.id === id
    })
    ElMessage.success('默认地址已更新')
  } catch (e) {
    ElMessage.error('设置失败')
  }
}

// 保存地址
async function saveAddress() {
  try {
    await addressFormRef.value.validate()

    if (!addressForm.longitude || !addressForm.latitude) {
      await geocodeSelectedAddress()
    }

    savingAddress.value = true

    const addressData = {
      ...addressForm,
      id: addressForm.id || undefined
    }

    // await saveUserAddress(storedUser.id, addressData)

    if (editingAddress.value) {
      const index = addresses.value.findIndex(a => a.id === addressData.id)
      if (index > -1) {
        addresses.value[index] = addressData
      }
      ElMessage.success('地址已更新')
    } else {
      addressData.id = Date.now() // 临时ID
      addresses.value.push(addressData)
      ElMessage.success('地址已添加')
    }

    showAddressForm.value = false
    resetAddressForm()
  } catch (e) {
    if (e !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    savingAddress.value = false
  }
}

// 重置表单
function resetAddressForm() {
  editingAddress.value = null
  addressSearch.value = ''
  Object.assign(addressForm, {
    id: '',
    contactName: '',
    contactPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    isDefault: false,
    longitude: '',
    latitude: ''
  })
  cityOptions.value = []
  districtOptions.value = []

  if (addressFormRef.value) {
    addressFormRef.value.clearValidate()
  }
}

// 加载数据
async function loadData() {
  try {
    const [userRes, addressRes] = await Promise.all([
      getUserById(storedUser.id),
      getUserAddresses(storedUser.id)
    ])

    Object.assign(form, userRes.data || {})
    addresses.value = addressRes.data || []

    localStorage.setItem('userInfo', JSON.stringify({
      ...JSON.parse(localStorage.getItem('userInfo') || '{}'),
      ...form
    }))
  } catch (e) {
    console.error('加载用户数据失败，使用本地缓存数据:', e)
    // 使用 localStorage 中的已有数据，避免显示假数据
    form.userName = storedUser.username || storedUser.account || ''
    form.nickname = storedUser.nickname || storedUser.username || ''
    form.phone = storedUser.phone || ''
    form.email = storedUser.email || ''
    form.avatar = storedUser.avatar || ''

    addresses.value = []
  }
}

// 保存个人资料
async function saveProfile() {
  try {
    await profileRef.value.validate()
    savingProfile.value = true

    await updateUser(form)

    localStorage.setItem('userInfo', JSON.stringify({
      ...JSON.parse(localStorage.getItem('userInfo') || '{}'),
      ...form
    }))

    ElMessage.success('资料已更新')
  } catch (e) {
    if (e !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    savingProfile.value = false
  }
}

function beforeAvatarUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB')
    return false
  }
  return true
}

async function uploadAvatarRequest(options) {
  try {
    const res = await uploadUserAvatar(options.file)
    form.avatar = res.data
    await saveProfile()
    options.onSuccess(res)
  } catch (e) {
    options.onError(e)
  }
}

onMounted(() => {
  initAreaData()
  loadData()
})
</script>

<style scoped lang="scss">
.user-profile-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.profile-card,
.address-card {
  margin-bottom: 24px;
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;

  .el-icon {
    font-size: 18px;
    color: #409eff;
  }
}

.profile-form {
  max-width: 800px;

  .avatar-row {
    display: flex;
    align-items: center;
    gap: 20px;

    .user-avatar {
      border: 3px solid #f0f0f0;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
      }
    }

    .avatar-upload {
      .el-button {
        height: 40px;

        .el-icon {
          margin-right: 4px;
        }
      }
    }
  }
}

.address-table-wrapper {
  margin-bottom: 20px;

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;

    th {
      font-weight: 600;
    }

    .el-tag {
      border: none;

      .el-icon {
        margin-right: 4px;
        font-size: 12px;
      }
    }

    .text-muted {
      color: #909399;
    }
  }

  .empty-state {
    padding: 60px 0;
    text-align: center;
  }
}

.add-address-action {
  display: flex;
  justify-content: center;
  padding-top: 20px;

  .el-button {
    min-width: 120px;
    height: 40px;

    .el-icon {
      margin-right: 4px;
    }
  }
}

.address-form-dialog {
  padding: 10px 0;

  .address-search-wrapper {
    display: flex;
    gap: 10px;

    .el-autocomplete {
      flex: 1;
    }

    .locate-btn {
      flex-shrink: 0;

      .el-icon {
        margin-right: 4px;
      }
    }
  }

  .form-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }

  .suggestion-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 0;

    .suggestion-icon {
      flex-shrink: 0;
      margin-top: 2px;
      color: #409eff;
      font-size: 16px;
    }

    .suggestion-content {
      flex: 1;

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
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    min-width: 80px;

    .el-icon {
      margin-right: 4px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .user-profile-container {
    padding: 12px;
  }

  .profile-card,
  .address-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .profile-form {
    .avatar-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .address-form-dialog {
    .address-search-wrapper {
      flex-direction: column;

      .locate-btn {
        width: 100%;
      }
    }
  }
}
</style>