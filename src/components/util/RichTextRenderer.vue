<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  lineClamp: {
    type: [Number, String],
    default: null,
  },
  maxHeight: {
    type: String,
    default: null,
  },
})

const IMAGE_URL_PATTERN = /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp|avif|svg)(?:\?[^\s<>"']*)?/gi

const sanitizeHtml = (html) => {
  if (!html) return ''
  
  const div = document.createElement('div')
  div.innerHTML = html
  
  // Remove dangerous elements
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button']
  dangerousTags.forEach(tag => {
    div.querySelectorAll(tag).forEach(el => el.remove())
  })
  
  // Remove event handlers
  div.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name)
      }
    })
  })
  
  // Add target="_blank" and rel="noopener" to links
  div.querySelectorAll('a').forEach(link => {
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
  })
  
  return div.innerHTML
}

const isPlainText = (content) => {
  if (!content) return true
  const stripped = content.replace(/<[^>]*>/g, '').trim()
  return stripped === content.trim()
}

const convertImageUrls = (text) => {
  return text.replace(IMAGE_URL_PATTERN, (url) => {
    return `<img src="${url}" alt="Imagen" class="max-w-full rounded-lg my-2" loading="lazy" />`
  })
}

const processedContent = computed(() => {
  if (!props.content) return ''
  
  let html = props.content
  
  // If it's plain text, wrap in paragraph and convert image URLs
  if (isPlainText(html)) {
    html = html.split('\n').filter(Boolean).map(line => {
      const processed = convertImageUrls(line)
      return `<p>${processed}</p>`
    }).join('')
  } else {
    html = sanitizeHtml(html)
  }
  
  return html
})

const lineClampClass = computed(() => {
  if (!props.lineClamp) return ''
  return `line-clamp-${props.lineClamp}`
})

const containerStyle = computed(() => {
  if (!props.maxHeight) return {}
  return {
    maxHeight: props.maxHeight,
    overflowY: 'auto',
  }
})
</script>

<template>
  <div
    class="rich-text-renderer prose prose-sm dark:prose-invert max-w-none"
    :class="[lineClampClass, { 'description-scroll': maxHeight }]"
    :style="containerStyle"
    v-html="processedContent"
  ></div>
</template>

<style scoped>
@reference "@/style.css";

.rich-text-renderer {
  @apply text-sm text-slate-700 dark:text-slate-300;
}

:deep(h1) {
  @apply text-2xl font-bold mb-2 mt-4 first:mt-0 text-slate-900 dark:text-slate-100;
}

:deep(h2) {
  @apply text-xl font-bold mb-2 mt-3 first:mt-0 text-slate-900 dark:text-slate-100;
}

:deep(h3) {
  @apply text-lg font-semibold mb-2 mt-3 first:mt-0 text-slate-800 dark:text-slate-200;
}

:deep(p) {
  @apply mb-2 last:mb-0;
}

:deep(ul) {
  @apply list-disc pl-5 mb-2;
}

:deep(ol) {
  @apply list-decimal pl-5 mb-2;
}

:deep(li) {
  @apply mb-1;
}

:deep(blockquote) {
  @apply border-l-4 border-primary-300 dark:border-primary-700 pl-4 italic text-slate-600 dark:text-slate-400 my-2;
}

:deep(img) {
  @apply max-w-full rounded-lg my-2;
}

:deep(a) {
  @apply text-primary-600 underline hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300;
}

:deep(strong) {
  @apply font-bold;
}

:deep(em) {
  @apply italic;
}

:deep(u) {
  @apply underline;
}

:deep(s) {
  @apply line-through;
}

:deep(code) {
  @apply bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono;
}

:deep(pre) {
  @apply bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto my-2;
}

:deep(hr) {
  @apply border-slate-200 dark:border-slate-700 my-4;
}

.description-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(148 163 184 / 0.8) transparent;
}

.description-scroll::-webkit-scrollbar {
  width: 6px;
}

.description-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.description-scroll::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: rgb(148 163 184 / 0.7);
}

.dark .description-scroll::-webkit-scrollbar-thumb {
  background: rgb(100 116 139 / 0.8);
}
</style>
