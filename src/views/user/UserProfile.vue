<template>
  <el-card>
    <template #header>个人资料与地址管理</template>
    <el-form :model="form" :rules="profileRules" ref="profileRef" label-width="100px">
      <el-form-item label="头像">
        <div class="avatar-row">
          <el-avatar :size="72" :src="form.avatar">{{ (form.nickname || 'U').slice(0, 1) }}</el-avatar>
          <el-upload :show-file-list="false" :before-upload="beforeAvatarUpload" :http-request="uploadAvatarRequest">
            <el-button type="primary" plain>上传头像</el-button>
          </el-upload>
        </div>
      </el-form-item>
      <el-form-item label="用户名"><el-input v-model="form.userName" disabled /></el-form-item>
      <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
      <el-form-item label="手机号" prop="phone"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="邮箱" prop="email"><el-input v-model="form.email" /></el-form-item>
      <el-button type="primary" @click="saveProfile">保存资料</el-button>
    </el-form>

    <el-divider />
    <div class="section-title">地址管理</div>
    <el-table :data="addresses" border>
      <el-table-column prop="contactName" label="联系人" />
      <el-table-column prop="contactPhone" label="电话" />
      <el-table-column label="地址">
        <template #default="{ row }">{{ row.province }}{{ row.city }}{{ row.district }}{{ row.detailAddress }}</template>
      </el-table-column>
      <el-table-column label="默认">
        <template #default="{ row }">{{ row.isDefault ? '是' : '否' }}</template>
      </el-table-column>
    </el-table>

    <el-divider />
    <el-form ref="addressRef" :model="addressForm" :rules="addressRules" label-width="102px">
      <el-row :gutter="12">
        <el-col :span="8"><el-form-item label="联系人" prop="contactName"><el-input v-model="addressForm.contactName" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="手机号" prop="contactPhone"><el-input v-model="addressForm.contactPhone" /></el-form-item></el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item label="定位">
            <el-button :loading="locating" @click="locateNow">📍 获取当前位置</el-button>
            <span class="tip">定位需要浏览器授权</span>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="省份" prop="province">
            <el-select v-model="addressForm.province" placeholder="请选择" filterable allow-create default-first-option>
              <el-option v-for="p in provinceOptions" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="城市" prop="city">
            <el-select v-model="addressForm.city" placeholder="请选择" filterable allow-create default-first-option>
              <el-option v-for="c in cityOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="区县" prop="district">
            <el-select v-model="addressForm.district" placeholder="请选择" filterable allow-create default-first-option>
              <el-option v-for="d in districtOptions" :key="d" :label="d" :value="d" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item label="详细地址" prop="detailAddress">
            <el-input
              ref="locationInputRef"
              v-model="addressForm.detailAddress"
              placeholder="输入小区/学校/写字楼等，选择后自动补全"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="默认地址"><el-switch v-model="addressForm.isDefault" /></el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveAddress">新增地址</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserById, updateUser, getUserAddresses, saveUserAddress, uploadUserAvatar } from '@/api/user'
import { geocodeAddress, reverseGeocode } from '@/api/map'
import { EMAIL_REGEX, PHONE_REGEX } from '@/utils/validators'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const form = reactive({})
const profileRef = ref()
const addresses = ref([])
const addressRef = ref()
const locating = ref(false)
const locationInputRef = ref()

const provinceOptions = ['山东省']
const cityOptions = ['青岛市']
const districtOptionsMap = {
  青岛市: ['崂山区', '市南区', '市北区', '李沧区', '城阳区', '黄岛区', '即墨区']
}

const addressForm = reactive({
  contactName: '',
  contactPhone: '',
  province: '山东省',
  city: '青岛市',
  district: '',
  detailAddress: '',
  isDefault: false,
  longitude: '',
  latitude: ''
})

const districtOptions = computed(() => districtOptionsMap[addressForm.city] || [])

const profileRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: PHONE_REGEX, message: '请输入正确的 11 位手机号', trigger: ['blur', 'change'] }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: EMAIL_REGEX, message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ]
}

const addressRules = {
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: PHONE_REGEX, message: '请输入正确的 11 位手机号', trigger: ['blur', 'change'] }
  ],
  province: [{ required: true, message: '请选择省份', trigger: 'change' }],
  city: [{ required: true, message: '请选择城市', trigger: 'change' }],
  district: [{ required: true, message: '请选择区县', trigger: 'change' }],
  detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

async function loadData() {
  const [userRes, addressRes] = await Promise.all([getUserById(userInfo.id), getUserAddresses(userInfo.id)])
  Object.assign(form, userRes.data || {})
  addresses.value = addressRes.data || []
  localStorage.setItem('userInfo', JSON.stringify({ ...(JSON.parse(localStorage.getItem('userInfo') || '{}')), ...form }))
}

async function saveProfile() {
  await profileRef.value.validate()
  await updateUser(form)
  localStorage.setItem('userInfo', JSON.stringify({ ...(JSON.parse(localStorage.getItem('userInfo') || '{}')), ...form }))
  ElMessage.success('资料已更新')
}

function beforeAvatarUpload(file) {
  const ok = file.type.startsWith('image/')
  if (!ok) ElMessage.error('仅支持图片文件')
  return ok
}

async function uploadAvatarRequest(options) {
  const res = await uploadUserAvatar(options.file)
  form.avatar = res.data
  await saveProfile()
  options.onSuccess(res)
}

let baiduAutocompleteInited = false

function getNativeInputEl() {
  const comp = locationInputRef.value
  if (!comp) return null
  if (comp.input) return comp.input
  const root = comp.$el || comp
  return root?.querySelector?.('input') || null
}

function loadBaiduMapApi() {
  if (window.BMap) return Promise.resolve()
  if (window.__BAIDU_MAP_API_PROMISE__) return window.__BAIDU_MAP_API_PROMISE__

  const ak = import.meta.env.VITE_BAIDU_MAP_AK || 'ysmkamDJKqOcBvMHnVBlRr3Br33KfU3P'
  const callbackName = '__initBaiduMapApiCallback__'

  window.__BAIDU_MAP_API_PROMISE__ = new Promise((resolve, reject) => {
    if (document.querySelector('script[data-baidu-map="1"]')) {
      const t = setInterval(() => {
        if (window.BMap) {
          clearInterval(t)
          resolve()
        }
      }, 100)
      setTimeout(() => {
        clearInterval(t)
        if (!window.BMap) reject(new Error('百度地图 API 加载超时'))
      }, 12000)
      return
    }

    window[callbackName] = () => {
      try {
        delete window[callbackName]
      } catch (e) {
        window[callbackName] = undefined
      }
      resolve()
    }

    const script = document.createElement('script')
    script.setAttribute('data-baidu-map', '1')
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=${encodeURIComponent(ak)}&callback=${callbackName}`
    script.onerror = () => reject(new Error('百度地图 API 加载失败'))
    document.head.appendChild(script)
  })

  return window.__BAIDU_MAP_API_PROMISE__
}

async function initBaiduAutocomplete() {
  if (baiduAutocompleteInited) return
  await nextTick()

  const inputEl = getNativeInputEl()
  if (!inputEl) {
    ElMessage.warning('定位输入框未就绪，请刷新页面重试')
    return
  }
  inputEl.id = 'locationInput'
  inputEl.autocomplete = 'off'

  try {
    await loadBaiduMapApi()
  } catch (e) {
    ElMessage.error(e?.message || '百度地图初始化失败，请检查网络/插件拦截/AK白名单')
    return
  }

  const BMap = window.BMap
  if (!BMap || !BMap.Autocomplete || !BMap.Geocoder) {
    ElMessage.error('百度地图API未就绪，请检查AK是否为浏览器端AK并已配置Referer白名单')
    return
  }

  const geoc = new BMap.Geocoder()
  const ac = new BMap.Autocomplete({ input: 'locationInput', location: '全国' })

  ac.addEventListener('onconfirm', async e => {
    const v = e?.item?.value || {}
    const addr = `${v.province || ''}${v.city || ''}${v.district || ''}${v.street || ''}${v.business || ''}`.trim()
    if (addr) {
      addressForm.detailAddress = addr
    }

    const fallback = async () => {
      try {
        const geocodeRes = await geocodeAddress({ address: addressForm.detailAddress, city: addressForm.city || '青岛市' })
        const geocode = geocodeRes.data || {}
        fillAddressByGeocode(geocode)
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || '地址解析失败'
        ElMessage.error(msg)
      }
    }

    geoc.getPoint(
      addressForm.detailAddress,
      point => {
        if (!point) {
          fallback()
          return
        }
        addressForm.longitude = String(point.lng)
        addressForm.latitude = String(point.lat)
        geoc.getLocation(point, rs => {
          const c = rs?.addressComponents
          if (!c) return
          addressForm.province = c.province || addressForm.province
          addressForm.city = c.city || addressForm.city
          addressForm.district = c.district || addressForm.district
          const detail = `${c.street || ''}${c.streetNumber || ''}`.trim()
          if (detail) addressForm.detailAddress = detail
        })
      },
      addressForm.city || v.city || '青岛市'
    )
  })

  baiduAutocompleteInited = true
}

function fillAddressByGeocode(geocode) {
  addressForm.province = geocode.province || addressForm.province || ''
  addressForm.city = geocode.city || addressForm.city || ''
  addressForm.district = geocode.district || addressForm.district || ''
  addressForm.detailAddress = buildDetailAddress(geocode) || addressForm.detailAddress || ''
  addressForm.longitude = geocode.lng != null ? String(geocode.lng) : addressForm.longitude
  addressForm.latitude = geocode.lat != null ? String(geocode.lat) : addressForm.latitude
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

async function locateNow() {
  if (!navigator.geolocation) {
    ElMessage.warning('当前浏览器不支持定位')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    async position => {
      try {
        const { longitude, latitude } = position.coords
        addressForm.longitude = String(longitude)
        addressForm.latitude = String(latitude)

        try {
          await loadBaiduMapApi()
          const BMap = window.BMap
          if (BMap && BMap.Geocoder && BMap.Point) {
            const geoc = new BMap.Geocoder()
            const point = new BMap.Point(longitude, latitude)
            geoc.getLocation(point, rs => {
              const c = rs?.addressComponents
              if (!c) return
              addressForm.province = c.province || addressForm.province
              addressForm.city = c.city || addressForm.city
              addressForm.district = c.district || addressForm.district
              const detail = `${c.street || ''}${c.streetNumber || ''}`.trim()
              if (detail) addressForm.detailAddress = detail
            })
          } else {
            const res = await reverseGeocode({ lng: longitude, lat: latitude })
            fillAddressByGeocode(res.data || {})
          }
        } catch (e) {
          const res = await reverseGeocode({ lng: longitude, lat: latitude })
          fillAddressByGeocode(res.data || {})
        }

        ElMessage.success('定位成功，地址已自动填充')
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || '定位解析失败'
        ElMessage.error(msg)
      } finally {
        locating.value = false
      }
    },
    error => {
      locating.value = false
      const map = {
        1: '你已拒绝定位权限，请改用手动选择',
        2: '无法获取当前位置（定位不可用），请改用手动选择',
        3: '定位超时，请稍后重试或改用手动选择'
      }
      ElMessage.warning(map[error?.code] || '定位失败，请改用手动选择')
    }
    ,
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

async function saveAddress() {
  await addressRef.value.validate()
  if (!addressForm.longitude || !addressForm.latitude) {
    ElMessage.warning('请先定位或从下拉选择地址后再保存')
    return
  }
  await saveUserAddress(userInfo.id, {
    contactName: addressForm.contactName,
    contactPhone: addressForm.contactPhone,
    province: addressForm.province,
    city: addressForm.city,
    district: addressForm.district,
    detailAddress: addressForm.detailAddress,
    isDefault: addressForm.isDefault,
    longitude: Number(addressForm.longitude),
    latitude: Number(addressForm.latitude)
  })
  ElMessage.success('地址已保存')
  Object.assign(addressForm, {
    contactName: '',
    contactPhone: '',
    province: '山东省',
    city: '青岛市',
    district: '',
    detailAddress: '',
    isDefault: false,
    longitude: '',
    latitude: ''
  })
  await loadData()
}

onMounted(async () => {
  await loadData()
  initBaiduAutocomplete()
})
</script>

<style scoped>
.section-title {
  font-weight: 700;
  margin-bottom: 12px;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tip {
  margin-left: 10px;
  color: #6f859a;
  font-size: 12px;
}
</style>
