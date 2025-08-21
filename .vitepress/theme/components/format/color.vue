<template>
  <span :style="{ color: color }">
    <slot />
  </span>
</template>

<script>
export default {
  props: {
    color: {
      type: String,
      default: 'var(--vp-c-brand-1)' // 默认颜色，如果用户没有指定，则显示红色
    }
  }
}
</script>

<style scoped>
/* 这里不需要特别的样式，因为颜色是通过内联 style 动态设置的 */
</style>