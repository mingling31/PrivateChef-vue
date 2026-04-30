<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <span>私厨审核</span>
        <div class="header-tools">
          <el-tag>全部 {{ stats.total }}</el-tag>
          <el-tag type="warning">待审核 {{ stats.pending }}</el-tag>
          <el-tag type="success">已通过 {{ stats.approved }}</el-tag>
          <el-tag type="danger">已驳回 {{ stats.rejected }}</el-tag>
        </div>
      </div>
    </template>

    <div class="toolbar">
      <el-radio-group v-model="status" @change="reload">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="pending">待审核</el-radio-button>
        <el-radio-button label="approved">已通过</el-radio-button>
        <el-radio-button label="rejected">已驳回</el-radio-button>
        <el-radio-button label="disabled">已禁用</el-radio-button>
      </el-radio-group>

      <div class="right-tools">
        <el-input
            v-model="keyword"
            style="width: 240px"
            clearable
            placeholder="姓名/账号/手机号/城市"
            @clear="handleFilterChange"
            @keyup.enter="handleFilterChange"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </div>

    <el-table :data="paginatedRows" border stripe v-loading="loading">
      <el-table-column label="头像" width="80" align="center">
        <template #default="{ row }">
          <el-avatar :size="40" :src="fullImage(row.avatar)">
            {{ (row.realName || '厨').slice(0, 1) }}
          </el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="chefId" label="私厨ID" width="100" />
      <el-table-column prop="realName" label="姓名" width="80" />
      <el-table-column prop="chefAccount" label="账号" width="110" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column prop="city" label="城市" width="70" />
      <el-table-column prop="address" label="地址" min-width="120" show-overflow-tooltip />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="申请时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain @click="openDetail(row)">详情</el-button>
          <el-button
              v-if="row.status === 'pending'"
              size="small"
              type="success"
              plain
              @click="review(row, 'approved')"
          >
            通过
          </el-button>
          <el-button
              v-if="row.status === 'pending'"
              size="small"
              type="danger"
              plain
              @click="review(row, 'rejected')"
          >
            驳回
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredRows.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <!-- 优化后的私厨详情弹窗 - 宽度减小到680px，间距压缩 -->
    <el-dialog v-model="detailVisible" title="私厨详情" width="680px" class="chef-detail-dialog">
      <div v-if="currentChef.chefId" class="detail-wrap">
        <div class="detail-head">
          <el-avatar :size="60" :src="fullImage(currentChef.avatar)">
            {{ (currentChef.realName || '厨').slice(0, 1) }}
          </el-avatar>
          <div class="head-main">
            <div class="name-line">{{ currentChef.realName }}</div>
            <div class="tag-line">
              <el-tag :type="statusTagType(currentChef.status)" size="small">{{ statusText(currentChef.status) }}</el-tag>
              <div class="rating-wrapper">
                <el-rate :model-value="Number(currentChef.rating || 0)" disabled :size="16" />
                <span class="rating-number">{{ (Number(currentChef.rating) || 0).toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="group-grid">
          <el-card shadow="never" class="group-card">
            <template #header>基础信息</template>
            <div class="kv"><span>私厨ID</span><b>{{ currentChef.chefId }}</b></div>
            <div class="kv"><span>账号</span><b>{{ currentChef.chefAccount || '-' }}</b></div>
            <div class="kv"><span>手机号</span><b>{{ currentChef.phone || '-' }}</b></div>
            <div class="kv"><span>身份证</span><b>{{ currentChef.idCard || '-' }}</b></div>
            <div class="kv"><span>从业年限</span><b>{{ currentChef.yearsExp || 0 }}年</b></div>
          </el-card>

          <el-card shadow="never" class="group-card">
            <template #header>服务信息</template>
            <div class="kv"><span>服务半径</span><b>{{ currentChef.serviceRadius || 0 }}km</b></div>
            <div class="kv"><span>代买服务</span><b>{{ Number(currentChef.canPurchase) === 1 ? '支持' : '不支持' }}</b></div>
            <div class="kv"><span>代买费用</span><b>¥{{ currentChef.purchaseFee || 0 }}</b></div>
            <div class="kv"><span>城市</span><b>{{ currentChef.city || '-' }}</b></div>
            <div class="kv"><span>地址</span><b>{{ currentChef.address || '-' }}</b></div>
          </el-card>
        </div>

        <el-card shadow="never" class="group-card intro-card">
          <template #header>个人介绍</template>
          <div class="intro">{{ currentChef.introduction || '暂无' }}</div>
        </el-card>

        <el-card shadow="never" class="group-card cert-card">
          <template #header>健康证</template>
          <el-image
              :src="fullImage(currentChef.healthCert)"
              fit="cover"
              style="width: 260px; height: 160px; border-radius: 8px"
              :preview-src-list="[fullImage(currentChef.healthCert)]"
          >
            <template #error>
              <div class="image-fallback">暂无健康证图片</div>
            </template>
          </el-image>
        </el-card>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="currentChef.status === 'pending'" type="success" @click="review(currentChef, 'approved')">
          通过审核
        </el-button>
        <el-button v-if="currentChef.status === 'pending'" type="danger" @click="review(currentChef, 'rejected')">
          驳回审核
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getChefApplications, reviewChef } from '@/api/admin'

const loading = ref(false)
const status = ref('')
const keyword = ref('')
const chefs = ref([])

const detailVisible = ref(false)
const currentChef = ref({})

const currentPage = ref(1)
const pageSize = ref(10)

const stats = computed(() => {
  const s = { total: chefs.value.length, pending: 0, approved: 0, rejected: 0 }
  chefs.value.forEach((c) => {
    if (c.status === 'pending') s.pending += 1
    if (c.status === 'approved') s.approved += 1
    if (c.status === 'rejected') s.rejected += 1
  })
  return s
})

const filteredRows = computed(() => {
  const kw = (keyword.value || '').trim().toLowerCase()
  return chefs.value.filter((row) => {
    if (status.value && row.status !== status.value) return false
    if (kw) {
      return (
          row.realName?.toLowerCase().includes(kw) ||
          row.chefAccount?.toLowerCase().includes(kw) ||
          row.phone?.includes(kw) ||
          row.city?.toLowerCase().includes(kw)
      )
    }
    return true
  })
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('zh-CN')
}

function statusTagType(s) {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', disabled: 'info' }
  return map[s] || 'info'
}

function statusText(s) {
  const map = { pending: '待审核', approved: '已通过', rejected: '已驳回', disabled: '已禁用' }
  return map[s] || s || '-'
}

function fullImage(path) {
  if (!path) return '/images/chef/default-chef.png'
  if (path.startsWith('http')) return path
  return path
}

function handleFilterChange() {
  currentPage.value = 1
}

function resetSearch() {
  keyword.value = ''
  currentPage.value = 1
}

function openDetail(row) {
  currentChef.value = { ...row }
  detailVisible.value = true
}

async function reload() {
  loading.value = true
  try {
    const res = await getChefApplications(status.value || undefined)
    chefs.value = res?.data || []
    currentPage.value = 1
  } catch (e) {
    ElMessage.error('加载私厨数据失败')
  } finally {
    loading.value = false
  }
}

async function review(row, targetStatus) {
  const action = targetStatus === 'approved' ? '通过' : '驳回'
  let rejectReason = ''
  if (targetStatus === 'rejected') {
    try {
      const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回审核', {
        inputType: 'textarea',
        inputPlaceholder: '请输入驳回原因',
        inputValidator: (v) => (v && v.trim() ? true : '驳回原因不能为空')
      })
      rejectReason = value
    } catch (e) {
      return
    }
  }
  try {
    await reviewChef(row.chefId, { status: targetStatus, rejectReason: rejectReason || undefined })
    ElMessage.success(`${action}成功`)
    detailVisible.value = false
    await reload()
  } catch (e) {
    ElMessage.error(`${action}失败`)
  }
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
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.right-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 私厨详情弹窗样式 - 宽度680px，间距紧凑 */
.chef-detail-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
}

.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f7fbff;
  border-radius: 10px;
  padding: 10px 14px;
}

.name-line {
  font-size: 16px;
  font-weight: 600;
}

.tag-line {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}

.rating-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-number {
  font-size: 13px;
  color: #f5a623;
  font-weight: 500;
  line-height: 1;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.group-card :deep(.el-card__header) {
  font-weight: 600;
  padding: 8px 12px;
  font-size: 13px;
  background: #fafbfc;
  border-bottom: 1px solid #edf2f7;
}

.group-card :deep(.el-card__body) {
  padding: 4px 12px;
}

.kv {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed #ecf1f7;
}

.kv:last-child {
  border-bottom: 0;
}

.kv span {
  color: #6b7280;
  flex-shrink: 0;
  min-width: 70px;
}

.kv b {
  font-weight: 500;
  color: #111827;
  text-align: right;
  word-break: break-word;
}

.intro {
  white-space: pre-wrap;
  line-height: 1.5;
  color: #374151;
}

.image-fallback {
  width: 260px;
  height: 160px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f6fb;
  color: #94a3b8;
}

@media (max-width: 680px) {
  .group-grid {
    grid-template-columns: 1fr;
  }
}
</style>