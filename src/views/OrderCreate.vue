<template>
  <div class="page" v-loading="loading">
    <TopNavBar />
    <div class="shell">
      <!-- 返回导航 -->
      <div class="back-nav">
        <el-button text @click="$router.push('/discover')">
          <el-icon><ArrowLeft /></el-icon>
          回到首页
        </el-button>
      </div>
      <el-card class="card">
        <template #header>预约下单</template>
        <el-form label-width="120px">
          <el-form-item label="私厨选择">
            <div class="chef-card selected">
              <el-avatar :size="56" :src="chef?.avatar" />
              <div class="chef-meta">
                <div class="title">{{ chef?.realName }}</div>
                <div class="sub">评分：{{ chef?.rating || '5.0' }} · 擅长：{{ cuisineNames }}</div>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="服务日期">
            <el-date-picker
                v-model="form.serviceDate"
                type="date"
                value-format="YYYY-MM-DD"
                :disabled-date="disabledDate"
                @change="onDateChange"
            />
          </el-form-item>

          <el-form-item label="选择时段">
            <div class="slot-grid">
              <div
                  v-for="slot in slotCards"
                  :key="slot.mealType"
                  class="slot-card"
                  :class="[slot.status, { selected: form.mealType === slot.mealType }]"
                  @click="chooseMealType(slot)"
              >
                <div class="slot-title">{{ slot.icon }} {{ slot.label }}</div>
                <div class="slot-time">{{ slot.timeRange }}</div>
                <div class="slot-status">{{ slot.statusLabel }}</div>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="用餐时间" required>
            <el-time-select
                v-model="form.serviceTime"
                :start="timeRange.start"
                step="00:30"
                :end="timeRange.end"
                :disabled="!form.mealType"
                :placeholder="form.mealType ? '请选择上门开始时间' : '请先选择时段'"
            />
          </el-form-item>

          <el-form-item label="选择套餐">
            <div class="package-grid">
              <div
                  v-for="item in mealPackages"
                  :key="item.packageId"
                  class="pkg-card"
                  :class="{ selected: form.packageId === item.packageId }"
                  @click="choosePackage(item)"
              >
                <img class="cover" :src="item.packageImage" alt="套餐图" />
                <div class="title">{{ item.packageName }}</div>
                <div class="sub">{{ item.dishCount }}道菜 · ¥{{ item.price }}</div>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="菜品选择">
            <el-checkbox-group v-model="form.selectedDishIds">
              <el-checkbox v-for="dish in packageDishes" :key="dish.dishId" :value="dish.dishId">{{ dish.dishName }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="食材方式">
            <el-radio-group v-model="form.ingredientOption">
              <el-radio :value="1">自备食材</el-radio>
              <el-radio :value="2">私厨代买（+20元）</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="用餐人数">
            <el-select v-model="form.persons" placeholder="请选择">
              <el-option v-for="n in [1,2,3,4,5,6,8,10]" :key="n" :label="`${n}人`" :value="n" />
            </el-select>
          </el-form-item>

          <!-- 修改的服务地址部分 -->
          <el-form-item label="服务地址" prop="addressId">
            <div class="address-select-row">
              <el-select
                  v-model="form.addressId"
                  placeholder="请选择服务地址"
                  style="flex: 1"
                  @change="onAddressChange"
              >
                <el-option
                    v-for="item in addresses"
                    :key="item.addressId"
                    :label="formatAddressLabel(item)"
                    :value="item.addressId"
                >
                  <div class="address-option">
                    <div class="address-option-header">
                      <span class="contact-info">{{ item.contactName }} {{ item.contactPhone }}</span>
                      <el-tag v-if="item.isDefault" type="success" size="small" effect="plain">默认</el-tag>
                    </div>
                    <div class="address-detail-text">
                      {{ item.province }}{{ item.city }}{{ item.district }}{{ item.detailAddress }}
                    </div>
                  </div>
                </el-option>
              </el-select>
              <el-button type="primary" @click="showAddressDialog = true">
                <el-icon><Plus /></el-icon>
                管理地址
              </el-button>
            </div>
            <div v-if="selectedAddress" class="selected-address-info">
              <el-icon><Location /></el-icon>
              <span>{{ formatAddressLabel(selectedAddress) }}</span>
            </div>
          </el-form-item>

          <el-form-item label="忌口信息">
            <el-input v-model="form.dietaryRestrictions" placeholder="例如：不吃香菜、海鲜过敏" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.specialRequests" type="textarea" :rows="3" />
          </el-form-item>
          <el-button type="primary" :loading="submitting" @click="submitOrder">提交订单</el-button>
        </el-form>
      </el-card>
    </div>

    <!-- 地址管理弹窗 -->
    <el-dialog v-model="showAddressDialog" title="管理地址" width="700px" destroy-on-close>
      <div class="address-management">
        <div class="address-list">
          <div
              v-for="item in addresses"
              :key="item.addressId"
              class="address-item"
              :class="{ 'is-default': item.isDefault }"
          >
            <div class="address-content">
              <div class="address-header">
                <div class="contact-row">
                  <span class="contact-name">{{ item.contactName }}</span>
                  <span class="contact-phone">{{ item.contactPhone }}</span>
                  <el-tag v-if="item.isDefault" type="success" size="small" effect="plain">默认</el-tag>
                </div>
                <div class="address-actions">
                  <el-button type="primary" link @click="editAddress(item)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button
                      v-if="!item.isDefault"
                      type="success"
                      link
                      @click="setDefaultAddress(item.addressId)"
                  >
                    <el-icon><Select /></el-icon>
                    设为默认
                  </el-button>
                  <el-button type="danger" link @click="deleteAddress(item.addressId)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
              <div class="address-full">
                {{ item.province }}{{ item.city }}{{ item.district }}{{ item.detailAddress }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="addresses.length === 0" class="empty-state">
          <el-empty description="暂无地址，请添加收货地址" :image-size="80">
            <el-button type="primary" @click="openAddAddress">
              <el-icon><Plus /></el-icon>
              添加地址
            </el-button>
          </el-empty>
        </div>

        <div class="add-address-btn">
          <el-button type="primary" @click="openAddAddress">
            <el-icon><Plus /></el-icon>
            新增地址
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 地址表单弹窗 -->
    <el-dialog
        v-model="showAddressForm"
        :title="editingAddress ? '编辑地址' : '新增地址'"
        width="700px"
        destroy-on-close
        append-to-body
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

        <el-form-item label="地址搜索">
          <div class="address-search-wrapper">
            <el-autocomplete
                ref="addressAutocompleteRef"
                v-model="addressSearch"
                :fetch-suggestions="fetchAddressSuggestions"
                placeholder="输入关键词搜索地址，支持智能联想"
                :debounce="500"
                clearable
                style="flex: 1"
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
                  style="width: 100%"
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
                  style="width: 100%"
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
                  style="width: 100%"
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Position, Plus, Location, Edit, Delete,
  Select, Check
} from '@element-plus/icons-vue'
import TopNavBar from '@/components/TopNavBar.vue'
import { getChefDetail } from '@/api/chef'
import { createOrder } from '@/api/order'
import { getChefSchedules } from '@/api/schedule'
import areas from 'china-area-data'
import { getUserAddresses, saveUserAddress, updateUserAddress, deleteUserAddress } from '@/api/user'
import { geocodeAddress, reverseGeocode, suggestAddress } from '@/api/map'
import { PHONE_REGEX } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const loading = ref(false)
const submitting = ref(false)
const chef = ref(null)
const allPackages = ref([])
const packageDishes = ref([])
const addresses = ref([])
const daySchedule = ref(null)
const showAddressDialog = ref(false)
const showAddressForm = ref(false)
const savingAddress = ref(false)
const locating = ref(false)
const editingAddress = ref(null)
const addressSearch = ref('')
const addressAutocompleteRef = ref()
const addressFormRef = ref()

const addressForm = reactive({
  addressId: '',
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

const provinceOptions = ref([])
const cityOptions = ref([])
const districtOptions = ref([])

// 计算选中的地址
const selectedAddress = computed(() => {
  return addresses.value.find(a => a.addressId === form.addressId) || null
})

// 地址表单验证规则
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

// 格式化地址显示
function formatAddressLabel(item) {
  if (!item) return ''
  return `${item.contactName} ${item.contactPhone} ${item.province}${item.city}${item.district}${item.detailAddress}`
}

// 地址变化处理
function onAddressChange(addressId) {
  const addr = addresses.value.find(a => a.addressId === addressId)
  if (addr) {
    console.log('选中地址:', formatAddressLabel(addr))
  }
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
  addressForm.city = ''
  addressForm.district = ''
  cityOptions.value = []
  districtOptions.value = []
  const code = Object.keys(areas['86']).find(c => areas['86'][c] === addressForm.province)
  if (code && areas[code]) {
    cityOptions.value = Object.keys(areas[code]).map(c => ({ code: c, name: areas[code][c] }))
  }
}

function onCityChange() {
  addressForm.district = ''
  districtOptions.value = []
  const cityCode = cityOptions.value.find(c => c.name === addressForm.city)?.code
  if (cityCode && areas[cityCode]) {
    districtOptions.value = Object.keys(areas[cityCode]).map(c => ({ code: c, name: areas[cityCode][c] }))
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
  if (raw.province) await updateCityOptions(raw.province)
  if (raw.city) await updateDistrictOptions(raw.city)
  const fullAddress = [raw.name, raw.address].filter(Boolean).join(' ')
  if (fullAddress) addressForm.detailAddress = fullAddress
  if (raw.lng != null && raw.lat != null) {
    addressForm.longitude = String(raw.lng)
    addressForm.latitude = String(raw.lat)
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
          const res = await reverseGeocode({ lng: longitude, lat: latitude })
          if (res.data) {
            const geo = res.data
            addressForm.province = geo.province || ''
            addressForm.city = geo.city || ''
            addressForm.district = geo.district || ''
            const prefix = `${geo.province}${geo.city}${geo.district}`
            const formatted = geo.formattedAddress || ''
            addressForm.detailAddress = formatted.startsWith(prefix) ? formatted.slice(prefix.length).trim() : formatted
            await updateCityOptions(geo.province)
            await updateDistrictOptions(geo.city)
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
        const msgs = { 1: '您拒绝了定位权限', 2: '无法获取位置信息', 3: '定位超时' }
        ElMessage.warning(error.code ? msgs[error.code] : '定位失败')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

function openAddAddress() {
  editingAddress.value = null
  Object.assign(addressForm, {
    addressId: '',
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
  addressSearch.value = ''
  cityOptions.value = []
  districtOptions.value = []
  showAddressForm.value = true
}

function editAddress(row) {
  editingAddress.value = row
  Object.assign(addressForm, {
    addressId: row.addressId,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    province: row.province,
    city: row.city,
    district: row.district,
    detailAddress: row.detailAddress,
    isDefault: row.isDefault || false,
    longitude: row.longitude || '',
    latitude: row.latitude || ''
  })
  addressSearch.value = `${row.province}${row.city}${row.district}${row.detailAddress}`
  // 更新级联选项
  updateCityOptions(row.province)
  updateDistrictOptions(row.city)
  showAddressForm.value = true
}

function resetAddressForm() {
  editingAddress.value = null
  addressSearch.value = ''
  Object.assign(addressForm, {
    addressId: '',
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

async function saveAddress() {
  if (!addressFormRef.value) return

  try {
    await addressFormRef.value.validate()

    // 如果没有经纬度，尝试地理编码
    if (!addressForm.longitude || !addressForm.latitude) {
      try {
        const full = `${addressForm.province}${addressForm.city}${addressForm.district}${addressForm.detailAddress}`
        const res = await geocodeAddress({ address: full, city: addressForm.city })
        if (res.data && res.data.lng && res.data.lat) {
          addressForm.longitude = String(res.data.lng)
          addressForm.latitude = String(res.data.lat)
        }
      } catch (e) {
        console.warn('地理编码失败:', e)
      }
    }

    savingAddress.value = true
    const data = { ...addressForm }

    if (editingAddress.value) {
      await updateUserAddress(userInfo.id, editingAddress.value.addressId, data)
      ElMessage.success('地址已更新')
    } else {
      await saveUserAddress(userInfo.id, data)
      ElMessage.success('地址已添加')
    }

    showAddressForm.value = false
    await reloadAddresses()

    // 如果新增了地址且之前没有选中地址，自动选中第一个
    if (!form.addressId && addresses.value.length > 0) {
      const defaultAddr = addresses.value.find(a => a.isDefault)
      form.addressId = defaultAddr ? defaultAddr.addressId : addresses.value[0].addressId
    }
  } catch (e) {
    if (e !== false) {
      ElMessage.error('保存地址失败')
    }
  } finally {
    savingAddress.value = false
  }
}

async function setDefaultAddress(addressId) {
  try {
    const addr = addresses.value.find(a => a.addressId === addressId)
    if (!addr) return
    
    // 先取消所有地址的默认状态
    for (const item of addresses.value) {
      if (item.isDefault && item.addressId !== addressId) {
        await updateUserAddress(userInfo.id, item.addressId, { ...item, isDefault: false })
      }
    }
    
    // 设置新地址为默认
    await updateUserAddress(userInfo.id, addressId, { ...addr, isDefault: true })
    
    addresses.value.forEach(addr => {
      addr.isDefault = addr.addressId === addressId
    })
    ElMessage.success('默认地址已更新')
  } catch (e) {
    ElMessage.error('设置失败')
  }
}

async function deleteAddress(id) {
  try {
    await ElMessageBox.confirm('确定要删除这个地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteUserAddress(userInfo.id, id)
    addresses.value = addresses.value.filter(addr => addr.addressId !== id)

    // 如果删除的是当前选中的地址，重新选择
    if (form.addressId === id) {
      const defaultAddr = addresses.value.find(a => a.isDefault)
      form.addressId = defaultAddr ? defaultAddr.addressId : (addresses.value[0]?.addressId || '')
    }

    ElMessage.success('地址已删除')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function reloadAddresses() {
  try {
    const res = await getUserAddresses(userInfo.id)
    addresses.value = res.data || []
  } catch (e) {
    console.error('加载地址失败:', e)
  }
}

const form = reactive({
  chefId: route.params.chefId,
  serviceDate: '',
  serviceTime: '',
  mealType: null,
  packageId: '',
  selectedDishIds: [],
  addressId: '',
  persons: 2,
  ingredientOption: 1,
  dietaryRestrictions: '',
  specialRequests: ''
})

const cuisineNames = computed(() => (chef.value?.cuisineTagDetails || []).map(i => i.tagName).join(' / ') || '暂无')
const mealPackages = computed(() => (form.mealType ? allPackages.value.filter(p => p.mealType === form.mealType) : allPackages.value))

const timeRange = computed(() => {
  const map = {
    1: { start: '06:00', end: '10:00' },
    2: { start: '11:00', end: '14:00' },
    3: { start: '17:00', end: '21:00' },
    4: { start: '21:00', end: '23:30' }
  }
  return map[form.mealType] || { start: '06:00', end: '23:30' }
})

const slotCards = computed(() => {
  return [
    buildSlotCard(1, '早餐', '06:00 - 10:00', '🍳', chef.value?.breakfastOpen, daySchedule.value?.breakfastStatus),
    buildSlotCard(2, '午餐', '11:00 - 14:00', '🍚', chef.value?.lunchOpen, daySchedule.value?.lunchStatus),
    buildSlotCard(3, '晚餐', '17:00 - 21:00', '🍽️', chef.value?.dinnerOpen, daySchedule.value?.dinnerStatus),
    buildSlotCard(4, '宵夜', '21:00 - 02:00', '🍢', chef.value?.snackOpen, daySchedule.value?.snackStatus)
  ]
})

function buildSlotCard(mealType, label, timeRange, icon, openFlag, status) {
  const isOpen = Number(openFlag ?? 1) === 1
  let slotStatus = 'available'
  let statusLabel = '✅ 可预约'

  if (!isOpen || Number(status) === 0) {
    slotStatus = 'closed'
    statusLabel = '🔒 未开放'
  } else if (Number(status) === 2) {
    slotStatus = 'full'
    statusLabel = '❌ 已约满'
  }

  return { mealType, label, timeRange, icon, status: slotStatus, statusLabel }
}

function disabledDate(time) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return time.getTime() <= today.getTime()
}

function chooseMealType(slot) {
  if (slot.status !== 'available') return
  form.mealType = slot.mealType
  form.serviceTime = ''
  if (!mealPackages.value.find(p => p.packageId === form.packageId)) {
    form.packageId = ''
    packageDishes.value = []
    form.selectedDishIds = []
  }
}

function choosePackage(item) {
  form.packageId = item.packageId
  packageDishes.value = item.dishes || []
  form.selectedDishIds = (item.dishes || []).slice(0, item.dishCount || 0).map(d => d.dishId)
}

async function onDateChange() {
  if (!form.serviceDate || !form.chefId) return
  const res = await getChefSchedules({ chefId: form.chefId, startDate: form.serviceDate, endDate: form.serviceDate })
  daySchedule.value = (res.data || [])[0] || null
}

async function loadData() {
  loading.value = true
  try {
    const [chefRes, addressRes] = await Promise.all([
      getChefDetail(route.params.chefId),
      getUserAddresses(userInfo.id)
    ])
    chef.value = chefRes.data.chef || null
    allPackages.value = chefRes.data.packages || []
    addresses.value = addressRes.data || []

    // 默认选中默认地址
    const defaultAddr = addresses.value.find(a => a.isDefault === true || a.isDefault === 1)
    if (defaultAddr) {
      form.addressId = defaultAddr.addressId
    } else if (addresses.value.length > 0) {
      form.addressId = addresses.value[0].addressId
    }

    const preselectPackageId = route.query.packageId
    if (preselectPackageId) {
      const target = allPackages.value.find(p => p.packageId === preselectPackageId)
      if (target) {
        form.mealType = target.mealType
        choosePackage(target)
      }
    }
  } finally {
    loading.value = false
  }
}

async function submitOrder() {
  if (!form.packageId || !form.serviceDate || !form.serviceTime || !form.addressId || !form.mealType) {
    ElMessage.warning('请先完善日期、用餐时间、时段、套餐和地址')
    return
  }
  const slot = slotCards.value.find(i => i.mealType === form.mealType)
  if (!slot || slot.status !== 'available') {
    ElMessage.warning('当前时段不可预约，请重新选择')
    return
  }
  submitting.value = true
  try {
    const res = await createOrder(userInfo.id, form)
    if (res?.code !== 200 || res?.success === false) {
      ElMessage.error(res?.message || '下单失败')
      return
    }
    ElMessage.success('订单已创建')
    router.push(`/payment/${res.data}`)
  } catch (error) {
    ElMessage.error(error?.message || error?.response?.data?.message || '下单失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => { initAreaData(); loadData() })
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f3f9ff;
}

.shell {
  max-width: var(--pc-shell-max);
  margin: 0 auto;
  padding: 18px 5% 40px;
}

.back-nav {
  margin-bottom: 16px;
}

.back-nav .el-button {
  font-size: 14px;
  color: #409eff;
}

.back-nav .el-button:hover {
  color: #66b1ff;
}

.card {
  border-radius: 20px;
}

.chef-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: 560px;
  border: 1px solid #cde4fb;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f6fbff;
}

.chef-meta {
  min-width: 0;
}

.chef-meta .title,
.chef-meta .sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected {
  border-color: #1570c9;
  box-shadow: 0 6px 14px rgba(21, 112, 201, 0.16);
}

.chef-meta .title {
  font-weight: 700;
  color: #123d68;
}

.chef-meta .sub {
  color: #456785;
  font-size: 13px;
}

/* 地址选择行 */
.address-select-row {
  display: flex;
  gap: 12px;
  width: 100%;
  align-items: center;
}

.address-option {
  padding: 4px 0;
}

.address-option-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.contact-info {
  font-weight: 500;
  color: #303133;
}

.address-detail-text {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.selected-address-info {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae0ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1677ff;
}

.selected-address-info .el-icon {
  font-size: 16px;
}

/* 地址管理弹窗 */
.address-management {
  padding: 10px 0;
}

.address-list {
  max-height: 400px;
  overflow-y: auto;
}

.address-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.address-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.address-item.is-default {
  border-color: #67c23a;
  background: #f0f9eb;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-name {
  font-weight: 600;
  color: #303133;
}

.contact-phone {
  color: #606266;
}

.address-actions {
  display: flex;
  gap: 4px;
}

.address-full {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.add-address-btn {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}

/* 地址表单弹窗 */
.address-form-dialog {
  padding: 10px 0;
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
}

.suggestion-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: #409eff;
  font-size: 16px;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 保留原有样式 */
.slot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 10px;
  width: 100%;
}

.slot-card {
  border: 1px solid #cfe6ff;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  background: #fff;
}

.slot-card .slot-title {
  font-weight: 700;
  color: #174d7b;
}

.slot-time {
  margin-top: 4px;
  color: #4c6f8e;
  font-size: 12px;
}

.slot-status {
  margin-top: 6px;
  font-size: 12px;
}

.slot-card.selected {
  border-color: #1570c9;
  box-shadow: 0 8px 20px rgba(21, 112, 201, 0.2);
}

.slot-card.full,
.slot-card.closed {
  cursor: not-allowed;
  background: #eef2f6;
  color: #90a2b3;
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  width: 100%;
}

.pkg-card {
  border: 1px solid #d0e7ff;
  border-radius: 12px;
  padding: 8px;
  cursor: pointer;
  background: #fff;
}

.pkg-card.selected {
  border-color: #1570c9;
  box-shadow: 0 8px 20px rgba(21, 112, 201, 0.2);
}

.cover {
  width: 100%;
  height: 110px;
  border-radius: 8px;
  object-fit: cover;
}

.pkg-card .title {
  margin-top: 8px;
  font-weight: 700;
}

.pkg-card .sub {
  margin-top: 4px;
  color: #4d6f8d;
  font-size: 12px;
}

@media (max-width: 960px) {
  .slot-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .address-select-row {
    flex-direction: column;
  }
}
</style>