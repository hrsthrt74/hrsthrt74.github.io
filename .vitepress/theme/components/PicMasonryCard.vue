<template>
  <div ref="rootEl" class="pic-masonry-card">
    <component
      :is="hasLink ? 'a' : 'div'"
      ref="cardEl"
      :href="hasLink ? link : undefined"
      class="card-link"
      :class="{ 'card-link--preview': !hasLink }"
      :role="hasLink ? undefined : 'button'"
      :tabindex="hasLink ? undefined : 0"
      @click="handleCardClick"
      @keydown.enter.prevent="handleCardClick"
      @keydown.space.prevent="handleCardClick"
    >
      <div class="card-image">
        <img :src="image" :alt="title" loading="lazy" @load="scheduleLayout" />
      </div>
      <div class="card-content">
        <h3 class="card-title">{{ title }}</h3>
        <p class="card-description">{{ description }}</p>
        <p v-if="date" class="card-date">{{ date }}</p>
      </div>
    </component>

    <Teleport to="body">
      <div
        v-if="isPreviewOpen"
        class="image-preview-overlay"
        @click.self="closePreview"
      >
        <button
          type="button"
          class="image-preview-close"
          aria-label="Close image preview"
          @click="closePreview"
        >
          ×
        </button>
        <img class="image-preview-content" :src="image" :alt="title" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  image: {
    type: String,
    required: true,
    validator: (value) => value.trim().length > 0
  },
  link: {
    type: String,
    default: ''
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
  },
  date: {
    type: String,
    default: ''
  }
})

const hasLink = computed(() => props.link.trim().length > 0)
const isPreviewOpen = ref(false)

const rootEl = ref(null)
const cardEl = ref(null)
let resizeObserver = null
let rafId = 0

const scheduleLayout = () => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }

  rafId = requestAnimationFrame(() => {
    rafId = 0
    applyMasonrySpan()
  })
}

const handleCardClick = () => {
  if (hasLink.value) {
    return
  }

  openPreview()
}

const openPreview = () => {
  isPreviewOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closePreview = () => {
  isPreviewOpen.value = false
  document.body.style.overflow = ''
}

const handleGlobalKeydown = (event) => {
  if (event.key === 'Escape' && isPreviewOpen.value) {
    closePreview()
  }
}

const applyMasonrySpan = () => {
  const root = rootEl.value
  const card = cardEl.value
  if (!root || !card) {
    return
  }

  const grid = root.parentElement
  if (!grid) {
    return
  }

  const gridStyles = window.getComputedStyle(grid)
  if (gridStyles.display !== 'grid') {
    return
  }

  const rowSize = Number.parseFloat(gridStyles.getPropertyValue('grid-auto-rows'))
  const rowGap = Number.parseFloat(gridStyles.getPropertyValue('row-gap'))

  if (!rowSize || Number.isNaN(rowSize)) {
    return
  }

  const cardHeight = card.getBoundingClientRect().height
  const gap = Number.isNaN(rowGap) ? 0 : rowGap
  const span = Math.max(1, Math.ceil((cardHeight + gap) / (rowSize + gap)))
  root.style.gridRowEnd = `span ${span}`
}

onMounted(async () => {
  await nextTick()
  scheduleLayout()

  resizeObserver = new ResizeObserver(() => {
    scheduleLayout()
  })

  if (cardEl.value) {
    resizeObserver.observe(cardEl.value)
  }

  window.addEventListener('resize', scheduleLayout, { passive: true })
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  window.removeEventListener('resize', scheduleLayout)
  window.removeEventListener('keydown', handleGlobalKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.pic-masonry-card {
  width: 100%;
}

.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  transition: all 0.25s ease;
}

@supports (corner-shape: superellipse(1.5)) {
  .card-link {
    border-radius: 20px;
    corner-shape: superellipse(1.5);
  }
}

.card-link:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--vp-shadow-2);
  transform: translateY(-2px);
}

.card-link--preview {
  cursor: zoom-in;
}

.card-image {
  width: 100%;
  overflow: hidden;
  background: var(--vp-c-default-soft);
}

.card-image img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.25s ease;
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
}

.card-date {
  margin: 0 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
  opacity: 0.8;
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.image-preview-content {
  max-width: min(1200px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
}

.image-preview-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.image-preview-close:hover {
  background: rgba(255, 255, 255, 0.28);
}

html.dark .card-link {
  background: var(--vp-c-bg-alt);
  border-color: var(--vp-c-divider);
}

html.dark .card-link:hover {
  border-color: var(--vp-c-brand-2);
  box-shadow: var(--vp-shadow-3);
}
</style>