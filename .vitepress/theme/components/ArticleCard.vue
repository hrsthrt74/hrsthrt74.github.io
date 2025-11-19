<template>
  <div class="article-card">
    <a :href="link" class="card-link">
      <div class="card-image">
        <img :src="image" :alt="title" loading="lazy" />
      </div>
      <div class="card-content">
        <h3 class="card-title">{{ title }}</h3>
        <p class="card-description">{{ description }}</p>
      </div>
    </a>
  </div>
</template>

<script setup>
// 定义组件的 props
defineProps({
  image: {
    type: String,
    required: true,
    validator: (value) => value.trim().length > 0
  },
  link: {
    type: String,
    required: true,
    validator: (value) => value.trim().length > 0
  },
  title: {
    type: String,
    required: true,
    validator: (value) => value.trim().length > 0
  },
  description: {
    type: String,
    required: true,
    validator: (value) => value.trim().length > 0
  }
})
</script>

<style scoped>
.article-card {
  width: 100%;
  height: 100%;
}

.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  height: 100%;
  border-radius: 8px; /* fallback: 不支持平滑圆角的浏览器 */
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  transition: all 0.25s ease;
}

/* 平滑圆角支持 - 需要 Chrome 139+ */
@supports (corner-shape: squircle) {
  .card-link {
    border-radius: 28px; /* 平滑圆角 */
    corner-shape: squircle;
  }
}

.card-link:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--vp-shadow-2);
  transform: translateY(-2px);
}

.card-image {
  width: 100%;
  aspect-ratio: 3/2;
  overflow: hidden;
  background: var(--vp-c-default-soft);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: calc(100% - var(--image-height));
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  color: var(--vp-c-text-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-description {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}



/* 暗色模式适配 */
html.dark .card-link {
  background: var(--vp-c-bg-alt);
  border-color: var(--vp-c-divider);
}

html.dark .card-link:hover {
  border-color: var(--vp-c-brand-2);
  box-shadow: var(--vp-shadow-3);
}
</style>