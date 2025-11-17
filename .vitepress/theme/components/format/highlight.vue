<template>
  <span class="highlight">
    <slot />
  </span>
</template>

<style scoped>
.highlight {
  background-color: rgba(255, 217, 5, 0.2); /* 你可以自定义颜色 */
  padding: 2px 4px;
  border-radius: 3px; /* fallback: 旧浏览器小圆角 */
}

/* 平滑圆角支持 - Chrome 144+ */
@supports (corner-shape: squircle) {
  .highlight {
    border-radius: 6px; /* 平滑圆角需要约2倍半径 (3px * 2) */
    corner-shape: squircle;
  }
}
</style>