<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <span>订单管理</span>
        <div class="header-tools">
          <el-tag type="primary">总订单 {{ total }}</el-tag>
          <el-tag type="warning">待支付 {{ stats.unpaid }}</el-tag>
          <el-tag type="info">待接单 {{ stats.pending_accept }}</el-tag>
          <el-tag type="success">已完成 {{ stats.completed }}</el-tag>
        </div>
      </div>
    </template>

    <div class="toolbar">
      <el-radio-group v-model="tab" @change="reload">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="unpaid">待支付</el-radio-button>
        <el-radio-button label="pending_accept">待接单</el-radio-button>
        <el-radio-button label="serving">服务中</el-radio-button>
        <el-radio-button label="completed">已完成</el-radio-button>
        <el-radio-button label="cancelled">已取消</el-radio-button>
      </el-radio-group>

      <div class="right-tools">
        <el-input
            v-model="keyword"
            clearable
            style="width: 260px"
            placeholder="订单号/用户名/私厨名"
            @clear="search"
            @keyup.enter="search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
            @change="search"
        />
        <el-button type="primary" @click="search">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </div>

    <el-table :data="orders" border stripe v-loading="loading">
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column label="用户" width="100" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.user?.nickname || row.user?.userName || row.userId }}
        </template>
      </el-table-column>
      <el-table-column label="私厨" width="100" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.chef?.realName || row.chef?.chefAccount || row.chefId }}
        </template>
      </el-table-column>
      <el-table-column label="服务日期" width="120">
        <template #default="{ row }">
          <div>{{ row.serviceDate }}</div>
          <div class="sub">{{ mealLabel(row.mealType) }} {{ row.serviceTime || '' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="套餐" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.packageInfo?.packageName || row.packageId || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="金额" width="70" align="right">
        <template #default="{ row }">
          <span class="amount">¥{{ row.totalAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain @click="openDetail(row)">详情</el-button>
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
            <template #header>基础信息</template>
            <div class="kv"><span>用户</span><b>{{ currentOrder.user?.nickname || currentOrder.user?.userName || currentOrder.userId }}</b></div>
            <div class="kv"><span>私厨</span><b>{{ currentOrder.chef?.realName || currentOrder.chef?.chefAccount || currentOrder.chefId }}</b></div>
            <div class="kv"><span>联系电话</span><b>{{ currentOrder.user?.phone || '-' }}</b></div>
            <div class="kv"><span>时段</span><b>{{ mealLabel(currentOrder.mealType) }}</b></div>
            <div class="kv"><span>人数</span><b>{{ currentOrder.persons || 0 }}人</b></div>
          </el-card>

          <el-card shadow="never" class="group-card">
            <template #header>服务与地址</template>
            <div class="kv"><span>服务日期</span><b>{{ currentOrder.serviceDate }}</b></div>
            <div class="kv"><span>服务时间</span><b>{{ currentOrder.serviceTime || '-' }}</b></div>
            <div class="kv"><span>联系人</span><b>{{ currentOrder.address?.contactName || '-' }}</b></div>
            <div class="kv"><span>联系电话</span><b>{{ currentOrder.address?.contactPhone || '-' }}</b></div>
            <div class="kv address-item"><span>地址</span><b class="address-text">{{ fullAddress(currentOrder.address) }}</b></div>
          </el-card>
        </div>

        <div class="group-grid">
          <el-card shadow="never" class="group-card">
            <template #header>套餐信息</template>
            <div class="package-row">
              <el-image
                  :src="fullImage(currentOrder.packageInfo?.packageImage, '/images/package/default-package.png')"
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
            <template #header>金额信息</template>
            <div class="kv"><span>套餐金额</span><b>¥{{ currentOrder.packagePrice || 0 }}</b></div>
            <div class="kv"><span>代买费用</span><b>¥{{ currentOrder.ingredientFee || 0 }}</b></div>
            <div class="kv total"><span>总金额</span><b>¥{{ currentOrder.totalAmount || 0 }}</b></div>
            <div class="kv full"><span>忌口</span><b>{{ currentOrder.dietaryRestrictions || '-' }}</b></div>
            <div class="kv full"><span>备注</span><b>{{ currentOrder.specialRequests || '-' }}</b></div>
            <div v-if="currentOrder.cancelReason" class="kv full"><span>取消原因</span><b>{{ currentOrder.cancelReason }}</b></div>
          </el-card>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getOrders } from '@/api/order'

const loading = ref(false)
const orders = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const tab = ref('all')
const keyword = ref('')
const dateRange = ref([])

const detailVisible = ref(false)
const currentOrder = ref({})

const stats = computed(() => {
  const s = { unpaid: 0, pending_accept: 0, completed: 0 }
  orders.value.forEach((o) => {
    if (o.status === 'unpaid') s.unpaid += 1
    if (o.status === 'pending_accept') s.pending_accept += 1
    if (o.status === 'completed') s.completed += 1
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

function fullAddress(address) {
  if (!address) return '-'
  return `${address.province || ''}${address.city || ''}${address.district || ''}${address.detailAddress || ''}` || '-'
}

function fullImage(path, fallback) {
  if (!path) return fallback
  if (path.startsWith('http')) return path
  return path
}

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('zh-CN')
}

function buildParams() {
  return {
    page: page.value,
    size: size.value,
    tab: tab.value,
    keyword: keyword.value || undefined,
    startDate: dateRange.value?.[0] || undefined,
    endDate: dateRange.value?.[1] || undefined
  }
}

async function reload() {
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
  keyword.value = ''
  dateRange.value = []
  page.value = 1
  reload()
}

function openDetail(row) {
  currentOrder.value = row
  detailVisible.value = true
}

onMounted(reload)
</script>

<style scoped>
.page-card {
  border-radius: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-tools {
  display: flex;
  gap: 10px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.right-tools {
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
  color: #6b7280;
  margin-top: 4px;
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
  color: #64748b;
  margin-top: 4px;
  font-size: 12px;
}

.dish-list {
  border-top: 1px solid #eef2f7;
  padding-top: 6px;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.dish-item small {
  color: #94a3b8;
  font-size: 12px;
}

@media (max-width: 700px) {
  .group-grid {
    grid-template-columns: 1fr;
  }
}
</style>