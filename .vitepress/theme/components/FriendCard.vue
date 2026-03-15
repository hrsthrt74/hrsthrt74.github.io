<template>
  <a :href="link" class="friend-card" target="_blank" rel="noopener noreferrer">
    <div class="friend-icon">
      <img v-if="isImgIcon" :src="icon" :alt="title" loading="lazy" />
      <span v-else class="friend-icon-text">{{ icon }}</span>
    </div>
    <div class="friend-info">
      <span class="friend-title">{{ title }}</span>
      <span class="friend-desc">{{ desc }}</span>
    </div>
  </a>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    required: true
  }
})

const isImgIcon = computed(() =>
  props.icon.startsWith('http') || props.icon.startsWith('/')
)
</script>

<style scoped>
.friend-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px; /* fallback: 不支持平滑圆角的浏览器 */
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
  overflow: hidden;
}

/* 平滑圆角支持 - 需要 Chrome 139+ */
@supports (corner-shape: superellipse(1.5)) {
  .friend-card {
    border-radius: 20px;
    corner-shape: superellipse(1.5);
  }
}

.friend-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--vp-shadow-2);
  transform: translateY(-2px);
}

/* ---------- icon ---------- */
.friend-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--vp-c-default-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.friend-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-icon-text {
  font-size: 24px;
  line-height: 1;
  user-select: none;
}

/* ---------- text ---------- */
.friend-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.friend-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-desc {
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---------- 暗色适配 ---------- */
html.dark .friend-card {
  background: var(--vp-c-bg-alt);
  border-color: var(--vp-c-divider);
}

html.dark .friend-card:hover {
  border-color: var(--vp-c-brand-1);
}
</style>
