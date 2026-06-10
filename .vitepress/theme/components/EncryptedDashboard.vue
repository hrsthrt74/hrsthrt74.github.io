<template>
  <div class="encrypted-dashboard">
    <!-- ============ 加载中 ============ -->
    <div v-if="state === 'loading'" class="state-card loading-card">
      <div class="spinner"></div>
      <p class="state-text">正在获取数据...</p>
    </div>

    <!-- ============ 锁定状态（需输入密码） ============ -->
    <div v-else-if="state === 'locked'" class="state-card locked-card">
      <div class="lock-icon">🔒</div>
      <h2 class="state-title">该数据已加密</h2>
      <p class="state-desc">请输入密码以解密查看</p>

      <div class="input-group">
        <input
          ref="passwordInput"
          v-model="password"
          type="password"
          class="password-input"
          placeholder="输入解密密码"
          @keyup.enter="handleDecrypt"
        />
      </div>

      <button
        class="decrypt-btn"
        :disabled="!password.trim() || decrypting"
        @click="handleDecrypt"
      >
        <span v-if="decrypting" class="btn-spinner"></span>
        {{ decrypting ? '解密中...' : '🔓 解密' }}
      </button>

      <!-- 错误提示 -->
      <div v-if="errorMsg" class="error-banner">
        <span class="error-icon">⚠️</span>
        <span>{{ errorMsg }}</span>
      </div>
    </div>

    <!-- ============ 已解锁（展示数据） ============ -->
    <div v-else-if="state === 'unlocked' && decryptedData" class="state-card unlocked-card">
      <div class="unlock-header">
        <a class="switch-page-btn" href="/docs/creation/watchface/gallery">资源总览</a>
        <a class="header-btn refresh-btn" href="https://github.com/hrsthrt74/mibandtool-bot/actions/workflows/daily-fetch.yml" target="_blank" rel="noopener noreferrer">🔄 刷新数据</a>
        <button class="header-btn" @click="showRawJson">原始 JSON</button>
        <button class="header-btn danger" @click="clearCache">清除缓存</button>
      </div>

      <!-- JSON 查看模态框（DOM 动态渲染，不会被 Ctrl+F 搜索到） -->
      <Teleport to="body">
        <div v-if="jsonModalVisible" class="json-modal-overlay" @click.self="jsonModalVisible = false">
          <div class="json-modal">
            <div class="json-modal-header">
              <span>原始 JSON 数据</span>
              <button class="json-modal-close" @click="jsonModalVisible = false">&times;</button>
            </div>
            <pre class="json-modal-body" ref="jsonPreRef"></pre>
          </div>
        </div>
      </Teleport>

      <!-- 数据摘要 -->
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">资源</span>
          <span class="summary-num">{{ decryptedData.resources?.length || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">评论</span>
          <span class="summary-num">{{ totalComments }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">更新于</span>
          <span class="summary-num">{{ generatedTime }}</span>
        </div>
      </div>
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">总下载</span>
          <span class="summary-num">{{ fmtNum(totalDownloads) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总浏览</span>
          <span class="summary-num">{{ fmtNum(totalViews) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">最热评论</span>
          <span class="summary-num">{{ topCommentedResource ? topCommentedResource.name : '-' }}</span>
        </div>
      </div>

      <!-- ======== 图表可视化 ======== -->
      <div class="chart-toggle-bar">
        <button class="chart-toggle-btn" @click="chartsExpanded = !chartsExpanded">
          <span class="toggle-icon">{{ chartsExpanded ? '▼' : '▶' }}</span>
          {{ chartsExpanded ? '收起图表' : '展开图表' }}
        </button>
      </div>

      <div v-show="chartsExpanded" class="charts-grid">
        <div v-if="chartDeviceDistribution" class="chart-card">
          <h3 class="section-title">📱 设备资源分布</h3>
          <VChart :option="chartDeviceDistribution" autoresize class="chart-box" />
        </div>
        <div v-if="chartTopDownloads" class="chart-card">
          <h3 class="section-title">⬇️ 下载排行 Top 15</h3>
          <VChart :option="chartTopDownloads" autoresize class="chart-box" />
        </div>
        <div v-if="chartTopViews" class="chart-card">
          <h3 class="section-title">👁️ 浏览排行 Top 15</h3>
          <VChart :option="chartTopViews" autoresize class="chart-box" />
        </div>
        <div v-if="chartTopCommented" class="chart-card">
          <h3 class="section-title">💬 评论最多 Top 10</h3>
          <VChart :option="chartTopCommented" autoresize class="chart-box" />
        </div>
        <div v-if="chartCreationTrend" class="chart-card">
          <h3 class="section-title">📅 资源发布趋势</h3>
          <VChart :option="chartCreationTrend" autoresize class="chart-box" />
        </div>
        <div v-if="chartCommentTrend" class="chart-card">
          <h3 class="section-title">📅 评论活跃趋势</h3>
          <VChart :option="chartCommentTrend" autoresize class="chart-box" />
        </div>
        <div v-if="chartScatter" class="chart-card chart-card-wide">
          <h3 class="section-title">🔍 下载 vs 浏览（气泡大小=评论数）</h3>
          <VChart :option="chartScatter" autoresize class="chart-box" />
        </div>

      </div>

      <!-- 评论时间线 -->
      <div v-if="commentTimeline.length" class="comment-section">
        <div class="comment-section-header">
          <h3 class="section-title">💬 评论时间线</h3>
          <div class="comment-filter">
            <select v-model="selectedResourceId" class="filter-select">
              <option :value="null">全部资源（{{ totalComments }} 条）</option>
              <option
                v-for="opt in resourceFilterOptions"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.label }}（{{ opt.count }} 条）
              </option>
            </select>
          </div>
        </div>
        <div class="timeline">
          <div
            v-for="item in commentTimeline"
            :key="item.comment.id"
            class="timeline-item"
          >
            <div class="timeline-avatar">
              <img
                :src="item.comment.avator"
                :alt="item.comment.nickname"
                class="avatar-img"
                loading="lazy"
                @error="e => e.target.style.display='none'"
              />
            </div>
            <div class="timeline-body">
              <div class="timeline-header">
                <span
                  class="comment-nickname"
                  :class="{ 'is-owner': item.comment.nickname === 'hrsthrt74' }"
                >{{ item.comment.nickname }}</span>
                <span class="comment-time">{{ formatTime(item.comment.time) }}</span>
              </div>
              <p class="comment-content">{{ item.comment.content }}</p>
              <div class="comment-badges">
                <span class="badge badge-resource">{{ item.resourceName }}</span>
                <span class="badge badge-device">{{ item.deviceCodename }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- JSON 明文不渲染到 DOM 中，避免被浏览器 Ctrl+F 搜索到 -->
    </div>

    <!-- ============ 错误状态（网络/获取失败） ============ -->
    <div v-else-if="state === 'error'" class="state-card error-card">
      <div class="lock-icon">❌</div>
      <h2 class="state-title">数据获取失败</h2>
      <p class="state-desc">{{ errorMsg || '无法加载加密数据，请稍后重试。' }}</p>
      <button class="decrypt-btn" @click="fetchAndTryDecrypt">🔄 重试</button>
    </div>
  </div>
</template>

<script setup>
// ============================================================
// EncryptedDashboard.vue
// ============================================================
// 加密数据看板解密组件。
// 从 /data.json 获取 AES-256-CBC 加密的数据，用户输入密码后在浏览器端解密展示。
//
// 解密参数与 Python 后端完全对齐：
//   key  = SHA-256(password) → 32 字节
//   iv   = '0000000000000000'（16 字节 ASCII 字符 '0'）
//   mode = CBC
//   pad  = Pkcs7
//
// 依赖：npm install crypto-js
// ============================================================

import { ref, computed, onMounted, nextTick } from 'vue'
import { useData } from 'vitepress'
import CryptoJS from 'crypto-js'

// ---- ECharts 按需引入 ----
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  PieChart,
  BarChart,
  LineChart,
  ScatterChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// ----------------------------------------------------------
// 常量（与 Python 后端对齐）
// ----------------------------------------------------------

/** 16 字节固定 IV：ASCII 字符 '0' × 16 */
const IV = CryptoJS.enc.Utf8.parse('0000000000000000')

/** localStorage 缓存键名 */
const STORAGE_KEY = 'dashboard_key'

// ----------------------------------------------------------
// 响应式状态
// ----------------------------------------------------------

/** 状态机：loading | locked | decrypting | unlocked | error */
const state = ref('loading')

/** 用户输入的密码 */
const password = ref('')

/** 是否正在解密 */
const decrypting = ref(false)

/** 错误消息 */
const errorMsg = ref('')

/** 解密后的完整数据对象 */
const decryptedData = ref(null)

/** 从服务器获取的原始密文对象 { ciphertext: "..." } */
const rawPayload = ref(null)

/** 密码输入框引用 */
const passwordInput = ref(null)

/** JSON 模态框是否可见 */
const jsonModalVisible = ref(false)

/** JSON 模态框中的 <pre> 引用 */
const jsonPreRef = ref(null)

/** 图表区域是否展开 */
const chartsExpanded = ref(false)

/** 评论按资源筛选：选中的资源 ID（null = 全部） */
const selectedResourceId = ref(null)

// ----------------------------------------------------------
// 计算属性
// ----------------------------------------------------------

/** 评论总数 */
const totalComments = computed(() => {
  if (!decryptedData.value?.comments) return 0
  return Object.values(decryptedData.value.comments).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  )
})

/** 格式化的生成时间 */
const generatedTime = computed(() => {
  const ts = decryptedData.value?.generatedAt
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

/** 总下载量 */
const totalDownloads = computed(() => {
  if (!decryptedData.value?.resources) return 0
  let sum = 0
  for (const r of decryptedData.value.resources) {
    sum += r.downloadTimes || 0
  }
  return sum
})

/** 总浏览量 */
const totalViews = computed(() => {
  if (!decryptedData.value?.resources) return 0
  let sum = 0
  for (const r of decryptedData.value.resources) {
    sum += r.views || 0
  }
  return sum
})

/** 评论最多的作品 */
const topCommentedResource = computed(() => {
  const data = decryptedData.value
  if (!data?.resources || !data?.comments) return null

  let maxCount = 1
  let top = null
  for (const r of data.resources) {
    const cmts = data.comments[r.id]
    const count = Array.isArray(cmts) ? cmts.length : 0
    if (count >= maxCount) {
      maxCount = count
      top = r
    }
  }
  return top
})

/** 格式化大数字，加千分位逗号 */
function fmtNum(n) {
  if (n == null) return '0'
  return Number(n).toLocaleString('zh-CN')
}

// ----------------------------------------------------------
// VitePress 主题检测
// ----------------------------------------------------------

const { isDark } = useData()

/** 根据 VitePress 亮/暗模式提供 ECharts 用的颜色 token */
const chartTheme = computed(() => ({
  textColor: isDark.value ? '#c9d1d9' : '#3c3c43',
  textColorDim: isDark.value ? '#8b949e' : '#8e8e93',
  tooltipBg: isDark.value ? 'rgba(28,33,40,0.95)' : 'rgba(255,255,255,0.95)',
  tooltipBorder: isDark.value ? '#30363d' : '#d0d0d0',
  tooltipText: isDark.value ? '#c9d1d9' : '#3c3c43'
}))

// ----------------------------------------------------------
// 图表配色（与 VitePress 品牌色协调）
// ----------------------------------------------------------
const CHART_COLORS = [
  '#3451b2', '#e8733a', '#3c8e40', '#c53030',
  '#6f42c1', '#d48200', '#2b8a8a', '#b44d8c',
  '#5470c6', '#91cc75', '#fac858', '#ee6666',
  '#73c0de', '#3ba272', '#fc8452', '#9a60b4'
]

// ----------------------------------------------------------
// 图表计算属性
// ----------------------------------------------------------

// --- Chart 1: 设备资源分布（环形图） ---
const chartDeviceDistribution = computed(() => {
  const data = decryptedData.value
  if (!data?.resources?.length) return null

  const countMap = {}
  for (const r of data.resources) {
    const dn = r.deviceName || r.deviceCodename || '未知'
    countMap[dn] = (countMap[dn] || 0) + 1
  }
  const items = Object.entries(countMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
  const t = chartTheme.value

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      textStyle: { color: t.tooltipText }
    },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['55%', '50%'],
      itemStyle: { borderRadius: 4, borderColor: t.tooltipBorder, borderWidth: 2 },
      label: { color: t.textColor, formatter: '{b}\n{d}%' },
      data: items,
      color: CHART_COLORS
    }]
  }
})

// --- Chart 2: Top 15 下载排行（横向柱状图） ---
const chartTopDownloads = computed(() => {
  const data = decryptedData.value
  if (!data?.resources?.length) return null

  const sorted = [...data.resources].sort((a, b) => (b.downloadTimes || 0) - (a.downloadTimes || 0)).slice(0, 15)
  return makeHorizontalBar(sorted, 'downloadTimes', '下载量', '下载', CHART_COLORS[1])
})

// --- Chart 3: Top 15 浏览排行（横向柱状图） ---
const chartTopViews = computed(() => {
  const data = decryptedData.value
  if (!data?.resources?.length) return null

  const sorted = [...data.resources].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 15)
  return makeHorizontalBar(sorted, 'views', '浏览量', '浏览', CHART_COLORS[2])
})

// --- Chart 4: 评论最多作品排行（横向柱状图） ---
const chartTopCommented = computed(() => {
  const data = decryptedData.value
  if (!data?.resources?.length || !data?.comments) return null

  const withCount = data.resources.map(r => {
    const cmts = data.comments[r.id]
    const count = Array.isArray(cmts) ? cmts.length : 0
    return { ...r, _commentCount: count }
  })
  withCount.sort((a, b) => b._commentCount - a._commentCount)
  const top = withCount.slice(0, 10)

  return makeHorizontalBar(top, '_commentCount', '评论数', '评论', CHART_COLORS[3])
})

/**
 * 构建横向柱状图（Top N）的 ECharts option。
 */
function makeHorizontalBar(list, field, label, shortLabel, color) {
  const names = list.map(r => {
    const raw = r.name || '(无标题)'
    return raw.length > 14 ? raw.slice(0, 13) + '…' : raw
  }).reverse()
  const values = list.map(r => r[field] || 0).reverse()
  const t = chartTheme.value

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      textStyle: { color: t.tooltipText },
      formatter: p => {
        const d = p[0]
        return `${list[list.length - 1 - d.dataIndex].name}<br/>${shortLabel}: ${fmtNum(d.value)}`
      }
    },
    grid: { left: 100, right: 40, top: 5, bottom: 5 },
    xAxis: { type: 'value', axisLabel: { color: t.textColorDim, fontSize: 11, formatter: v => fmtNum(v) } },
    yAxis: { type: 'category', data: names, axisLabel: { color: t.textColor, fontSize: 12 }, inverse: true },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: { color, borderRadius: [0, 4, 4, 0] },
      barMaxWidth: 20
    }]
  }
}

// --- Chart 5: 资源发布趋势（面积图） ---
const chartCreationTrend = computed(() => {
  const data = decryptedData.value
  if (!data?.resources?.length) return null

  const monthMap = {}
  let minMonth = Infinity
  let maxMonth = -Infinity
  for (const r of data.resources) {
    if (!r.createdAt) continue
    const d = new Date(r.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = (monthMap[key] || 0) + 1
    const ms = d.getTime()
    if (ms < minMonth) minMonth = ms
    if (ms > maxMonth) maxMonth = ms
  }

  const allMonths = fillMonthRange(minMonth, maxMonth)
  const xData = allMonths
  const yData = allMonths.map(m => monthMap[m] || 0)
  const t = chartTheme.value

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      textStyle: { color: t.tooltipText }
    },
    grid: { left: 40, right: 20, top: 10, bottom: 25 },
    xAxis: { type: 'category', data: xData, axisLabel: { color: t.textColorDim, fontSize: 10, rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { color: t.textColorDim, fontSize: 11 } },
    series: [{
      type: 'line',
      data: yData,
      smooth: true,
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(52,81,178,0.25)' }, { offset: 1, color: 'rgba(52,81,178,0.02)' }] } },
      lineStyle: { color: CHART_COLORS[0], width: 2 },
      itemStyle: { color: CHART_COLORS[0] },
      symbol: 'circle',
      symbolSize: 4
    }]
  }
})

// --- Chart 6: 评论活跃趋势（面积图） ---
const chartCommentTrend = computed(() => {
  const data = decryptedData.value
  if (!data?.comments) return null

  const monthMap = {}
  let minMonth = Infinity
  let maxMonth = -Infinity
  for (const cmts of Object.values(data.comments)) {
    if (!Array.isArray(cmts)) continue
    for (const c of cmts) {
      if (!c.time) continue
      const d = new Date(c.time)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap[key] = (monthMap[key] || 0) + 1
      const ms = d.getTime()
      if (ms < minMonth) minMonth = ms
      if (ms > maxMonth) maxMonth = ms
    }
  }

  const allMonths = fillMonthRange(minMonth, maxMonth)
  const xData = allMonths
  const yData = allMonths.map(m => monthMap[m] || 0)
  const t = chartTheme.value

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      textStyle: { color: t.tooltipText }
    },
    grid: { left: 40, right: 20, top: 10, bottom: 25 },
    xAxis: { type: 'category', data: xData, axisLabel: { color: t.textColorDim, fontSize: 10, rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { color: t.textColorDim, fontSize: 11 } },
    series: [{
      type: 'line',
      data: yData,
      smooth: true,
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(232,115,58,0.25)' }, { offset: 1, color: 'rgba(232,115,58,0.02)' }] } },
      lineStyle: { color: CHART_COLORS[1], width: 2 },
      itemStyle: { color: CHART_COLORS[1] },
      symbol: 'circle',
      symbolSize: 4
    }]
  }
})

/** 填补两个时间戳之间的所有月份，返回 "YYYY-MM" 数组 */
function fillMonthRange(tsMin, tsMax) {
  if (!isFinite(tsMin) || !isFinite(tsMax)) return []
  const d = new Date(tsMin)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  const end = new Date(tsMax)
  const months = []
  while (d <= end) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() + 1)
  }
  return months
}

// --- Chart 7: 下载 vs 浏览（气泡散点图） ---
const chartScatter = computed(() => {
  const data = decryptedData.value
  if (!data?.resources?.length) return null

  // 按设备分组，每个设备一个 series
  const deviceGroups = {}
  for (const r of data.resources) {
    const dn = r.deviceName || r.deviceCodename || '未知'
    if (!deviceGroups[dn]) deviceGroups[dn] = []
    const cmts = data?.comments?.[r.id]
    const cmtCount = Array.isArray(cmts) ? cmts.length : 0
    deviceGroups[dn].push({
      value: [r.views || 0, r.downloadTimes || 0, cmtCount, r.name],
      name: r.name
    })
  }

  const deviceNames = Object.keys(deviceGroups)
  const series = deviceNames.map((dn, i) => ({
    name: dn,
    type: 'scatter',
    data: deviceGroups[dn],
    symbolSize: d => Math.max(6, Math.min(40, Math.sqrt(d[2] || 1) * 5)),
    itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length], opacity: 0.7 },
    emphasis: { itemStyle: { opacity: 1 } }
  }))
  const t = chartTheme.value

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      textStyle: { color: t.tooltipText },
      formatter: p => {
        const d = p.data.value || p.data
        return `<strong>${d[3] || p.seriesName}</strong><br/>浏览: ${fmtNum(d[0])}<br/>下载: ${fmtNum(d[1])}<br/>评论: ${d[2]}`
      }
    },
    legend: { top: 5, textStyle: { color: t.textColor, fontSize: 11 } },
    grid: { left: 55, right: 20, top: 45, bottom: 40 },
    xAxis: { type: 'value', name: '浏览', nameTextStyle: { color: t.textColorDim }, axisLabel: { color: t.textColorDim, fontSize: 10, formatter: v => fmtNum(v) } },
    yAxis: { type: 'value', name: '下载', nameTextStyle: { color: t.textColorDim }, axisLabel: { color: t.textColorDim, fontSize: 10, formatter: v => fmtNum(v) } },
    series
  }
})

/** 资源筛选下拉选项：用于评论过滤 */
const resourceFilterOptions = computed(() => {
  const data = decryptedData.value
  if (!data?.resources?.length) return []

  // 建立 resource ID → createdAt 的查找表
  const createdMap = {}
  for (const r of data.resources) {
    if (r.id != null) {
      createdMap[r.id] = r.createdAt ? new Date(r.createdAt).getTime() : 0
    }
  }

  // 只保留有评论的资源
  const options = []
  for (const r of data.resources) {
    const cmts = data.comments?.[r.id]
    if (!Array.isArray(cmts) || cmts.length === 0) continue
    options.push({
      id: r.id,
      label: r.name || `#${r.id}`,
      deviceName: r.deviceName || r.deviceCodename || '',
      count: cmts.length,
      createdAt: r.createdAt ? new Date(r.createdAt).getTime() : 0
    })
  }

  // 按上传时间降序排列（最新的在前）
  options.sort((a, b) => b.createdAt - a.createdAt)
  return options
})

/**
 * 评论时间线：将所有评论按时间倒序排列，并附带所属资源的 name 和 deviceCodename。
 * 如果 selectedResourceId 不为 null，则只显示该资源的评论。
 */
const commentTimeline = computed(() => {
  const data = decryptedData.value
  if (!data?.resources || !data?.comments) return []

  // 构建 resource 查找表：rid → { name, deviceCodename }
  const resourceMap = {}
  for (const r of data.resources) {
    if (r.id != null) {
      resourceMap[r.id] = { name: r.name, deviceCodename: r.deviceCodename }
    }
  }

  // 扁平化评论，附带资源信息
  const flat = []
  for (const [rid, cmts] of Object.entries(data.comments)) {
    // 如果筛选了特定资源，跳过其他资源
    if (selectedResourceId.value != null && String(rid) !== String(selectedResourceId.value)) continue
    const resInfo = resourceMap[rid] || { name: `#${rid}`, deviceCodename: '?' }
    for (const c of cmts) {
      flat.push({
        comment: c,
        resourceId: rid,
        resourceName: resInfo.name,
        deviceCodename: resInfo.deviceCodename
      })
    }
  }

  // 按时间倒序
  flat.sort((a, b) => (b.comment.time || 0) - (a.comment.time || 0))
  return flat
})

/**
 * 格式化毫秒时间戳为可读时间。
 */
function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ----------------------------------------------------------
// 核心逻辑
// ----------------------------------------------------------

/**
 * 从密码派生 AES-256 密钥（SHA-256 哈希）。
 * 与 Python hashlib.sha256(password.encode()).digest() 对齐。
 */
function deriveKey(pwd) {
  return CryptoJS.SHA256(pwd)
}

/**
 * AES-256-CBC 解密。
 * @param {string} ciphertext - Base64 编码的密文
 * @param {string} pwd - 用户输入的密码
 * @returns {object} 解密后的 JSON 对象
 * @throws 解密失败或 JSON 解析失败
 */
function decrypt(ciphertext, pwd) {
  const key = deriveKey(pwd)

  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })

  // 密码错误时，CryptoJS 解密出随机字节，转 UTF-8 会抛 "Malformed UTF-8 data"
  // 这里捕获并统一翻译为友好的中文提示
  let utf8Str
  try {
    utf8Str = decrypted.toString(CryptoJS.enc.Utf8)
  } catch {
    throw new Error('密码错误，请重试')
  }

  if (!utf8Str) {
    throw new Error('密码错误，请重试')
  }

  try {
    return JSON.parse(utf8Str)
  } catch {
    throw new Error('密码错误，请重试')
  }
}

/**
 * 尝试使用给定密码解密。
 * 成功 → 缓存密码，展示数据。
 * 失败 → 清除缓存，显示错误。
 */
function tryDecrypt(pwd) {
  if (!rawPayload.value?.ciphertext) {
    errorMsg.value = '未找到加密数据'
    state.value = 'error'
    return
  }

  try {
    const data = decrypt(rawPayload.value.ciphertext, pwd)
    // 成功
    decryptedData.value = data
    localStorage.setItem(STORAGE_KEY, pwd)
    errorMsg.value = ''
    state.value = 'unlocked'
  } catch (e) {
    // 失败
    localStorage.removeItem(STORAGE_KEY)
    errorMsg.value = e.message || '密码错误，请重试'
    state.value = 'locked'
  }
}

/**
 * 从服务器获取 data.json。
 */
async function fetchData() {
  try {
    const resp = await fetch('/data.json', { cache: 'no-cache' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    rawPayload.value = await resp.json()
    if (!rawPayload.value?.ciphertext) {
      throw new Error('无效的数据格式：缺少 ciphertext 字段')
    }
  } catch (e) {
    errorMsg.value = e.message
    state.value = 'error'
  }
}

/**
 * 完整流程：获取数据 → 尝试静默解密 → 决定状态。
 */
async function fetchAndTryDecrypt() {
  state.value = 'loading'
  errorMsg.value = ''

  await fetchData()
  if (state.value === 'error') return

  // 检查 localStorage 是否有缓存的密码
  const cachedPwd = localStorage.getItem(STORAGE_KEY)
  if (cachedPwd) {
    tryDecrypt(cachedPwd)
    // 如果缓存密码解密成功，state 已变为 unlocked
    // 如果失败，state 已变为 locked（由 tryDecrypt 处理）
  } else {
    state.value = 'locked'
  }
}

/**
 * 用户点击解密按钮。
 */
async function handleDecrypt() {
  const pwd = password.value.trim()
  if (!pwd) return

  decrypting.value = true
  errorMsg.value = ''

  // 微小的延迟让 UI 更新（显示加载状态）
  await new Promise(r => setTimeout(r, 100))

  tryDecrypt(pwd)
  decrypting.value = false
}

/**
 * 清除缓存：删除 localStorage 中的密码，回到锁定状态。
 */
function clearCache() {
  localStorage.removeItem(STORAGE_KEY)
  decryptedData.value = null
  password.value = ''
  errorMsg.value = ''
  state.value = 'locked'
}

/**
 * 打开 JSON 查看模态框。
 * 通过 textContent 动态注入 JSON，避免被浏览器 Ctrl+F 搜索到。
 */
function showRawJson() {
  if (!decryptedData.value) return
  jsonModalVisible.value = true
  nextTick(() => {
    if (jsonPreRef.value) {
      jsonPreRef.value.textContent = JSON.stringify(decryptedData.value, null, 2)
    }
  })
}

// ----------------------------------------------------------
// 生命周期
// ----------------------------------------------------------

onMounted(async () => {
  await fetchAndTryDecrypt()

  // 如果处于锁定状态，自动聚焦密码输入框
  if (state.value === 'locked') {
    await nextTick()
    passwordInput.value?.focus()
  }
})
</script>

<style scoped>
/* ============================================================
   组件样式 — 遵循 VitePress 主题变量
   ============================================================ */

.encrypted-dashboard {
  width: 100%;
  margin: 0 auto;
}

/* ---- 通用卡片 ---- */
.state-card {
  border-radius: 8px; /* fallback */
  padding: 16px 16px;
  text-align: center;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  box-sizing: border-box;
}

@supports (corner-shape: superellipse(1.5)) {
  .state-card {
    border-radius: 24px;
    corner-shape: superellipse(1.5);
  }
}

@media (max-width: 640px) {
  .state-card {
    padding: 20px 16px;
  }
}

/* ---- 加载状态 ---- */
.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-text {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 15px;
}

/* ---- 锁定状态 ---- */
.lock-icon {
  font-size: 56px;
  margin-bottom: 12px;
  line-height: 1;
}

.state-title {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-top: none;
  padding-top: 0;
}

.state-desc {
  margin: 0 0 24px 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

/* 密码输入组 */
.input-group {
  display: flex;
  align-items: center;
  max-width: 360px;
  margin: 0 auto 16px auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
  transition: border-color 0.2s;
}

@supports (corner-shape: superellipse(1.5)) {
  .input-group {
    border-radius: 16px;
    corner-shape: superellipse(1.5);
  }
}

.input-group:focus-within {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.password-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 16px;
  font-size: 15px;
  background: transparent;
  color: var(--vp-c-text-1);
  min-width: 0;
}

.password-input::placeholder {
  color: var(--vp-c-text-3);
}

/* 解密按钮 */
.decrypt-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  background: var(--vp-c-brand-1);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

@supports (corner-shape: superellipse(1.5)) {
  .decrypt-btn {
    border-radius: 16px;
    corner-shape: superellipse(1.5);
  }
}

.decrypt-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
  transform: translateY(-1px);
}

.decrypt-btn:active:not(:disabled) {
  transform: translateY(0);
}

.decrypt-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* 错误横幅 */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 16px;
  border-radius: 8px;
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
  font-size: 14px;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
}

@supports (corner-shape: superellipse(1.5)) {
  .error-banner {
    border-radius: 16px;
    corner-shape: superellipse(1.5);
  }
}

.error-icon {
  font-size: 16px;
  flex-shrink: 0;
}

/* ---- 已解锁状态 ---- */
.unlocked-card {
  text-align: left;
}

.unlock-header {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 20px;
}

.switch-page-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

@supports (corner-shape: superellipse(1.5)) {
  .switch-page-btn {
    border-radius: 14px;
    corner-shape: superellipse(1.5);
  }
}

.switch-page-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.update-content-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

@supports (corner-shape: superellipse(1.5)) {
  .update-content-btn {
    border-radius: 14px;
    corner-shape: superellipse(1.5);
  }
}

.update-content-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.header-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

@supports (corner-shape: superellipse(1.5)) {
  .header-btn {
    border-radius: 14px;
    corner-shape: superellipse(1.5);
  }
}

.header-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.header-btn.danger:hover {
  color: var(--vp-c-danger-1);
  border-color: var(--vp-c-danger-1);
}

.refresh-btn {
  text-decoration: none;
}

/* 数据摘要行 */
.summary-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.summary-item {
  flex: 1;
  min-width: 100px;
  padding: 16px;
  border-radius: 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  text-align: center;
}

@supports (corner-shape: superellipse(1.5)) {
  .summary-item {
    border-radius: 24px;
    corner-shape: superellipse(1.5);
  }
}

@media (max-width: 640px) {
  .summary-item {
    padding: 12px 8px;
    min-width: 80px;
  }
}

.summary-num {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  line-height: 1.2;
  overflow-wrap: break-word;
  word-break: break-all;
  margin-bottom: 4px;
}

.summary-label {
  display: block;
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-bottom: 4px;
}

/* ======== 评论时间线 ======== */
.comment-section {
  margin-top: 28px;
}

.comment-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.comment-filter {
  flex-shrink: 0;
}

.filter-select {
  padding: 6px 32px 6px 12px;
  font-size: 13px;
  font-family: inherit;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b949e' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
  transition: border-color 0.2s;
  max-width: 260px;
}

@supports (corner-shape: superellipse(1.5)) {
  .filter-select {
    border-radius: 16px;
    corner-shape: superellipse(1.5);
  }
}

.filter-select:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
  outline: none;
}

.filter-select:hover {
  border-color: var(--vp-c-brand-1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--vp-c-text-1);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  transition: border-color 0.2s, box-shadow 0.2s;
}

@supports (corner-shape: superellipse(1.5)) {
  .timeline-item {
    border-radius: 24px;
    corner-shape: superellipse(1.5);
  }
}

@media (max-width: 640px) {
  .timeline-item {
    padding: 10px 12px;
    gap: 10px;
  }
}

.timeline-item:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.timeline-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.timeline-body {
  flex: 1;
  min-width: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.comment-nickname {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.comment-nickname.is-owner {
  color: var(--vp-c-brand-1);
}

.comment-time {
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  margin-left: auto;
  flex-shrink: 0;
}

.comment-content {
  margin: 0 0 4px 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
  word-break: break-word;
}

.comment-content:empty {
  display: none;
}

.comment-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 10px 0 6px 0;
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.6;
}

.badge-resource {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.badge-device {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

/* ---- JSON 模态框 ---- */
.json-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  padding: 24px;
}

.json-modal {
  width: 100%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
}

@supports (corner-shape: superellipse(1.5)) {
  .json-modal {
    border-radius: 20px;
    corner-shape: superellipse(1.5);
  }
}

.json-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.json-modal-close {
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: var(--vp-c-text-3);
  padding: 0 4px;
  transition: color 0.2s;
}

.json-modal-close:hover {
  color: var(--vp-c-text-1);
}

.json-modal-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
  margin: 0;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  white-space: pre;
  tab-size: 2;
}

/* ---- 图表折叠 ---- */
.chart-toggle-bar {
  margin-top: 20px;
  text-align: center;
}

.chart-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

@supports (corner-shape: superellipse(1.5)) {
  .chart-toggle-btn {
    border-radius: 16px;
    corner-shape: superellipse(1.5);
  }
}

.chart-toggle-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.toggle-icon {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.2s;
}

/* ---- 图表网格 ---- */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  border-radius: 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  padding: 16px;
  overflow: hidden;
}

@supports (corner-shape: superellipse(1.5)) {
  .chart-card {
    border-radius: 24px;
    corner-shape: superellipse(1.5);
  }
}

.chart-card .section-title {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.chart-box {
  width: 100%;
  height: 320px;
}

.chart-card-wide {
  grid-column: 1 / -1;
}

.chart-card-wide .chart-box {
  height: 400px;
}

@media (max-width: 768px) {
  .chart-card-wide {
    grid-column: 1;
  }

  .chart-card-wide .chart-box {
    height: 320px;
  }

  .chart-box {
    height: 260px;
  }
}

/* ---- 错误状态 ---- */
.error-card .state-desc {
  color: var(--vp-c-danger-1);
}
</style>
