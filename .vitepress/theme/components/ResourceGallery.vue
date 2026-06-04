<template>
  <div class="resource-gallery">
    <!-- ============ 加载中 ============ -->
    <div v-if="state === 'loading'" class="state-card">
      <div class="spinner"></div>
      <p class="state-text">正在加载数据...</p>
    </div>

    <!-- ============ 锁定 ============ -->
    <div v-else-if="state === 'locked'" class="state-card">
      <div class="lock-icon">🔒</div>
      <h2 class="state-title">该页面已加密</h2>
      <p class="state-desc">请输入密码以查看资源总览</p>
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
      <div v-if="errorMsg" class="error-banner">
        <span>⚠️</span>
        <span>{{ errorMsg }}</span>
      </div>
    </div>

    <!-- ============ 错误 ============ -->
    <div v-else-if="state === 'error'" class="state-card">
      <div class="lock-icon">❌</div>
      <h2 class="state-title">数据获取失败</h2>
      <p class="state-desc">{{ errorMsg }}</p>
      <button class="decrypt-btn" @click="retry">🔄 重试</button>
    </div>

    <!-- ============ 已解锁 — 资源总览 ============ -->
    <div v-else-if="state === 'unlocked' && data" class="gallery-content">
      <!-- 顶部栏 -->
      <div class="gallery-toolbar">
        <div class="toolbar-left">
          <span class="gallery-title">📦 资源总览</span>
        </div>
        <div class="toolbar-right">
          <!-- 设备过滤 -->
          <select v-model="filterDevice" class="filter-select">
            <option value="">全部设备</option>
            <option v-for="d in data.devices" :key="d.codename" :value="d.codename">
              {{ d.name }} ({{ d.codename }})
            </option>
          </select>
          <!-- 排序 -->
          <select v-model="sortBy" class="filter-select">
            <option value="updatedAt">最新更新</option>
            <option value="downloadTimes">最多下载</option>
            <option value="views">最多浏览</option>
            <option value="createdAt">最新上传</option>
          </select>
          <a class="switch-page-btn" href="/docs/creation/watchface/dashboard">数据看板</a>
          <button class="view-toggle-btn" @click="toggleImages">
            {{ showImages ? '无图模式' : '有图模式' }}
          </button>
          <button class="clear-cache-btn" @click="clearCache">清除缓存</button>
        </div>
      </div>

      <!-- 统计条 -->
      <div class="gallery-stats">
        <span>共 <strong>{{ filteredResources.length }}</strong> 个资源</span>
        <span>总下载 <strong>{{ fmtNum(totalDl) }}</strong></span>
        <span>总浏览 <strong>{{ fmtNum(totalVw) }}</strong></span>
      </div>

      <!-- 资源网格 -->
      <div class="resource-grid">
        <div
          v-for="res in filteredResources"
          :key="res.id"
          class="resource-card"
          :class="{ expanded: expandedId === res.id }"
          @click="toggleExpand(res.id)"
        >
          <!-- 预览图 -->
          <div v-if="showImages" class="card-preview">
            <img
              :src="res.preview"
              :alt="res.name"
              loading="lazy"
              @error="e => e.target.src = fallbackPreview"
            />
            <span class="card-device-badge">{{ res.deviceCodename }}</span>
          </div>

          <!-- 基本信息（始终可见） -->
          <div class="card-info">
            <h3 class="card-name">{{ res.name }}</h3>
            <div class="card-stats-row">
              <span class="stat" title="下载"><span class="stat-icon">󰁯</span><span>{{ fmtNum(res.downloadTimes) }}</span></span>
              <span class="stat" title="浏览"><span class="stat-icon">󰀍</span><span>{{ fmtNum(res.views) }}</span></span>
              <span v-if="res.filesize" class="stat" title="大小">{{ fmtFileSize(res.filesize) }}</span>
            </div>
          </div>

          <!-- 展开详情 -->
          <div v-if="expandedId === res.id" class="card-details">
            <p v-if="res.desc" class="detail-desc">{{ res.desc }}</p>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">创建</span>
                <span class="detail-value">{{ fmtTime(res.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">更新</span>
                <span class="detail-value">{{ fmtTime(res.updatedAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">设备</span>
                <span class="detail-value">{{ res.deviceName || res.deviceCodename }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">ID</span>
                <span class="detail-value">{{ res.id }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空结果 -->
      <div v-if="filteredResources.length === 0" class="empty-state">
        <p>没有匹配的资源</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// ============================================================
// ResourceGallery.vue
// ============================================================
// 资源总览组件：解密后以网格形式展示所有资源，
// 支持按设备过滤、排序、点击展开详情。
// ============================================================

import { ref, computed, nextTick } from 'vue'
import { useEncryptedData } from '../composables/useEncryptedData.js'

const {
  state, data, errorMsg, password, decrypting,
  handleDecrypt, clearCache, retry
} = useEncryptedData()

// ----------------------------------------------------------
// 状态
// ----------------------------------------------------------

const passwordInput = ref(null)
const filterDevice = ref('')
const sortBy = ref('updatedAt')
const expandedId = ref(null)
const showImages = ref(import.meta.env.DEV)

// ----------------------------------------------------------
// 计算属性
// ----------------------------------------------------------

/** 按设备过滤 + 排序后的资源列表 */
const filteredResources = computed(() => {
  const resources = data.value?.resources
  if (!resources || !Array.isArray(resources)) return []

  let list = [...resources]

  // 过滤
  if (filterDevice.value) {
    list = list.filter(r => r.deviceCodename === filterDevice.value)
  }

  // 排序
  list.sort((a, b) => {
    const va = a[sortBy.value] || 0
    const vb = b[sortBy.value] || 0
    return vb - va // 降序
  })

  return list
})

/** 总下载（过滤后） */
const totalDl = computed(() =>
  filteredResources.value.reduce((s, r) => s + (r.downloadTimes || 0), 0)
)

/** 总浏览（过滤后） */
const totalVw = computed(() =>
  filteredResources.value.reduce((s, r) => s + (r.views || 0), 0)
)

// ----------------------------------------------------------
// 工具函数
// ----------------------------------------------------------

function fmtNum(n) {
  if (n == null) return '0'
  return Number(n).toLocaleString('zh-CN')
}

function fmtTime(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function fmtFileSize(bytes) {
  if (!bytes) return ''
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function toggleImages() {
  showImages.value = !showImages.value
}

const fallbackPreview =
  'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23e0e0e0"><rect width="400" height="300"/><text x="200" y="150" text-anchor="middle" fill="%23999" font-size="16">No Preview</text></svg>'
  )

// 锁定状态下自动聚焦
import { watch } from 'vue'
watch(state, async (val) => {
  if (val === 'locked') {
    await nextTick()
    passwordInput.value?.focus()
  }
})
</script>

<style scoped>
/* ============================================================
   ResourceGallery — 样式
   ============================================================ */

.resource-gallery {
  width: 100%;
  margin: 0 auto;
}

/* ---- 通用卡片（锁/加载/错误） ---- */
.state-card {
  border-radius: 8px;
  padding: 32px 24px;
  text-align: center;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

@supports (corner-shape: superellipse(1.5)) {
  .state-card {
    border-radius: 20px;
    corner-shape: superellipse(1.5);
  }
}

@media (max-width: 640px) {
  .state-card {
    padding: 20px 16px;
  }
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.state-text { margin: 0; color: var(--vp-c-text-2); font-size: 15px; }
.lock-icon { font-size: 56px; margin-bottom: 12px; line-height: 1; }
.state-title { margin: 0 0 8px; font-size: 22px; font-weight: 600; color: var(--vp-c-text-1); border-top: none; padding-top: 0; }
.state-desc { margin: 0 0 24px; color: var(--vp-c-text-2); font-size: 14px; }

.input-group {
  display: flex;
  align-items: center;
  max-width: 360px;
  margin: 0 auto 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
  transition: border-color 0.2s;
}

.input-group:focus-within {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

@supports (corner-shape: superellipse(1.5)) {
  .input-group { border-radius: 16px; corner-shape: superellipse(1.5); }
}

.password-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 16px;
  font-size: 15px;
  background: transparent;
  color: var(--vp-c-text-1);
}

.password-input::placeholder { color: var(--vp-c-text-3); }

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
  .decrypt-btn { border-radius: 16px; corner-shape: superellipse(1.5); }
}

.decrypt-btn:hover:not(:disabled) { background: var(--vp-c-brand-2); transform: translateY(-1px); }
.decrypt-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

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
  .error-banner { border-radius: 16px; corner-shape: superellipse(1.5); }
}

/* ---- 资源总览内容 ---- */
.gallery-content {
  text-align: left;
}

/* 顶部工具栏 */
.gallery-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.gallery-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.toolbar-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

@supports (corner-shape: superellipse(1.5)) {
  .filter-select { border-radius: 14px; corner-shape: superellipse(1.5); }
}

.filter-select:focus { border-color: var(--vp-c-brand-1); }

.clear-cache-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

@supports (corner-shape: superellipse(1.5)) {
  .clear-cache-btn { border-radius: 14px; corner-shape: superellipse(1.5); }
}

.clear-cache-btn:hover { color: var(--vp-c-danger-1); border-color: var(--vp-c-danger-1); }

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
  .update-content-btn { border-radius: 14px; corner-shape: superellipse(1.5); }
}

.update-content-btn:hover { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }

.view-toggle-btn {
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
  .view-toggle-btn { border-radius: 14px; corner-shape: superellipse(1.5); }
}

.view-toggle-btn:hover { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }

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
  .switch-page-btn { border-radius: 14px; corner-shape: superellipse(1.5); }
}

.switch-page-btn:hover { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }

/* 统计条 */
.gallery-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-size: 14px;
  color: var(--vp-c-text-2);
  flex-wrap: wrap;
}

@supports (corner-shape: superellipse(1.5)) {
  .gallery-stats { border-radius: 16px; corner-shape: superellipse(1.5); }
}

.gallery-stats strong {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

/* 资源网格 */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.resource-card {
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  cursor: pointer;
  transition: all 0.25s ease;
}

@supports (corner-shape: superellipse(1.5)) {
  .resource-card { border-radius: 20px; corner-shape: superellipse(1.5); }
}

.resource-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--vp-shadow-2);
  transform: translateY(-2px);
}

.resource-card.expanded {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

/* 预览图 */
.card-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1/1.4;
  overflow: hidden;
  background: var(--vp-c-default-soft);
}


.card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.resource-card:hover .card-preview img {
  transform: scale(1.05);
}

.card-device-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(0,0,0,0.65);
  color: #fff;
  line-height: 1.6;
}

@supports (corner-shape: superellipse(1.5)) {
  .card-device-badge { border-radius: 14px; corner-shape: superellipse(1.5); }
}

/* 基本信息 */
.card-info {
  padding: 14px;
}

.card-name {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-stats-row {
  display: flex;
  gap: 6px;
  margin-bottom: 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.stat {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
}

.stat-icon {
  font-family: 'HyperOS Symbols', var(--vp-font-family-base);
}

.card-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.6;
}

@supports (corner-shape: superellipse(1.5)) {
  .badge { border-radius: 14px; corner-shape: superellipse(1.5); }
}

.badge-resource {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

/* 展开详情 */
.card-details {
  padding: 0 14px 14px;
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 0;
}

.detail-desc {
  margin: 12px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
}

.detail-value {
  font-size: 13px;
  color: var(--vp-c-text-1);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--vp-c-text-3);
}

/* ---- 暗色模式 ---- */
html.dark .resource-card { background: var(--vp-c-bg-alt); }
html.dark .resource-card.expanded { background: var(--vp-c-bg); }
</style>
