<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress' // 导入 useData 钩子

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  resourceName: {
    type: String,
    required: true
  }
})

// 使用 useData 获取全局数据，其中包括 isDark
const { isDark } = useData()

// 根据 isDark 的值计算图片 URL
const imageUrl = computed(() => {
  return isDark.value
    ? 'https://astrobox.online/goab/zhcn/black.svg' // 深色模式图片
    : 'https://astrobox.online/goab/zhcn/white.svg' // 浅色模式图片
})

const linkUrl = computed(() => { // 也可以把 linkUrl 变成 computed，虽然这里不是必须的
  return `https://astrobox.online/open?source=res&res=${props.resourceName}&provider=official`
})
</script>

<template>
  <a :href="linkUrl" target="_blank" rel="noopener noreferrer" class="card-link-container">
    <div class="card-link-title">{{ title }}</div>
    <div class="card-link-button">
      <img :src="imageUrl" :alt="title + ' 资源链接'">
    </div>
  </a>
</template>

<style scoped>
.card-link-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px; /* fallback: 不支持平滑圆角的浏览器 */
  padding: 16px 16px;
  margin-bottom: 20px;
  background-color: var(--vp-c-bg-soft);
  transition: border-color 0.25s, background-color 0.25s;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

/* 平滑圆角支持 - Chrome 139+ */
@supports (corner-shape: superellipse(1.5)) {
  .card-link-container {
    border-radius: 20px; /* 平滑圆角 */
    corner-shape: superellipse(1.5);
  }
}

.card-link-container:hover {
  border-color: var(--vp-c-brand-1);
}

.card-link-title {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.card-link-button img {
  height: 36px; /* 设定固定高度 */
  width: auto; /* 宽度自动调整以保持比例 */
  vertical-align: middle;
  margin-left: 8px;
}

img {
  border-radius: 0px !important; /* 确保图片圆角不被style.css里的圆角覆盖 */
}

</style>