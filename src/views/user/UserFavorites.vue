<template>
  <el-card>
    <template #header>我的收藏</template>
    <el-tabs v-model="activeType" @tab-change="loadData">
      <el-tab-pane label="私厨收藏" name="chef" />
      <el-tab-pane label="套餐收藏" name="package" />
    </el-tabs>

    <el-empty v-if="!favorites.length" description="暂无收藏，去首页逛逛吧" />

    <div v-else class="grid">
      <div v-for="item in favorites" :key="item.favoriteId" class="card-item" :class="{ invalid: item.invalid }">
        <img class="cover" :src="item.targetImage" alt="收藏图" />
        <div class="name">{{ item.targetName }}</div>
        <div class="desc" v-if="item.favoriteType === 'chef'">
          评分：{{ item.extraInfo?.rating || '5.0' }} · 服务范围：{{ item.extraInfo?.serviceRadius || '-' }}km
        </div>
        <div class="desc" v-else>
          ¥{{ item.extraInfo?.price }} · {{ mealText(item.extraInfo?.mealType) }} · {{ item.extraInfo?.dishCount }}道菜
        </div>
        <el-tag v-if="item.invalid" type="danger" effect="light">已失效</el-tag>
        <div class="actions">
          <el-button size="small" @click="goDetail(item)">查看详情</el-button>
          <el-button size="small" type="warning" @click="unfavorite(item)">取消收藏</el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getFavoriteList, toggleFavorite } from '@/api/favorite'

const router = useRouter()
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const activeType = ref('chef')
const favorites = ref([])

function mealText(mealType) {
  return { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '宵夜' }[mealType] || '未知'
}

async function loadData() {
  const res = await getFavoriteList({ userId: userInfo.id, favoriteType: activeType.value })
  favorites.value = res.data || []
}

async function unfavorite(item) {
  const res = await toggleFavorite({
    userId: userInfo.id,
    favoriteType: item.favoriteType,
    targetId: item.targetId
  })
  if (res.code !== 200 || res.success === false) {
    ElMessage.error(res.message || '取消收藏失败')
    return
  }
  ElMessage.success('已取消收藏')
  await loadData()
}

function goDetail(item) {
  if (item.favoriteType === 'chef') {
    router.push(`/chef/${item.targetId}`)
    return
  }
  const chefId = item.extraInfo?.chefId
  if (chefId) {
    router.push(`/order/create/${chefId}?packageId=${item.targetId}`)
  }
}

onMounted(loadData)
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.card-item {
  background: #fff;
  border: 1px solid #dbeeff;
  border-radius: 14px;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.card-item.invalid {
  opacity: 0.7;
}

.cover {
  width: 100%;
  height: 120px;
  border-radius: 10px;
  object-fit: cover;
  background: #f5f8fc;
}

.name {
  color: #123d68;
  font-weight: 700;
}

.desc {
  color: #4d6f8d;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 8px;
}
</style>

