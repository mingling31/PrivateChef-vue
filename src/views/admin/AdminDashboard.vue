<template>
  <div class="admin-dashboard">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </div>
      </template>

      <!-- 指标卡片区 -->
      <el-row :gutter="20" class="metrics-row">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon user-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ metrics.totalUsers || 0 }}</div>
                <div class="stat-label">平台总用户数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon chef-icon">
                <el-icon><Avatar /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ metrics.approvedChefs || 0 }}</div>
                <div class="stat-label">入驻私厨数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon order-icon">
                <el-icon><Tickets /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ metrics.totalOrders || 0 }}</div>
                <div class="stat-label">平台总订单数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon gmv-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value gmv-value">¥{{ formatGMV(metrics.totalGmv) }}</div>
                <div class="stat-label">平台总交易额</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区 -->
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :md="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>近7日订单趋势</span>
              </div>
            </template>
            <div ref="trendChartRef" class="chart-container" v-show="!loading"></div>
            <el-empty v-if="loading" description="加载中..." />
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>订单状态分布</span>
              </div>
            </template>
            <div ref="pieChartRef" class="chart-container" v-show="!loading"></div>
            <el-empty v-if="loading" description="加载中..." />
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { DataAnalysis, User, Avatar, Tickets, Money } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getDashboardStats } from '@/api/admin'
import dayjs from 'dayjs'

const loading = ref(true)
const metrics = reactive({
  totalUsers: 0,
  approvedChefs: 0,
  totalOrders: 0,
  totalGmv: 0
})

const trendChartRef = ref(null)
const pieChartRef = ref(null)
let trendChart = null
let pieChart = null

// 格式化GMV
function formatGMV(value) {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 获取数据
async function fetchDashboardStats() {
  try {
    loading.value = true
    const res = await getDashboardStats()
    if (res?.code === 200 && res?.data) {
      Object.assign(metrics, res.data.metrics)

      // 核心修复1：先将loading置为false，让v-show的div显示出来获得真实的容器宽度
      loading.value = false
      // 核心修复2：等待Vue将DOM更新完毕后再初始化ECharts
      await nextTick()

      initTrendChart(res.data.orderTrend)
      initPieChart(res.data.orderStatusDist)
    } else {
      loading.value = false
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    loading.value = false
  }
}

// 初始化折线图
function initTrendChart(trendData) {
  if (!trendChartRef.value) return

  if (trendChart) {
    trendChart.dispose()
  }

  trendChart = echarts.init(trendChartRef.value)

  const dates = trendData.map(item => dayjs(item.date).format('MM-DD'))
  const counts = trendData.map(item => item.count)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />订单数：{c}'
    },
    // 核心修复3：调整折线图网格，撑满整个卡片
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '5%',
      containLabel: true // 确保标签不会溢出容器边界
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#909399'
        }
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: {
        lineStyle: {
          color: '#909399'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#E4E7ED',
          type: 'dashed'
        }
      }
    },
    series: [{
      name: '订单数',
      type: 'line',
      data: counts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ]
        }
      }
    }]
  }

  trendChart.setOption(option)
}

// 初始化饼图
function initPieChart(statusData) {
  if (!pieChartRef.value) return

  if (pieChart) {
    pieChart.dispose()
  }

  pieChart = echarts.init(pieChartRef.value)

  const colorMap = {
    'unpaid': '#E6A23C',
    'pending_accept': '#909399',
    'serving': '#409EFF',
    'completed': '#67C23A',
    'cancelled': '#F56C6C'
  }

  const data = statusData.map(item => ({
    name: item.label,
    value: item.count,
    itemStyle: {
      color: colorMap[item.status] || '#909399'
    }
  }))

  const totalCount = data.reduce((sum, item) => sum + item.value, 0)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    // 核心修复4：调整Legend图例使其居中展示
    legend: {
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      itemGap: 20
    },
    series: [{
      name: '订单状态',
      type: 'pie',
      // 核心修复5：调大内外部半径，并将位置水平居中，略微偏上为底部图例留出空间
      radius: ['50%', '75%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: totalCount === 0 ? [{ name: '暂无数据', value: 1, itemStyle: { color: '#E4E7ED' } }] : data
    }]
  }

  pieChart.setOption(option)
}

// 响应式处理
function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  fetchDashboardStats()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (trendChart) {
    trendChart.dispose()
  }
  if (pieChart) {
    pieChart.dispose()
  }
})
</script>

<style scoped lang="scss">
.admin-dashboard {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-card {
  max-width: 1400px;
  margin: 0 auto;
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
  font-size: 18px;
  font-weight: 600;
  color: #303133;

  .el-icon {
    font-size: 20px;
    color: #409eff;
  }
}

.metrics-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 10px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;

  &.user-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.chef-icon {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.order-icon {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.gmv-icon {
    background: linear-gradient(135deg, #43e97b 0%, #38f9de 100%);
  }

  .el-icon {
    font-size: 28px;
  }
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 4px;

  &.gmv-value {
    color: #F56C6C;
    font-size: 24px;
  }
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-top: 24px;
}

.chart-card {
  border-radius: 10px;
  height: 100%;

  :deep(.el-card__header) {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
  }
}

.chart-header {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 420px;
}

// 响应式设计
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 12px;
  }

  .page-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .stat-value {
    font-size: 24px;

    &.gmv-value {
      font-size: 20px;
    }
  }

  .stat-icon {
    width: 50px;
    height: 50px;

    .el-icon {
      font-size: 24px;
    }
  }

  .chart-container {
    height: 300px;
  }
}
</style>