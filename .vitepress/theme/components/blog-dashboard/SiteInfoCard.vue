<template>
  <div class="site-info-card">
    <div class="card-content">
      <h3 class="card-title">建站时间</h3>
      <div class="content">
        <span class="site-start-date">本站建于 2025 年 7 月 6 日，</span>
        <span class="site-runtime">已运行{{ runtimeText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const runtimeText = ref('')
let timer = null

// 计算运行时间
const calculateRuntime = () => {
  const startDate = new Date('2025-07-06')
  const now = new Date()
  const diff = now - startDate
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  runtimeText.value = ` ${days} 天 ${hours} 小时 ${minutes} 分钟 ${seconds} 秒~`
}

onMounted(() => {
  calculateRuntime()
  // 每秒更新一次
  timer = setInterval(calculateRuntime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.site-info-card {
  width: 100%;
  height: 100%;
  border-radius: 8px; /* fallback: 不支持平滑圆角的浏览器 */
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  padding: 16px;
  box-sizing: border-box;
}

/* 平滑圆角支持 - Chrome 144+ */
@supports (corner-shape: squircle) {
  .site-info-card {
    border-radius: 16px; /* 平滑圆角需要约2倍半径 (8px * 2) */
    corner-shape: squircle;
  }
}

.content {
  margin: 5px 0 2px 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  color: var(--vp-c-text-1);
}

.site-start-date {
  margin: 20px 0;
  color: var(--vp-c-text-1);
}

.site-runtime {
  margin: 0;
  color: var(--vp-c-text-1);
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 暗色模式适配 */
html.dark .site-info-card {
  background: var(--vp-c-bg-alt);
  border-color: var(--vp-c-divider);
}
</style>