<template>
  <div class="page" v-loading="loading">
    <TopNavBar />
    <div class="shell">
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

          <el-form-item label="服务地址">
            <el-select v-model="form.addressId" placeholder="请选择地址">
              <el-option
                v-for="item in addresses"
                :key="item.addressId"
                :label="`${item.city}${item.district}${item.detailAddress}`"
                :value="item.addressId"
              />
            </el-select>
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import TopNavBar from '@/components/TopNavBar.vue'
import { getChefDetail } from '@/api/chef'
import { createOrder } from '@/api/order'
import { getChefSchedules } from '@/api/schedule'
import { getUserAddresses } from '@/api/user'

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

function isTimeInRange(value, range) {
  if (!value) return false
  const [h, m] = String(value).split(':').map(i => Number(i))
  if (Number.isNaN(h) || Number.isNaN(m)) return false
  const t = h * 60 + m
  const [sh, sm] = String(range.start).split(':').map(i => Number(i))
  const [eh, em] = String(range.end).split(':').map(i => Number(i))
  const s = sh * 60 + sm
  const e = eh * 60 + em
  return t >= s && t <= e
}

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
    const [chefRes, addressRes] = await Promise.all([getChefDetail(route.params.chefId), getUserAddresses(userInfo.id)])
    chef.value = chefRes.data.chef || null
    allPackages.value = chefRes.data.packages || []
    addresses.value = addressRes.data || []
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
    ElMessage.success('订单已创建，请前往我的订单支付')
    router.push('/userCenter/orders')
  } catch (error) {
    ElMessage.error(error?.message || error?.response?.data?.message || '下单失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
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
}
</style>
