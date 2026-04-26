<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <span>用户管理</span>
        <div class="header-tools">
          <el-tag type="primary">总用户 {{ userStats.total }}</el-tag>
          <el-tag type="success">普通用户 {{ userStats.user }}</el-tag>
          <el-tag type="danger">管理员 {{ userStats.admin }}</el-tag>
          <el-tag type="warning">禁用 {{ userStats.disabled }}</el-tag>
        </div>
      </div>
    </template>

    <div class="toolbar">
      <el-radio-group v-model="roleFilter" @change="handleFilterChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="USER">普通用户</el-radio-button>
        <el-radio-button label="ADMIN">管理员</el-radio-button>
      </el-radio-group>

      <div class="right-tools">
        <el-input
          v-model="searchKeyword"
          clearable
          style="width: 240px"
          placeholder="用户名/昵称/手机号"
          @clear="handleFilterChange"
          @keyup.enter="handleFilterChange"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-radio-group v-model="statusFilter" @change="handleFilterChange">
          <el-radio-button :label="null">全部状态</el-radio-button>
          <el-radio-button :label="1">正常</el-radio-button>
          <el-radio-button :label="0">禁用</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-table :data="paginatedUsers" border stripe v-loading="loading">
      <el-table-column label="头像" width="80" align="center">
        <template #default="{ row }">
          <el-avatar :size="40" :src="fullImage(row.avatar)">
            {{ (row.nickname || row.userName || '用').slice(0, 1) }}
          </el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="userId" label="用户ID" width="110" />
      <el-table-column prop="userName" label="用户名" width="110" />
      <el-table-column prop="nickname" label="昵称" width="110" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
      <el-table-column label="角色" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="roleTagType(roleOf(row))">{{ roleText(roleOf(row)) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="190" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain @click="openDetail(row)">详情</el-button>
          <el-button
            v-if="roleOf(row) !== 'ADMIN'"
            size="small"
            :type="isActive(row.status) ? 'danger' : 'success'"
            plain
            @click="toggleStatus(row)"
          >
            {{ isActive(row.status) ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filteredUsers.length"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <el-dialog v-model="detailVisible" title="用户详情" width="760px" class="common-detail-dialog">
      <div v-if="currentUser.userId" class="detail-wrap">
        <div class="detail-head">
          <el-avatar :size="64" :src="fullImage(currentUser.avatar)">
            {{ (currentUser.nickname || currentUser.userName || '用').slice(0, 1) }}
          </el-avatar>
          <div class="head-main">
            <div class="name-line">{{ currentUser.nickname || currentUser.userName }}</div>
            <div class="tag-line">
              <el-tag :type="roleTagType(roleOf(currentUser))">{{ roleText(roleOf(currentUser)) }}</el-tag>
              <el-tag :type="statusTagType(currentUser.status)">{{ statusText(currentUser.status) }}</el-tag>
            </div>
          </div>
        </div>

        <div class="group-grid">
          <el-card shadow="never" class="group-card">
            <template #header>基础信息</template>
            <div class="kv"><span>用户ID</span><b>{{ currentUser.userId }}</b></div>
            <div class="kv"><span>用户名</span><b>{{ currentUser.userName || '-' }}</b></div>
            <div class="kv"><span>昵称</span><b>{{ currentUser.nickname || '-' }}</b></div>
            <div class="kv"><span>手机号</span><b>{{ currentUser.phone || '-' }}</b></div>
            <div class="kv"><span>邮箱</span><b>{{ currentUser.email || '-' }}</b></div>
          </el-card>

          <el-card shadow="never" class="group-card">
            <template #header>账号信息</template>
            <div class="kv"><span>角色</span><b>{{ roleText(roleOf(currentUser)) }}</b></div>
            <div class="kv"><span>状态</span><b>{{ statusText(currentUser.status) }}</b></div>
            <div class="kv"><span>城市</span><b>{{ currentUser.city || '-' }}</b></div>
            <div class="kv"><span>创建时间</span><b>{{ formatDate(currentUser.createTime) }}</b></div>
            <div class="kv"><span>更新时间</span><b>{{ formatDate(currentUser.updateTime) }}</b></div>
          </el-card>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="roleOf(currentUser) !== 'ADMIN'"
          :type="isActive(currentUser.status) ? 'danger' : 'success'"
          @click="toggleStatus(currentUser)"
        >
          {{ isActive(currentUser.status) ? '禁用用户' : '启用用户' }}
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getUsers, updateUserStatus } from '@/api/user'

const loading = ref(false)
const users = ref([])
const detailVisible = ref(false)
const currentUser = ref({})

const roleFilter = ref('')
const statusFilter = ref(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const roleOf = (user) => (user?.role || user?.userType || 'USER').toUpperCase()
const isActive = (status) => String(status) === '1'

const roleText = (role) => (role === 'ADMIN' ? '管理员' : '普通用户')
const roleTagType = (role) => (role === 'ADMIN' ? 'danger' : 'success')
const statusText = (status) => (isActive(status) ? '正常' : '禁用')
const statusTagType = (status) => (isActive(status) ? 'success' : 'danger')

const userStats = computed(() => {
  const stats = { total: users.value.length, user: 0, admin: 0, disabled: 0 }
  users.value.forEach((u) => {
    const role = roleOf(u)
    if (role === 'ADMIN') stats.admin += 1
    else stats.user += 1
    if (!isActive(u.status)) stats.disabled += 1
  })
  return stats
})

const filteredUsers = computed(() => {
  const keyword = (searchKeyword.value || '').trim().toLowerCase()
  return users.value.filter((row) => {
    if (roleFilter.value && roleOf(row) !== roleFilter.value) return false
    if (statusFilter.value !== null && Number(row.status) !== statusFilter.value) return false
    if (keyword) {
      return (
        row.userName?.toLowerCase().includes(keyword) ||
        row.nickname?.toLowerCase().includes(keyword) ||
        row.phone?.includes(keyword)
      )
    }
    return true
  })
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

function fullImage(path) {
  if (!path) return '/images/avatar/default-user.png'
  if (path.startsWith('http')) return path
  return path
}

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('zh-CN')
}

function handleFilterChange() {
  currentPage.value = 1
}

function openDetail(row) {
  currentUser.value = { ...row }
  detailVisible.value = true
}

async function loadUsers() {
  loading.value = true
  try {
    const res = await getUsers({ pageNum: 1, pageSize: 500 })
    users.value = res?.data?.records || []
  } catch (e) {
    ElMessage.error('加载用户失败')
  } finally {
    loading.value = false
  }
}

async function toggleStatus(row) {
  const action = isActive(row.status) ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}用户 ${row.userName} 吗？`, '提示', { type: 'warning' })
    await updateUserStatus(row.userId, { status: isActive(row.status) ? 0 : 1 })
    ElMessage.success(`${action}成功`)
    await loadUsers()
    detailVisible.value = false
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

onMounted(loadUsers)
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

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 12px;
  background: #f7fbff;
}

.name-line {
  font-size: 18px;
  font-weight: 600;
}

.tag-line {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.group-card :deep(.el-card__header) {
  padding: 12px 14px;
  font-weight: 600;
}

.group-card :deep(.el-card__body) {
  padding: 12px 14px;
}

.kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px dashed #ecf1f7;
}

.kv:last-child {
  border-bottom: 0;
}

.kv span {
  color: #6b7280;
}

.kv b {
  font-weight: 500;
  color: #111827;
  text-align: right;
}

@media (max-width: 900px) {
  .group-grid {
    grid-template-columns: 1fr;
  }
}
</style>
