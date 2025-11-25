<script setup>
import { ref, computed } from 'vue';

// 用户输入的原始文本
const inputText = ref('');

// 计算属性：实时进行URL编码
const encodedText = computed(() => {
  if (inputText.value.trim() === '') {
    return '此处将显示编码结果...';
  }
  return encodeURIComponent(inputText.value);
});

// 复制按钮的状态
const copyButtonText = ref('点击复制');
let copyTimeout = null;

// 复制编码结果到剪贴板
const copyResult = () => {
  if (inputText.value.trim() === '') {
    return; // 如果没有输入内容，不执行复制
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(encodedText.value)
      .then(() => {
        copyButtonText.value = '已复制！✅';
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
          copyButtonText.value = '点击复制';
        }, 1500);
      })
      .catch(err => {
        console.error('复制失败: ', err);
        copyButtonText.value = '复制失败 ❌';
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
          copyButtonText.value = '点击复制';
        }, 2000);
      });
  } else {
    // 备用复制方法
    fallbackCopyTextToClipboard(encodedText.value);
  }
};

// 备用复制方法
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    copyButtonText.value = '已复制！✅';
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      copyButtonText.value = '点击复制';
    }, 1500);
  } catch (err) {
    console.error('备用复制失败', err);
    copyButtonText.value = '复制失败 ❌';
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      copyButtonText.value = '点击复制';
    }, 2000);
  }
  document.body.removeChild(textArea);
}

// 清除输入
const clearInput = () => {
  inputText.value = '';
  copyButtonText.value = '点击复制';
  if (copyTimeout) clearTimeout(copyTimeout);
};
</script>

<template>
  <div class="url-encoder">
    <div class="input-section">
      <textarea
        id="inputText"
        v-model="inputText"
        placeholder="请输入需要编码的文字..."
        rows="4"
        @keydown.ctrl.enter="copyResult"
      />
    </div>

    <div class="button-group">
      <button @click="clearInput" :disabled="!inputText.trim()" class="clear-button">
        清除
      </button>
    </div>

    <div class="output-section" @click="copyResult" :class="{ 'has-content': inputText.trim() }">
      <h4>URL编码结果 <span v-if="inputText.trim()" class="copy-hint">（点击复制）</span></h4>
      <div class="result-text" :class="{ 'placeholder-text': !inputText.trim() }">
        {{ encodedText }}
      </div>
    </div>


    <div class="credit">
        <span>Component written by </span>
        <span>Claude Sonnet 4</span>
    </div>


  </div>
</template>

<style scoped>
.url-encoder {
  border-radius: 8px; /* fallback: 不支持平滑圆角 */
  background-color: rgba(0,0,0,0);
  margin-top: 20px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

/* 平滑圆角支持 - Chrome 139+ */
@supports (corner-shape: superellipse(1.5)) {
  .url-encoder {
    border-radius: 20px; /* 平滑圆角 */
    corner-shape: superellipse(1.5);
  }
}

.input-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  gap: 8px;
}

label {
  font-weight: bold;
  color: var(--vp-c-text-1);
}

textarea {
  padding: 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px; /* fallback: 不支持平滑圆角的浏览器 */
  font-size: 1rem;
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-1);
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

/* 平滑圆角 - Chrome 144+ */
@supports (corner-shape: superellipse(1.5)) {
  textarea {
    border-radius: 12px; /* 平滑圆角需要约2倍半径 (6px * 2) */
    corner-shape: superellipse(1.5);
  }
}

textarea:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px rgba(var(--vp-c-brand-1-rgb), 0.2);
  outline: none;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 6px; /* fallback 圆角 */
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s, opacity 0.2s;
  min-width: 80px;
}

/* 平滑圆角 - Chrome 144+ */
@supports (corner-shape: superellipse(1.5)) {
  button {
    border-radius: 12px; /* 平滑圆角需要约2倍半径 (6px * 2) */
    corner-shape: superellipse(1.5);
  }
}

.clear-button {
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-border);
}

.clear-button:hover:not(:disabled) {
  background-color: var(--vp-c-red-soft);
}

.clear-button:disabled {
  background-color: var(--vp-c-gray-3);
  border: 1px solid var(--vp-c-border);
  cursor: not-allowed;
  opacity: 0.7;
}

.output-section {
  margin-top: 25px;
  padding: 15px;
  background-color: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  border-radius: 6px; /* fallback 圆角 */
  transition: all 0.2s ease;
}

/* 平滑圆角 - Chrome 144+ */
@supports (corner-shape: superellipse(1.5)) {
  .output-section {
    border-radius: 12px; /* 平滑圆角需要约2倍半径 (6px * 2) */
    corner-shape: superellipse(1.5);
  }
}

.output-section.has-content {
  cursor: pointer;
  border-color: var(--vp-c-brand-1);
}

.output-section.has-content:hover {
  background-color: var(--vp-c-bg-alt);
  border-style: solid;
}

.output-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--vp-c-text-1);
  font-size: 1rem;
}

.copy-hint {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  font-weight: normal;
}

.result-text {
  word-break: break-all;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.95rem;
  /* padding: 8px; */
  /* background-color: var(--vp-c-bg); */
  border-radius: 3px; /* fallback: 小圆角 */
  border: 1px solid var(--vp-c-divider-light);
}

/* 平滑圆角 - Chrome 144+ */
@supports (corner-shape: superellipse(1.5)) {
  .result-text {
    border-radius: 6px; /* 平滑圆角需要约2倍半径 (3px * 2) */
    corner-shape: superellipse(1.5);
  }
}

.placeholder-text {
  color: var(--vp-c-text-3);
  font-style: italic;
  font-family: inherit;
}

.copy-status {
  margin-top: 10px;
  text-align: center;
  font-size: 0.9rem;
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .url-encoder {
    margin-left: 0;
    margin-right: 0;
  }
  
  textarea {
    font-size: 16px; /* 防止移动端缩放 */
  }
}

.credit {
  margin-top: 15px;
  margin-bottom: 10px;
  text-align: end;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

</style>