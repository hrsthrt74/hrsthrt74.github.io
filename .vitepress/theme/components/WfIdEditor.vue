<template>

  <!-- 由 Gemini 编写 -->

  <div class="file-modifier-card">
    <div class="step-section">
      <h3>1. 上传文件 (.bin / .face)</h3>
      <input 
        type="file" 
        accept=".bin, .face" 
        @change="handleFileUpload"
        :class="{ 'file-input-error': fileError }"
      />
      <p v-if="fileName" class="success-message">
        ✅ 已选择: <strong>{{ fileName }}</strong> ({{ fileSize }} KB)
      </p>
      <p v-if="fileError" class="error-message">
        🚨 文件错误: {{ fileError }}
      </p>
    </div>

    <div class="step-section">
      <h3>2. 输入新 ID</h3>
      <input 
        type="text" 
        placeholder="74 06 16 000000"
        v-model="newId"
        maxlength="12"
        @input="validateId"
        class="vp-input"
        :class="{ 'vp-input-error': idError }"
      />
      <p v-if="idError" class="error-message">
        ⚠️ {{ idError }}
      </p>
      <p v-if="newId.length === 12 && !idError" class="success-message">
        ✨ ID 格式正确！
      </p>
    </div>

    <div class="step-section">
      <h3>3. 自定义文件名（可选）</h3>
      <input
        type="text"
        placeholder="保留原名留空，或输入新文件名（不需要扩展名）"
        v-model="customName"
        @input="validateCustomName"
        class="vp-input"
        :class="{ 'vp-input-error': nameError }"
      />
      <p v-if="nameError" class="error-message">🚨 {{ nameError }}</p>
    </div>




    <div 
      class="gemini"
      style="margin-top: 2.2rem; margin-bottom: -2.4rem; margin-right: 0.5rem; text-align: end; color: var(--vp-c-text-3);">
      <p>Written by Gemini</p>
    </div>




    <button 
      @click="processAndDownload" 
      :disabled="!isReady"
      class="vp-button"
    >
      📥 生成并下载
    </button>




    <!-- <div style="margin: 0.5rem 0;">
      <a href="/docs/technical/2025/watchface_id_modify">戳我看原理</a>
    </div> -->




  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const uploadedFile = ref(null);
const fileName = ref('');
const fileSize = ref(0);
const fileError = ref('');

const newId = ref('');
const idError = ref('');
const customName = ref('');
const nameError = ref('');

// 计算属性：检查是否准备好进行处理和下载
const isReady = computed(() => {
  return uploadedFile.value && !fileError.value && newId.value.length === 12 && !idError.value;
});

/**
 * 处理文件上传事件
 * @param {Event} event - 文件输入事件
 */
const handleFileUpload = (event) => {
  fileError.value = '';
  const file = event.target.files[0];
  if (!file) {
    uploadedFile.value = null;
    fileName.value = '';
    return;
  }

  // 简单验证文件后缀
  const validExtensions = ['.bin', '.face'];
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!validExtensions.includes(ext)) {
    fileError.value = '请上传 .bin 或 .face 文件。';
    uploadedFile.value = null;
    return;
  }

  uploadedFile.value = file;
  fileName.value = file.name;
  fileSize.value = (file.size / 1024).toFixed(2);
};

/**
 * 验证用户输入的 ID 是否为纯数字且长度为 12
 */
const validateId = () => {
  const id = newId.value.trim();
  if (id.length === 0) {
    idError.value = 'ID 不能为空。';
    return;
  }
  if (!/^\d+$/.test(id)) {
    idError.value = 'ID 必须为纯数字。';
    return;
  }
  if (id.length !== 12) {
    idError.value = 'ID 长度必须是 12 位。';
    return;
  }
  idError.value = ''; // 验证通过
};

/**
 * 验证自定义下载文件名（仅文件名，不含路径）
 * - 允许字母数字、空格、下划线、破折号、点（用于包含扩展名）
 * - 禁止路径分隔符和其它控制字符
 */
const validateCustomName = () => {
  const name = customName.value.trim();
  if (name.length === 0) {
    nameError.value = '';
    return;
  }

  // 禁止包含 / \ : * ? " < > | 等 Windows 禁用的文件名字符
  const invalidChars = /[\\/:*?"<>|]/;
  if (invalidChars.test(name)) {
    nameError.value = '文件名包含非法字符（\\ / : * ? " < > |）';
    return;
  }

  // 额外限制长度，防止过长
  if (name.length > 200) {
    nameError.value = '文件名过长。';
    return;
  }

  nameError.value = '';
};

/**
 * 将数字 ID 字符串转换为对应的 ASCII 码字节数组 (Uint8Array)
 * 例如: "740616000000" -> [55, 52, 48, 54, 49, 54, 48, 48, 48, 48, 48, 48] (十进制)
 * 对应 Hex: 37 34 30 36 31 36 30 30 30 30 30 30
 * @param {string} idString - 纯数字 ID 字符串
 * @returns {Uint8Array} - 包含 ID 字符 ASCII 码的字节数组
 */
const convertIdToAsciiBytes = (idString) => {
  const bytes = new Uint8Array(idString.length);
  for (let i = 0; i < idString.length; i++) {
    // String.prototype.charCodeAt() 返回给定索引处的字符的 UTF-16 编码
    bytes[i] = idString.charCodeAt(i);
  }
  return bytes;
};


/**
 * 核心逻辑：读取文件，修改 ID 区域，并触发下载
 */
const processAndDownload = async () => {
  if (!isReady.value) {
    alert('请先正确上传文件并输入 12 位纯数字 ID。');
    return;
  }

  const file = uploadedFile.value;

  // 1. 读取文件到 ArrayBuffer
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const arrayBuffer = e.target.result;
      const dataView = new Uint8Array(arrayBuffer); // 获取文件的字节视图

      // 2. 转换新的 ID 字符串为字节
      const newIdBytes = convertIdToAsciiBytes(newId.value);
      
      // 3. 定义修改的起始和结束偏移量
      // $00000020 08 (Hex 28, Dec 40) 到 $00000030 03 (Hex 33, Dec 51)
      const START_OFFSET = 40; // $0 \text{x}28$
      const END_OFFSET = 51;   // $0 \text{x}33$
      const ID_LENGTH = 12;

      if (dataView.length < END_OFFSET + 1) {
          alert('文件大小不足以容纳指定的 ID 区域，请确认文件是否正确。');
          return;
      }
      
      if (newIdBytes.length !== ID_LENGTH) {
           // 理论上应该被 validateId 拦截，但作为安全检查
           alert('内部错误：转换后的 ID 长度不正确。');
           return;
      }

      // 4. 将新 ID 字节写入到指定的偏移量
      for (let i = 0; i < ID_LENGTH; i++) {
        dataView[START_OFFSET + i] = newIdBytes[i];
      }

      // 5. 创建 Blob 并触发下载
      const modifiedBlob = new Blob([dataView.buffer], { type: file.type });
      const downloadUrl = URL.createObjectURL(modifiedBlob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;

      // 选择用于下载的文件名：优先使用用户自定义名（若非空且合法），否则保留原名
      let finalName = file.name;
      if (customName.value && !nameError.value) {
        const provided = customName.value.trim();
        // 若用户提供扩展名则直接使用；否则从原名获取扩展名并追加
        const hasExt = /\.[^./\\]+$/.test(provided);
        if (hasExt) {
          finalName = provided;
        } else {
          const origExtMatch = file.name.match(/\.[^./\\]+$/);
          const origExt = origExtMatch ? origExtMatch[0] : '';
          finalName = provided + origExt;
        }
      }

      // 一律不加前缀，按用户要求使用用户决定的文件名（或原名）
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // 清理 URL 对象
      URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('文件处理出错:', error);
      alert('文件处理过程中发生错误，请检查控制台。');
    }
  };

  reader.onerror = () => {
    fileError.value = '无法读取文件。';
  };

  reader.readAsArrayBuffer(file);
};
</script>

<style scoped>
/* 使用 VitePress 默认主题的 CSS 变量，确保样式匹配 */

h2 {
  margin-top: 0;
  color: var(--vp-c-text-1);
  border-bottom: none; /* 移除 VP 默认的 h2 下划线 */
}

h3 {
  color: var(--vp-c-brand-1); /* 步骤标题使用品牌色 */
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  border-bottom: none;
}

.description {
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.step-section {
  margin-bottom: 1rem;
}

.vp-input,
input[type="file"] {
  /* 模仿 VP 样式 */
  display: block;
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px; /* fallback: 不支持平滑圆角的浏览器 */
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s, background-color 0.2s;
}

/* 平滑圆角支持 - Chrome 144+ */
@supports (corner-shape: superellipse(1.5)) {
  .vp-input,
  input[type="file"] {
    border-radius: 12px; /* 平滑圆角 */
    corner-shape: superellipse(1.5);
  }
}

.vp-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
  outline: none;
}

/* 按钮样式模仿 VP 的主题按钮 */
.vp-button {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  border-radius: 20px; /* fallback: 不支持平滑圆角的浏览器 */
  font-weight: 500;
  background-color: var(--vp-c-brand-2);
  color: var(--vp-c-white);
  cursor: pointer;
  transition: background-color 0.25s, border-color 0.25s;
  margin-bottom: 0.5rem;
}

/* 平滑圆角支持 - Chrome 144+ */
@supports (corner-shape: superellipse(1.5)) {
  .vp-button {
    border-radius: 40px; /* 平滑圆角需要约2倍半径 (20px * 2) */
    corner-shape: superellipse(1.5);
  }
}

.vp-button:hover:not(:disabled) {
  background-color: var(--vp-c-brand-3);
}

.vp-button:disabled {
  background-color: var(--vp-c-gray-3);
  color: var(--vp-c-text-3);
  cursor: not-allowed;
}

/* 消息提示 */
.error-message, .file-input-error, .vp-input-error {
  color: var(--vp-c-danger-1); /* 红色 */
  margin-top: 0.5rem;
}
.success-message {
  color: var(--vp-c-success-1); /* 绿色 */
  margin-top: 0.5rem;
}
.info-message {
  color: var(--vp-c-text-3); /* 蓝色/提示色 */
  margin-top: 0.5rem;
}

.file-input-error, .vp-input-error {
  border-color: var(--vp-c-danger-1) !important;
}
</style>