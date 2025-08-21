<template>
  <span class="highlight">
    <slot />
  </span>
</template>

<style scoped>
.highlight {
  background-color: rgba(255, 217, 5, 0.2); /* 你可以自定义颜色 */
  padding: 2px 4px;
  border-radius: 4px;
}
</style>