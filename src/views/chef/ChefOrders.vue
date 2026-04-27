<template>
  <div class="orders-page">
    <div class="stats">
      <el-card class="stat" shadow="never"><span>全部</span><b>{{ stats.total }}</b></el-card>
      <el-card class="stat" shadow="never"><span>待接单</span><b>{{ stats.pending_accept }}</b></el-card>
      <el-card class="stat" shadow="never"><span>服务中</span><b>{{ stats.serving }}</b></el-card>
      <el-card class="stat" shadow="never"><span>已完成</span><b>{{ stats.completed }}</b></el-card>
      <el-card class="stat" shadow="never"><span>已取消</span><b>{{ stats.cancelled }}</b></el-card>
      <el-card class="stat" shadow="never"><span>待支付</span><b>{{ stats.unpaid }}</b></el-card>
    </div>

    <el-card class="table-card">
      <div class="toolbar">
        <div class="left-tools">
          <el-select v-model="tab" style="width: 130px" @change="search">
            <el-option label="全部状态" value="all" />
            <el-option label="待接单" value="pending_accept" />
            <el-option label="服务中" value="serving" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="待支付" value="unpaid" />
          </el-select>
          <el-date-picker
              v-model="dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 250px"
              @change="search"
          />
          <el-input
              v-model="keyword"
              clearable
              style="width: 240px"
              placeholder="订单号/用户名"
              @clear="search"
              @keyup.enter="search"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="search">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
      </div>

      <el-table :data="orders" border stripe v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column label="服务时间" width="170">
          <template #default="{ row }">
            <div>{{ row.serviceDate }}</div>
            <div class="sub">{{ mealLabel(row.mealType) }} {{ row.serviceTime || '' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="person-cell">
              <el-avatar :size="34" :src="img(row.user?.avatar, '/images/avatar/default-user.png')" />
              <div>
                <div>{{ row.user?.nickname || row.user?.userName || row.userId }}</div>
                <small>{{ row.user?.phone || '-' }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="套餐" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.packageInfo?.packageName || row.packageId }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="right">
          <template #default="{ row }"><span class="amount">¥{{ row.totalAmount }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending_accept'" size="small" type="success" @click="accept(row)">
              接单
            </el-button>
            <el-button v-if="row.status === 'pending_accept'" size="small" type="danger" plain @click="openRejectDialog(row)">
              拒绝
            </el-button>
            <el-button v-if="row.status === 'serving'" size="small" type="warning" @click="complete(row)">
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
            v-model:current-page="page"
            v-model:page-size="size"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="reload"
            @size-change="reload"
        />
      </div>
    </el-card>

    <!-- 优化后的订单详情弹窗 - 宽度减小到700px，间距压缩 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="700px" class="order-detail-dialog">
      <div v-if="currentOrder.orderId" class="detail-wrap">
        <div class="detail-head">
          <div class="head-left">
            <div class="title">订单号：{{ currentOrder.orderNo }}</div>
            <div class="meta">{{ formatDate(currentOrder.createTime) }}</div>
          </div>
          <el-tag :type="statusTagType(currentOrder.status)" size="large">
            {{ statusText(currentOrder.status) }}
          </el-tag>
        </div>

        <div class="group-grid">
          <el-card shadow="never" class="group-card">
            <template #header>服务信息</template>
            <div class="kv"><span>服务日期</span><b>{{ currentOrder.serviceDate }}</b></div>
            <div class="kv"><span>服务时段</span><b>{{ mealLabel(currentOrder.mealType) }}</b></div>
            <div class="kv"><span>服务时间</span><b>{{ currentOrder.serviceTime || '-' }}</b></div>
            <div class="kv"><span>用餐人数</span><b>{{ currentOrder.persons || 0 }}人</b></div>
            <div class="kv full"><span>忌口</span><b>{{ currentOrder.dietaryRestrictions || '-' }}</b></div>
            <div class="kv full"><span>备注</span><b>{{ currentOrder.specialRequests || '-' }}</b></div>
          </el-card>

          <el-card shadow="never" class="group-card">
            <template #header>用户与地址</template>
            <div class="kv"><span>用户</span><b>{{ currentOrder.user?.nickname || currentOrder.user?.userName || currentOrder.userId }}</b></div>
            <div class="kv"><span>联系电话</span><b>{{ currentOrder.user?.phone || currentOrder.address?.contactPhone || '-' }}</b></div>
            <div class="kv"><span>联系人</span><b>{{ currentOrder.address?.contactName || '-' }}</b></div>
            <div class="kv address-item"><span>地址</span><b class="address-text">{{ fullAddress(currentOrder.address) }}</b></div>
          </el-card>
        </div>

        <div class="group-grid">
          <el-card shadow="never" class="group-card">
            <template #header>套餐与菜品</template>
            <div class="package-row">
              <el-image
                  :src="img(currentOrder.packageInfo?.packageImage, '/images/package/default-package.png')"
                  fit="cover"
                  style="width: 100px; height: 70px; border-radius: 8px"
              />
              <div class="package-main">
                <div class="pkg-name">{{ currentOrder.packageInfo?.packageName || '-' }}</div>
                <div class="pkg-sub">{{ currentOrder.packageInfo?.dishCount || currentOrder.dishCount || 0 }}道菜</div>
              </div>
            </div>
            <div class="dish-list">
              <div v-for="dish in currentOrder.selectedDishDetails || []" :key="dish.dishId || dish.dishName" class="dish-item">
                <span>{{ dish.dishName }}</span>
                <small>{{ dish.ingredients || '-' }}</small>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="group-card">
            <template #header>金额明细</template>
            <div class="kv"><span>套餐金额</span><b>¥{{ currentOrder.packagePrice || 0 }}</b></div>
            <div class="kv"><span>代买费用</span><b>¥{{ currentOrder.ingredientFee || 0 }}</b></div>
            <div class="kv total"><span>总金额</span><b>¥{{ currentOrder.totalAmount || 0 }}</b></div>
            <div v-if="currentOrder.cancelReason" class="kv full"><span>取消原因</span><b>{{ currentOrder.cancelReason }}</b></div>
          </el-card>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝接单对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝接单" width="500px">
      <div class="reject-info">
        <p>订单号：<b>{{ currentRejectOrder.orderNo }}</b></p>
        <p>服务时间：<b>{{ currentRejectOrder.serviceDate }} {{ mealLabel(currentRejectOrder.mealType) }}</b></p>
      </div>
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入拒绝原因（必填）"
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejecting" @click="handleReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getChefByUserId } from '@/api/chef'
import { acceptOrder, completeOrder, getOrderDetail, getOrders, rejectOrder } from '@/api/order'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')

const loading = ref(false)
const orders = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)

const tab = ref('all')
const keyword = ref('')
const dateRange = ref([])

const chefId = ref('')

const detailVisible = ref(false)
const currentOrder = ref({})

const rejectDialogVisible = ref(false)
const currentRejectOrder = ref({})
const rejectReason = ref('')
const rejecting = ref(false)

const stats = computed(() => {
  const s = { total: total.value, unpaid: 0, pending_accept: 0, serving: 0, completed: 0, cancelled: 0 }
  orders.value.forEach((o) => {
    if (s[o.status] !== undefined) s[o.status] += 1
  })
  return s
})

function statusText(status) {
  const map = {
    unpaid: '待支付',
    pending_accept: '待接单',
    serving: '服务中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function statusTagType(status) {
  const map = {
    unpaid: 'warning',
    pending_accept: 'info',
    serving: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

function mealLabel(type) {
  return { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '宵夜' }[Number(type)] || '-'
}

function img(path, fallback) {
  if (!path) return fallback
  if (path.startsWith('http')) return path
  return path
}

function fullAddress(address) {
  if (!address) return '-'
  return `${address.province || ''}${address.city || ''}${address.district || ''}${address.detailAddress || ''}` || '-'
}

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('zh-CN')
}

async function resolveChefId() {
  if (userInfo.role === 'ROLE_CHEF') {
    chefId.value = userInfo.id
    return
  }
  const res = await getChefByUserId(userInfo.id)
  chefId.value = res?.data?.chefId || userInfo.id
}

function buildParams() {
  return {
    chefId: chefId.value,
    tab: tab.value,
    page: page.value,
    size: size.value,
    keyword: keyword.value || undefined,
    startDate: dateRange.value?.[0] || undefined,
    endDate: dateRange.value?.[1] || undefined
  }
}

async function reload() {
  if (!chefId.value) return
  loading.value = true
  try {
    const res = await getOrders(buildParams())
    orders.value = res?.data?.records || []
    total.value = res?.data?.total || 0
  } catch (e) {
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  reload()
}

function resetSearch() {
  tab.value = 'all'
  keyword.value = ''
  dateRange.value = []
  page.value = 1
  reload()
}

async function openDetail(row) {
  try {
    const res = await getOrderDetail(row.orderId)
    currentOrder.value = res?.data || row
  } catch {
    currentOrder.value = row
  }
  detailVisible.value = true
}

async function accept(row) {
  try {
    await acceptOrder(row.orderId)
    ElMessage.success('接单成功')
    await reload()
  } catch (e) {
    ElMessage.error('接单失败')
  }
}

async function complete(row) {
  try {
    await completeOrder(row.orderId)
    ElMessage.success('订单已完成')
    await reload()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function openRejectDialog(row) {
  currentRejectOrder.value = row
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

async function handleReject() {
  if (!rejectReason.value || rejectReason.value.trim() === '') {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    rejecting.value = true
    await rejectOrder(currentRejectOrder.value.orderId, rejectReason.value)
    ElMessage.success('已拒绝订单')
    rejectDialogVisible.value = false
    await reload()
  } catch (e) {
    ElMessage.error(e.message || '拒绝失败')
  } finally {
    rejecting.value = false
  }
}

onMounted(async () => {
  await resolveChefId()
  await reload()
})
</script>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.stat :deep(.el-card__body) {
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat span {
  color: #64748b;
}

.stat b {
  color: #111827;
  font-size: 18px;
}

.table-card {
  border-radius: 14px;
}

.toolbar {
  margin-bottom: 14px;
}

.left-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.sub {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 2px;
}

.person-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.person-cell small {
  color: #94a3b8;
}

.amount {
  color: #ef4444;
  font-weight: 600;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 订单详情弹窗样式 - 宽度700px，间距紧凑 */
.order-detail-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
}

.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-head {
  background: #f7fbff;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.head-left .title {
  font-size: 15px;
  font-weight: 600;
}

.head-left .meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.group-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.group-card :deep(.el-card__header) {
  padding: 8px 12px;
  font-weight: 600;
  font-size: 13px;
}

.group-card :deep(.el-card__body) {
  padding: 4px 12px;
}

.kv {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed #ecf1f7;
}

.kv:last-child {
  border-bottom: 0;
}

.kv.full {
  align-items: flex-start;
}

.kv.total b {
  color: #ef4444;
}

.kv span {
  color: #6b7280;
  min-width: 70px;
}

.kv b {
  color: #111827;
  font-weight: 500;
  text-align: right;
  white-space: pre-wrap;
}

.address-item {
  align-items: flex-start;
}

.address-text {
  word-break: break-all;
  text-align: right;
  flex: 1;
}

.package-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.package-main {
  flex: 1;
}

.pkg-name {
  font-size: 14px;
  font-weight: 600;
}

.pkg-sub {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.dish-list {
  border-top: 1px solid #eef2f7;
  padding-top: 6px;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.dish-item small {
  color: #94a3b8;
  font-size: 12px;
}

/* 拒绝接单对话框样式 */
.reject-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f7fbff;
  border-radius: 8px;
}

.reject-info p {
  margin: 4px 0;
  font-size: 14px;
}

.reject-info b {
  color: #111827;
}

@media (max-width: 1200px) {
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 700px) {
  .group-grid {
    grid-template-columns: 1fr;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>