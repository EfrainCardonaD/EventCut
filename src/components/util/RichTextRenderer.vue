<script setup>
import { computed } from 'vue'
import { buildEmbedFromUrl, extractUrlsFromText } from '@/utils/richTextEmbeds'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  hideUrlsAndMedia: {
    type: Boolean,
    default: false,
  },
  enableEmbeds: {
    type: Boolean,
    default: true,
  },
  lineClamp: {
    type: [Number, String],
    default: null,
  },
  maxHeight: {
    type: String,
    default: null,
  },
  variant: {
    type: String,
    default: 'default',
  },
})

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

const toEscapedText = (text) => {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const URL_TEXT_PATTERN = /https?:\/\/[^\s<>"']+/gi

const stripUrlsFromText = (text) => {
  return String(text || '').replace(URL_TEXT_PATTERN, '').replace(/\s{2,}/g, ' ').trim()
}

const stripUrlsAndMediaFromHtml = (html) => {
  if (!html || typeof document === 'undefined') return html

  const container = document.createElement('div')
  container.innerHTML = html

  container.querySelectorAll('img, video, audio, source, picture, iframe').forEach((node) => {
    node.remove()
  })

  container.querySelectorAll('a[href]').forEach((anchor) => {
    const label = stripUrlsFromText(anchor.textContent || '')
    if (!label) {
      anchor.remove()
      return
    }

    anchor.replaceWith(document.createTextNode(label))
  })

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const textNodes = []
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode)
  }

  textNodes.forEach((textNode) => {
    const cleaned = stripUrlsFromText(textNode.nodeValue || '')
    textNode.nodeValue = cleaned
  })

  return container.innerHTML
}

const linkifyText = (text) => {
  const urls = extractUrlsFromText(text)
  if (!urls.length) return toEscapedText(text)

  let output = toEscapedText(text)
  urls.forEach((url) => {
    const escaped = toEscapedText(url)
    output = output.replaceAll(escaped, `<a href="${escaped}">${escaped}</a>`)
  })

  return output
}

const createEmbedNode = (embed) => {
  if (!embed || typeof document === 'undefined') return null

  if (embed.type === 'image') {
    const wrapper = document.createElement('figure')
    wrapper.className = 'rt-embed rt-embed-image'

    const img = document.createElement('img')
    img.src = embed.src
    img.alt = 'Imagen compartida'
    img.loading = 'lazy'
    img.className = 'max-w-full rounded-lg my-2'
    wrapper.appendChild(img)
    return wrapper
  }

  if (embed.type === 'youtube') {
    const wrapper = document.createElement('figure')
    wrapper.className = 'rt-embed rt-embed-video'

    const iframe = document.createElement('iframe')
    iframe.src = embed.embedUrl
    iframe.title = 'Video de YouTube'
    iframe.loading = 'lazy'
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    iframe.allowFullscreen = true
    iframe.referrerPolicy = 'strict-origin-when-cross-origin'
    iframe.className = 'w-full aspect-video rounded-lg border border-slate-200 dark:border-slate-700'

    wrapper.appendChild(iframe)
    return wrapper
  }

  return null
}

const enrichEmbeds = (html) => {
  if (!html || typeof document === 'undefined') return html

  const container = document.createElement('div')
  container.innerHTML = html

  container.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || ''
    const embed = buildEmbedFromUrl(href)
    const node = createEmbedNode(embed)
    if (!node) return

    const shouldReplace = !link.textContent || String(link.textContent).trim() === href
    if (!shouldReplace) return

    link.replaceWith(node)
  })

  return container.innerHTML
}

const processedContent = computed(() => {
  if (!props.content) return ''
  
  let html = props.content
  
  // If it's plain text, wrap in paragraph and convert image URLs
  if (isPlainText(html)) {
    html = html.split('\n').filter(Boolean).map(line => {
      const processed = props.hideUrlsAndMedia
        ? toEscapedText(stripUrlsFromText(line))
        : linkifyText(line)
      return `<p>${processed}</p>`
    }).join('')
  } else {
    html = sanitizeHtml(html)
    if (props.hideUrlsAndMedia) {
      html = stripUrlsAndMediaFromHtml(html)
    }
  }

  if (props.hideUrlsAndMedia) return html

  if (!props.enableEmbeds) return html

  return enrichEmbeds(html)
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

const variantClass = computed(() => {
  if (props.variant === 'featured-overlay') return 'rt-variant-featured-overlay'
  return ''
})
</script>

<template>
  <div
    class="rich-text-renderer prose prose-sm dark:prose-invert max-w-none"
    :class="[lineClampClass, variantClass, { 'description-scroll': maxHeight }]"
    :style="containerStyle"
    v-html="processedContent"
  ></div>
</template>

<style scoped>
@reference "@/style.css";

.rich-text-renderer {
  @apply text-sm text-slate-700 dark:text-slate-300;
}

.rich-text-renderer.rt-variant-featured-overlay {
  @apply text-slate-200;
}

.rich-text-renderer.rt-variant-featured-overlay :deep(h1),
.rich-text-renderer.rt-variant-featured-overlay :deep(h2),
.rich-text-renderer.rt-variant-featured-overlay :deep(h3) {
  @apply text-white;
}

.rich-text-renderer.rt-variant-featured-overlay :deep(a) {
  @apply text-primary-100 hover:text-white;
}

.rich-text-renderer.rt-variant-featured-overlay :deep(blockquote) {
  @apply border-primary-200 text-slate-200;
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

:deep(.rt-color-pair-rose) {
  @apply text-rose-600 dark:text-rose-300;
}

:deep(.rt-color-pair-blue) {
  @apply text-blue-600 dark:text-blue-300;
}

:deep(.rt-color-pair-emerald) {
  @apply text-emerald-600 dark:text-emerald-300;
}

:deep(.rt-color-pair-amber) {
  @apply text-amber-600 dark:text-amber-300;
}

:deep(.rt-color-pair-violet) {
  @apply text-violet-600 dark:text-violet-300;
}

:deep(.rt-color-pair-slate) {
  @apply text-slate-700 dark:text-slate-200;
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

.description-scroll:where(.dark, .dark *)::-webkit-scrollbar-thumb {
  background: rgb(100 116 139 / 0.8);
}
</style>
