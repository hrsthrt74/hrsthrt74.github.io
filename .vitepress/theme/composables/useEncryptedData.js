// ============================================================
// useEncryptedData.js
// ============================================================
// 组合式函数：从 /data.json 获取 AES-256-CBC 加密数据，
// 用密码解密后返回标准 JSON 对象。
//
// 解密参数与 Python 后端完全对齐：
//   key  = SHA-256(password) → 32 字节
//   iv   = '0000000000000000'（16 字节 ASCII 字符 '0'）
//   mode = CBC
//   pad  = Pkcs7
// ============================================================

import { ref, onMounted } from 'vue'
import CryptoJS from 'crypto-js'

/** 16 字节固定 IV */
const IV = CryptoJS.enc.Utf8.parse('0000000000000000')

/** localStorage 缓存键名 */
const STORAGE_KEY = 'dashboard_key'

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
 * @throws 密码错误或数据损坏
 */
function decrypt(ciphertext, pwd) {
  const key = deriveKey(pwd)

  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })

  let utf8Str
  try {
    utf8Str = decrypted.toString(CryptoJS.enc.Utf8)
  } catch {
    throw new Error('密码错误，请重试')
  }
  if (!utf8Str) throw new Error('密码错误，请重试')

  try {
    return JSON.parse(utf8Str)
  } catch {
    throw new Error('密码错误，请重试')
  }
}

/**
 * 组合式函数：自动获取并尝试解密数据。
 *
 * @returns {object}
 *   - state      : ref<'loading'|'locked'|'unlocked'|'error'>
 *   - data       : ref<object|null> 解密后的完整数据
 *   - errorMsg   : ref<string>
 *   - password   : ref<string>      用户输入的密码
 *   - decrypting : ref<boolean>
 *   - handleDecrypt : () => Promise<void>  用户点击解密
 *   - clearCache    : () => void           清除缓存回到锁定
 *   - retry         : () => Promise<void>  重试获取
 */
export function useEncryptedData() {
  const state = ref('loading')
  const data = ref(null)
  const errorMsg = ref('')
  const password = ref('')
  const decrypting = ref(false)

  /** 原始密文 */
  const rawPayload = ref(null)

  /** 获取 data.json */
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

  /** 尝试用给定密码解密 */
  function tryDecrypt(pwd) {
    if (!rawPayload.value?.ciphertext) {
      errorMsg.value = '未找到加密数据'
      state.value = 'error'
      return
    }
    try {
      const d = decrypt(rawPayload.value.ciphertext, pwd)
      data.value = d
      localStorage.setItem(STORAGE_KEY, pwd)
      errorMsg.value = ''
      state.value = 'unlocked'
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY)
      errorMsg.value = e.message || '密码错误，请重试'
      state.value = 'locked'
    }
  }

  /** 完整流程：获取 → 尝试静默解密 */
  async function fetchAndTryDecrypt() {
    state.value = 'loading'
    errorMsg.value = ''
    await fetchData()
    if (state.value === 'error') return

    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      tryDecrypt(cached)
    } else {
      state.value = 'locked'
    }
  }

  /** 用户点击解密 */
  async function handleDecrypt() {
    const pwd = password.value.trim()
    if (!pwd) return
    decrypting.value = true
    errorMsg.value = ''
    await new Promise(r => setTimeout(r, 100))
    tryDecrypt(pwd)
    decrypting.value = false
  }

  /** 清除缓存，回到锁定 */
  function clearCache() {
    localStorage.removeItem(STORAGE_KEY)
    data.value = null
    password.value = ''
    errorMsg.value = ''
    state.value = 'locked'
  }

  /** 重试获取 */
  function retry() {
    fetchAndTryDecrypt()
  }

  onMounted(fetchAndTryDecrypt)

  return {
    state,
    data,
    errorMsg,
    password,
    decrypting,
    handleDecrypt,
    clearCache,
    retry,
  }
}

/** 导出工具函数供其他组件使用 */
export { decrypt, deriveKey, IV, STORAGE_KEY }
