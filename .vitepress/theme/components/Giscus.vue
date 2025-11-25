<script setup>
import { onMounted } from 'vue';
import { useData } from 'vitepress';

// 从 VitePress 提供的 useData 中获取当前页面的主题配置，
// 这样可以动态改变 Giscus 主题以匹配网站的主题
const { isDark } = useData();

// 你的 Giscus 配置，根据你提供的代码进行修改
const giscusConfig = {
  'data-repo': 'hrsthrt74/hrsthrt74.github.io',
  'data-repo-id': 'R_kgDOPHaK4g',
  'data-category': 'Announcements',
  'data-category-id': 'DIC_kwDOPHaK4s4CuifK',
  'data-mapping': 'pathname',
  'data-strict': '0',
  'data-reactions-enabled': '1',
  'data-emit-metadata': '0',
  'data-input-position': 'top',
  'data-lang': 'zh-CN', // 保持为中文
  'data-loading': 'lazy',
  // 注意: `data-theme` 需要根据网站的亮/暗模式动态设置
  'data-theme': isDark.value ? 'dark' : 'light',
};

// 在组件挂载后动态加载 Giscus 脚本
onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';

  // 将配置属性添加到 script 标签
  for (const key in giscusConfig) {
    script.setAttribute(key, giscusConfig[key]);
  }

  // 将 script 标签添加到指定的容器中
  const container = document.getElementById('giscus-container');
  if (container) {
    container.appendChild(script);
  }
});
</script>

<template>
  <!-- Giscus 的容器，动态加载的脚本会添加到这里 -->
  <div id="giscus-container"></div>
</template>
