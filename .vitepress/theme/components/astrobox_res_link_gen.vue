<script setup>
import { ref, computed } from 'vue';



// 由 Google Gemini 编写
// Script by Google Gemini



// 用于存储用户输入的资源名称
const resourceName = ref('');

// 基础链接
const baseUrl = 'https://astrobox.online/open?source=res&res=';
const suffixUrl = '&provider=official';

// 计算属性：根据 resourceName 生成最终的链接
const generatedLink = computed(() => {
  if (resourceName.value.trim() === '') {
    return '此处将显示生成的链接...'; // 如果没有输入，显示提示
  }
  // 对资源名称进行 URL 编码
  const encodedResourceName = encodeURIComponent(resourceName.value);
  return `${baseUrl}${encodedResourceName}${suffixUrl}`;
});

// 点击复制按钮时的提示文本
const copyButtonText = ref('复制链接');
let copyTimeout = null; // 用于清除延时器

// 复制链接到剪贴板
const copyLink = () => {
  // 检查浏览器是否支持 Clipboard API
  if (navigator.clipboard) {
    navigator.clipboard.writeText(generatedLink.value)
      .then(() => {
        copyButtonText.value = '已复制！✅';
        // 1.5 秒后恢复按钮文本
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
          copyButtonText.value = '复制链接';
        }, 1500);
      })
      .catch(err => {
        console.error('复制失败: ', err);
        copyButtonText.value = '复制失败 ❌';
      });
  } else {
    // 备用方案：对于不支持 Clipboard API 的浏览器
    fallbackCopyTextToClipboard(generatedLink.value);
    copyButtonText.value = '请手动复制 👆'; // 提示用户手动复制
  }
};

// 备用复制方法
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  // 避免在屏幕上显示文本区域
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    copyButtonText.value = '已复制！✅'; // 尽管是备用，也给个反馈
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      copyButtonText.value = '复制链接';
    }, 1500);
  } catch (err) {
    console.error('备用复制失败', err);
    copyButtonText.value = '复制失败 ❌';
  }
  document.body.removeChild(textArea);
};

const clearInput = () => {
  resourceName.value = ''; // 核心逻辑：将 resourceName 重置为空字符串
  copyButtonText.value = '复制链接'; // 清除后，复制按钮文字也恢复
  if (copyTimeout) clearTimeout(copyTimeout); // 清除可能还在计时的复制成功提示
}

</script>

<template>
  <div class="resource-link-generator">
    <!--
    <h3>🔗 AstroBox 资源链接生成器</h3>
    <p>快速生成资源链接。</p>
    -->

    <div class="input-section">
      <label for="resourceNameInput">资源名称：</label>
      <input
        id="resourceNameInput"
        v-model="resourceName"
        placeholder="例：多彩线条"
        @keyup.enter="copyLink"
      />
    </div>

    <div class="button-group">
  <button @click="copyLink" :disabled="!resourceName.trim()">
    {{ copyButtonText }}
  </button>
  <button class="clear-button" @click="clearInput" :disabled="!resourceName.trim()">
    清除
  </button>
</div>

    <div v-if="resourceName.trim()" class="output-section">
      <h4>生成链接（点击可跳转）</h4>
      <a :href="generatedLink" target="_blank" rel="noopener noreferrer">{{ generatedLink }}</a>
    </div>
    <div v-else class="output-section placeholder-text">
      {{ generatedLink }}
    </div>
  </div>
</template>

<style scoped>
.resource-link-generator {
  padding: 10px;
  border-radius: 8px;
  background-color: rgba(0,0,0,0); /* 如果不在折叠框里的话，可以设置成 --vp-c-bg-soft */
  margin-top: 20px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

h3 {
  color: var(--vp-c-brand-1);
  margin-top: 0;
  margin-bottom: 10px;
}

p {
  margin-bottom: 20px;
  color: var(--vp-c-text-2);
}

.input-section {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

label {
  font-weight: bold;
  color: var(--vp-c-text-1);
  white-space: nowrap; /* 防止文字换行 */
}

input {
  flex-grow: 1; /* 让输入框填充剩余空间 */
  padding: 10px 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  font-size: 1rem;
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-1);
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px rgba(var(--vp-c-brand-1-rgb), 0.2);
  outline: none;
}

.button-group {
  display: flex;
  gap: 10px; /* 按钮之间的间距 */
  margin-bottom: 15px;
}

button {
  display: inline-flex; /* 保持按钮内容居中 */
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background-color: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, opacity 0.2s;
  min-width: 100px; /* 避免文本变化时按钮大小跳动 */
}

.clear-button {
  background-color: var(--vp-c-bg-alt); /* 次要按钮的背景色 */
  color: var(--vp-c-text-1); /* 文字颜色 */
  border: 1px solid var(--vp-c-border);
}

button:hover {
  background-color: var(--vp-c-brand-2);
}


button.clear-button:disabled {
  background-color: var(--vp-c-gray-3);
  border: 0px solid var(--vp-c-border);
  cursor: not-allowed;
  opacity: 0.7;
}

button.clear-button:disabled:hover {
  background-color: var(--vp-c-gray-3);
  border: 0px solid var(--vp-c-border);
  cursor: not-allowed;
  opacity: 0.7;
}

button.clear-button:hover {
  background-color: var(--vp-c-red-soft);
}

button:disabled {
  background-color: var(--vp-c-gray-3);
  cursor: not-allowed;
  color: var(--vp-c-text-1);
  opacity: 0.7;
}

.output-section {
  margin-top: 25px;
  padding: 15px;
  background-color: var(--vp-c-bg-soft);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 6px;
  word-break: break-all; /* 防止长链接溢出 */
}

.output-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--vp-c-text-1);
}

.output-section a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  word-break: break-all;
}

.output-section a:hover {
  text-decoration: underline;
}

.placeholder-text {
  color: var(--vp-c-text-3);
  font-style: italic;
}
</style>