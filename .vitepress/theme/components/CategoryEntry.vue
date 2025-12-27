<template>
  <a 
    class="category-entry" 
    :href="href" 
    :style="{ '--entry-color': color }"
  >
    <div class="icon-wrapper">
      <img v-if="isImage" :src="icon" :alt="title" class="icon-image" :class="{ 'is-svg': isSVG }" />
      <i v-else-if="isIconClass" :class="icon"></i>
      <span v-else class="icon-text">{{ icon }}</span>
    </div>
    
    <span class="title">{{ title }}</span>
    
    <div class="spacer"></div>
    
    <div class="arrow-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
      </svg>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  icon?: string
  title: string
  color?: string
  target: string
}>()

const href = computed(() => {
  // 确保 target 不以 / 开头或结尾，避免双重斜杠
  const cleanTarget = props.target.replace(/^\/+|\/+$/g, '')
  return `./${cleanTarget}/`
})

const isImage = computed(() => {
  if (!props.icon) return false
  return props.icon.startsWith('/') || /\.(png|jpe?g|svg|webp|gif)$/i.test(props.icon)
})

const isSVG = computed(() => {
  return props.icon && /\.svg$/i.test(props.icon)
})

// 简单判断是否为 CSS 类名 (包含 - 或空格)
const isIconClass = computed(() => {
  if (!props.icon || isImage.value) return false
  return props.icon.includes('-') || props.icon.includes(' ')
})
</script>

<style scoped>
.category-entry {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px 20px; /* 增加高度 */
  margin-bottom: 12px;
  border-radius: 12px; /* fallback */
  text-decoration: none !important;
  color: var(--vp-c-text-1) !important;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid transparent; /* 去掉描边 */
  transition: background-color 0.3s ease;
  position: relative;
  overflow: hidden;
  
  /* 默认主题色，如果没有传入 color */
  --entry-color: var(--vp-c-brand-1);
  /* 深色模式下自动变亮的主题色变量 */
  --entry-color-light: var(--entry-color);
}

/* 平滑圆角支持 */
@supports (corner-shape: superellipse(1.5)) {
  .category-entry {
    border-radius: 20px;
    corner-shape: superellipse(1.5);
  }
}

/* 深色模式下，让主题色稍微亮一点，用于图标等显示 */
.dark .category-entry {
  --entry-color-light: color-mix(in srgb, var(--entry-color), white 15%);
}

/* 背景渐变效果 - 稍微加深 */
.category-entry::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg, 
    color-mix(in srgb, var(--entry-color), transparent 80%) 0%, 
    color-mix(in srgb, var(--entry-color), transparent 92%) 50%,
    transparent 100%
  );
  opacity: 0.9; /* 增加不透明度 */
  transition: opacity 0.3s ease;
  z-index: 0;
}

.dark .category-entry::before {
  /* 深色模式下背景也稍微亮一点点 */
  background: linear-gradient(
    90deg, 
    color-mix(in srgb, var(--entry-color-light), transparent 75%) 0%, 
    color-mix(in srgb, var(--entry-color-light), transparent 90%) 50%,
    transparent 100%
  );
  opacity: 0.6;
}

.category-entry:hover::before {
  opacity: 1;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 12px; /* 减小左间距 (图标与文字的间距) */
  z-index: 1;
  color: var(--vp-c-text-1);
  width: 32px; /* 固定宽度确保对齐 */
  height: 32px;
}

.icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.icon-text {
  font-family: 'HyperOS Symbols', var(--vp-font-family-base);
}

/* 矢量图标 (SVG 和 Icon Class) 样式 */
.icon-image.is-svg,
.icon-wrapper i {
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

/* 深色模式下 SVG 反色 */
.dark .icon-image.is-svg {
  filter: invert(1);
}

.title {
  font-size: 18px;
  font-weight: 600;
  z-index: 1;
}

.spacer {
  flex: 1;
}

.arrow-icon {
  display: flex;
  align-items: center;
  color: var(--vp-c-text-3);
  transition: transform 0.3s ease, color 0.3s ease;
  z-index: 1;
}

.category-entry:hover .arrow-icon {
  color: var(--entry-color-light);
  transform: translateX(4px);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .category-entry {
    padding: 16px 16px; /* 移动端稍微减小 padding */
  }
  
  .icon-wrapper {
    font-size: 20px;
    margin-right: 10px;
    width: 28px;
    height: 28px;
  }
  
  .title {
    font-size: 16px;
  }
}
</style>
