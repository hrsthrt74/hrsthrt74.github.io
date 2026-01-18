<script setup>
import { withBase } from 'vitepress'
import { ref } from 'vue'

defineProps({
  data: {
    type: Array,
    required: true
  }
})

const loadedStates = ref({})

const onImageLoad = (index) => {
  loadedStates.value[index] = true
}

const getImgPath = (img) => {
    if (!img) return ''
    return withBase(`/doc/creation/avatar/${img}`)
}
</script>

<template>
  <div class="timeline-container">
    <div v-for="(item, index) in data" :key="index" class="node">
      <component 
        :is="item.link ? 'a' : 'div'" 
        :href="item.link" 
        class="card" 
        :class="{ 'has-link': item.link }"
      >
        <div class="card-content">
            <div class="info">
                <span v-if="item.date" class="time-label">{{ item.date }}</span>
                <h2 class="version-name">{{ item.title }}</h2>
                <p v-if="item.desc" class="description">{{ item.desc }}</p>
                <span v-if="item.link" class="link-hint">查看详情 -></span>
            </div>
            <div class="avatar-box" :class="{ shimmer: !loadedStates[index] }">
                <img 
                  v-if="item.image" 
                  :src="getImgPath(item.image)" 
                  :alt="item.title" 
                  loading="lazy" 
                  @load="onImageLoad(index)"
                  @error="onImageLoad(index)"
                />
                <div v-else class="no-image">加载中</div>
            </div>
        </div>
      </component>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  position: relative;
  max-width: 800px;
  margin: 40px auto;
  padding-left: 30px;
}

.timeline-container::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background-color: var(--vp-c-divider);
  border-radius: 2px;
}

.node {
  position: relative;
  margin-bottom: 40px;
}

.node::after {
  content: '';
  position: absolute;
  left: -35px;
  top: 24px;
  width: 14px;
  height: 14px;
  background-color: var(--vp-c-bg);
  border: 4px solid var(--vp-c-brand-1);
  border-radius: 50%;
  z-index: 1;
}

.card {
  display: block;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider); /* Flat style border */
  border-radius: 16px; /* fallback */
  /* box-shadow removed for flat style */
  transition: all 0.3s ease;
  text-decoration: none !important;
  color: var(--vp-c-text-1) !important;
  overflow: hidden;
}

/* 平滑圆角支持 */
@supports (corner-shape: superellipse(1.5)) {
  .card {
    border-radius: 32px; /* 平滑圆角 */
    corner-shape: superellipse(1.5);
  }
}

.card:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-alt); /* Slight highlight on hover */
}

.card-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    gap: 20px;
}

.info {
    flex: 1;
}

.version-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  border: none;
  padding: 0;
  color: var(--vp-c-brand-1);
}

.time-label {
  color: var(--vp-c-text-2);
  display: block;
  margin-bottom: 4px;
}

.description {
    margin: 0;
    font-size: 1rem;
    color: var(--vp-c-text-2);
}

.link-hint {
    display: inline-block;
    margin-top: 12px;
    font-size: 0.9rem;
    color: var(--vp-c-brand-1);
    font-weight: 500;
}

.avatar-box {
  width: 120px;
  height: 120px;
  border-radius: 16px; /* fallback */ 
  overflow: hidden;
  background-color: var(--vp-c-bg-alt);
  position: relative;
  flex-shrink: 0;
}

/* 平滑圆角支持 */
@supports (corner-shape: superellipse(1.5)) {
  .avatar-box {
    border-radius: 20px; /* 平滑圆角 */
    corner-shape: superellipse(1.5);
  }
}

.avatar-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  position: relative;
  z-index: 1; /* Ensure image is above background but below shimmer effect if tailored */
}

/* Skeleton Shimmer Effect */
.shimmer::before {
  content: "";
  position: absolute;
  top: 0;
  left: -150%;
  width: 150%;
  height: 100%;
  background: linear-gradient(
      to right,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
  );
  opacity: 0.5;
  transform: skewX(-25deg);
  animation: scan 2s infinite;
  z-index: 2;
  pointer-events: none;
}

/* Adjust for dark mode if needed */
.dark .shimmer::before {
    background: linear-gradient(
      to right,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
  );
}

@keyframes scan {
  0% { left: -150%; }
  100% { left: 150%; }
}

.no-image {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--vp-c-text-3);
    font-size: 0.8rem;
    text-align: center;
}

@media (max-width: 500px) {
    .card-content {
        flex-direction: column-reverse;
        align-items: flex-start;
    }
    .avatar-box {
        width: 100%;
        height: auto;
        aspect-ratio: 1/1;
    }
    .timeline-container {
        padding-left: 20px;
    }
    .node::after {
        left: -25px;
    }
}
</style>
