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
        <button class="clear-cache-btn" @click="clearCache">清除缓存</button>
      </div>

      <!-- 数据摘要 -->
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-num">{{ decryptedData.resources?.length || 0 }}</span>
          <span class="summary-label">资源</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ totalComments }}</span>
          <span class="summary-label">评论</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ generatedTime }}</span>
          <span class="summary-label">更新于</span>
        </div>
      </div>
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-num">{{ fmtNum(totalDownloads) }}</span>
          <span class="summary-label">总下载</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ fmtNum(totalViews) }}</span>
          <span class="summary-label">总浏览</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ topCommentedResource ? topCommentedResource.name : '-' }}</span>
          <span class="summary-label">最热评论</span>
        </div>
      </div>

      <!-- 评论时间线 -->
      <div v-if="commentTimeline.length" class="comment-section">
        <h3 class="section-title">💬 评论时间线</h3>
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
                <span class="comment-nickname">{{ item.comment.nickname }}</span>
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

      <!-- JSON 明文展示（预留接入图表库的接口） -->
      <details class="json-details">
        <summary class="json-summary">📋 查看原始 JSON</summary>
        <pre class="json-pre">{{ JSON.stringify(decryptedData, null, 2) }}</pre>
      </details>
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
import CryptoJS from 'crypto-js'

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
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
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

/**
 * 评论时间线：将所有评论按时间倒序排列，并附带所属资源的 name 和 deviceCodename。
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
  padding: 32px 24px;
  text-align: center;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  box-sizing: border-box;
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
  margin-bottom: 20px;
}

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
  .clear-cache-btn {
    border-radius: 14px;
    corner-shape: superellipse(1.5);
  }
}

.clear-cache-btn:hover {
  color: var(--vp-c-danger-1);
  border-color: var(--vp-c-danger-1);
}

/* 数据摘要行 */
.summary-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
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
    border-radius: 16px;
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
  color: var(--vp-c-brand-1);
  line-height: 1.2;
}

.summary-label {
  display: block;
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-top: 4px;
}

/* ======== 评论时间线 ======== */
.comment-section {
  margin-top: 28px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
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
  padding: 16px;
  border-radius: 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  transition: border-color 0.2s;
}

@supports (corner-shape: superellipse(1.5)) {
  .timeline-item {
    border-radius: 16px;
    corner-shape: superellipse(1.5);
  }
}

@media (max-width: 640px) {
  .timeline-item {
    padding: 12px;
    gap: 10px;
  }
}

.timeline-item:hover {
  border-color: var(--vp-c-brand-1);
}

.timeline-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
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

.comment-time {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.comment-content {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
  word-break: break-word;
}

.comment-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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

.json-summary {
  cursor: pointer;
  font-size: 14px;
  color: var(--vp-c-text-2);
  padding: 20px 0 0 0;
  user-select: none;
}

.json-summary:hover {
  color: var(--vp-c-text-1);
}

.json-pre {
  margin-top: 12px;
  padding: 20px;
  border-radius: 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  overflow-x: auto;
  max-height: 600px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

@supports (corner-shape: superellipse(1.5)) {
  .json-pre {
    border-radius: 16px;
    corner-shape: superellipse(1.5);
  }
}

@media (max-width: 640px) {
  .json-pre {
    padding: 12px;
    font-size: 12px;
  }
}

/* ---- 错误状态 ---- */
.error-card .state-desc {
  color: var(--vp-c-danger-1);
}
</style>
