<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
  targetDate: {
    type: String,
    required: true
  }
});

const now = ref(Date.now());
let timer = null;

const targetTime = computed(() => new Date(props.targetDate).getTime());

const elapsedTime = computed(() => {
  const diff = now.value - targetTime.value;
  if (diff < 0) return '尚未开始'; // 处理目标时间在未来的情况

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365.25); // 考虑闰年

  const remainingSeconds = seconds % 60;
  const remainingMinutes = minutes % 60;
  const remainingHours = hours % 24;
  const remainingDays = days % 365;

  let result = '';
  if (years > 0) result += `${years}年 `;
  if (remainingDays > 0) result += `${remainingDays}天 `;
  if (remainingHours > 0) result += `${remainingHours}小时 `;
  if (remainingMinutes > 0) result += `${remainingMinutes}分钟 `;
  result += `${remainingSeconds}秒`;

  return result;
});

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <div class="time-since-container">
    <spam class="normal-text">Minecraft 1.7.10 已经</spam>
    <spam class="large-text">{{ elapsedTime }}</spam>
    <spam class="normal-text">岁大了</spam>
  </div>
</template>

<style scoped>
.time-since-container {
  background-color: transparent;
  display: flex;
  align-items: start;
  flex-direction: column;
  gap: 1em; /* 调整间距 */
}

.normal-text {
  font-size: 1em;
  color: inherit; /* 继承父元素的颜色，保持正常文本样式 */
}

.large-text {
  font-size: 2em; /* 调整为你想要的大字号 */
  font-weight: bold; /* 让大字更突出 */
  color: inherit; /* 继承父元素的颜色 */
}
</style>