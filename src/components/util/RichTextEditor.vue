<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { Mark } from '@tiptap/core'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { buildEmbedFromUrl, extractUrlsFromHtml } from '@/utils/richTextEmbeds'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Escribe aquí...',
  },
  minHeight: {
    type: String,
    default: '120px',
  },
  maxHeight: {
    type: String,
    default: '300px',
  },
})

const emit = defineEmits(['update:modelValue'])
const currentHtml = ref(props.modelValue || '')
const activePanel = ref('')
const linkUrl = ref('https://')
const imageUrl = ref('https://')
const savedSelection = ref(null)

const COLOR_PAIRS = [
  { id: 'rose', label: 'Rosa', className: 'rt-color-pair-rose', swatchLight: '#e11d48', swatchDark: '#fda4af' },
  { id: 'blue', label: 'Azul', className: 'rt-color-pair-blue', swatchLight: '#2563eb', swatchDark: '#93c5fd' },
  { id: 'emerald', label: 'Esmeralda', className: 'rt-color-pair-emerald', swatchLight: '#059669', swatchDark: '#6ee7b7' },
  { id: 'amber', label: 'Ambar', className: 'rt-color-pair-amber', swatchLight: '#d97706', swatchDark: '#fcd34d' },
  { id: 'violet', label: 'Violeta', className: 'rt-color-pair-violet', swatchLight: '#7c3aed', swatchDark: '#c4b5fd' },
  { id: 'slate', label: 'Slate', className: 'rt-color-pair-slate', swatchLight: '#334155', swatchDark: '#cbd5e1' },
]

const EMOJIS = ['😀', '🔥', '🚀', '🎉', '✅', '⚡', '💡', '📌', '📣', '🎯', '🧠', '🌟', '💬', '📷', '📅', '🎵']

const getColorPairById = (pairId) => COLOR_PAIRS.find((pair) => pair.id === pairId) || null

const ColorPairMark = Mark.create({
  name: 'colorPair',
  priority: 1000,
  addAttributes() {
    return {
      pair: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-color-pair') || null,
        renderHTML: (attributes) => {
          const pair = getColorPairById(attributes?.pair)
          if (!pair) return {}
          return {
            'data-color-pair': pair.id,
            class: pair.className,
          }
        },
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-color-pair]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },
  addCommands() {
    return {
      setColorPair:
        (pair) =>
        ({ chain }) => {
          return chain().setMark(this.name, { pair }).run()
        },
      unsetColorPair:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run()
        },
    }
  },
})

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      // Evita registrar extensiones duplicadas; se configuran explícitamente abajo.
      link: false,
      underline: false,
    }),
    Underline,
    ColorPairMark,
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      HTMLAttributes: {
        class: 'text-primary-600 underline hover:text-primary-700 dark:text-primary-400',
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full rounded-lg my-2',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[var(--editor-min-height)]',
      style: `--editor-min-height: ${props.minHeight}`,
    },
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    currentHtml.value = html
    emit('update:modelValue', html)
  },
})

watch(() => props.modelValue, (newValue) => {
  currentHtml.value = newValue || ''
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, false)
  }
})

const embedPreviewItems = computed(() => {
  const urls = extractUrlsFromHtml(currentHtml.value)
  const previews = urls
    .map((url) => buildEmbedFromUrl(url))
    .filter((item) => item && (item.type === 'image' || item.type === 'youtube'))

  const deduped = new Map()
  previews.forEach((item) => {
    deduped.set(item.key, item)
  })

  return [...deduped.values()].slice(0, 6)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const isActive = (type, attrs = {}) => {
  return editor.value?.isActive(type, attrs) ?? false
}

// Colapsa la selección al final después de aplicar formato
const collapseSelection = () => {
  if (!editor.value) return
  const { to } = editor.value.state.selection
  editor.value.commands.setTextSelection(to)
}

// Aplica formato y colapsa selección
const applyFormat = (command) => {
  if (!editor.value) return
  command()
  collapseSelection()
}

const normalizeUrl = (value) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const togglePanel = (panelName) => {
  if (!activePanel.value && panelName) {
    const selection = editor.value?.state?.selection
    if (selection) {
      savedSelection.value = { from: selection.from, to: selection.to }
    }
  }
  activePanel.value = activePanel.value === panelName ? '' : panelName
}

const closePanels = () => {
  activePanel.value = ''
}

const restoreSavedSelection = () => {
  if (!editor.value || !savedSelection.value) return
  editor.value.chain().focus().setTextSelection(savedSelection.value).run()
}

const openLinkPanel = () => {
  const previousUrl = editor.value?.getAttributes('link')?.href || 'https://'
  linkUrl.value = previousUrl
  togglePanel('link')
}

const applyLink = () => {
  if (!editor.value) return
  restoreSavedSelection()

  const url = normalizeUrl(linkUrl.value)
  if (!url) {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    activePanel.value = ''
    return
  }

  const selection = editor.value.state.selection
  if (selection.empty) {
    // Si no hay selección, insertamos el enlace como texto visible para evitar la sensación de "no hizo nada".
    editor.value.chain().focus().insertContent(`<a href="${url}">${url}</a> `).run()
  } else {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  collapseSelection()
  activePanel.value = ''
}

const removeLink = () => {
  if (!editor.value) return
  editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  collapseSelection()
  activePanel.value = ''
}

const openImagePanel = () => {
  imageUrl.value = 'https://'
  togglePanel('image')
}

const applyImage = () => {
  if (!editor.value) return
  const url = normalizeUrl(imageUrl.value)
  if (!url) return

  editor.value.chain().focus().setImage({ src: url }).run()
  collapseSelection()
  activePanel.value = ''
}

const setColorPair = (pairId) => {
  if (!editor.value) return
  restoreSavedSelection()
  editor.value.chain().focus().setColorPair(pairId).run()
  collapseSelection()
}

const clearColorPair = () => {
  if (!editor.value) return
  restoreSavedSelection()
  editor.value.chain().focus().unsetColorPair().run()
  collapseSelection()
}

const insertEmoji = (emoji) => {
  if (!editor.value) return
  editor.value.chain().focus().insertContent(emoji).run()
  collapseSelection()
}
</script>

<template>
  <div class="rich-text-editor w-full rounded-xl border border-slate-300 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-950">
    <!-- Toolbar -->
    <div v-if="editor" class="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-900" @mousedown.prevent>
      <!-- Text formatting -->
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('bold') }]"
        title="Negrita"
        @click="applyFormat(() => editor.chain().focus().toggleBold().run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
      </button>
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('italic') }]"
        title="Cursiva"
        @click="applyFormat(() => editor.chain().focus().toggleItalic().run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4h4m-2 0l-4 16m0 0h4"/></svg>
      </button>
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('underline') }]"
        title="Subrayado"
        @click="applyFormat(() => editor.chain().focus().toggleUnderline().run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v7a5 5 0 0010 0V4M5 20h14"/></svg>
      </button>
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('strike') }]"
        title="Tachado"
        @click="applyFormat(() => editor.chain().focus().toggleStrike().run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 12H7m5-8v4m0 12v-4"/></svg>
      </button>

      <span class="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600"></span>

      <!-- Headings -->
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('heading', { level: 1 }) }]"
        title="Titulo 1"
        @click="applyFormat(() => editor.chain().focus().toggleHeading({ level: 1 }).run())"
      >
        <span class="text-xs font-bold">H1</span>
      </button>
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('heading', { level: 2 }) }]"
        title="Titulo 2"
        @click="applyFormat(() => editor.chain().focus().toggleHeading({ level: 2 }).run())"
      >
        <span class="text-xs font-bold">H2</span>
      </button>
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('heading', { level: 3 }) }]"
        title="Titulo 3"
        @click="applyFormat(() => editor.chain().focus().toggleHeading({ level: 3 }).run())"
      >
        <span class="text-xs font-bold">H3</span>
      </button>

      <span class="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600"></span>

      <!-- Lists -->
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('bulletList') }]"
        title="Lista con viñetas"
        @click="applyFormat(() => editor.chain().focus().toggleBulletList().run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/><circle cx="2" cy="6" r="1" fill="currentColor"/><circle cx="2" cy="12" r="1" fill="currentColor"/><circle cx="2" cy="18" r="1" fill="currentColor"/></svg>
      </button>
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('orderedList') }]"
        title="Lista numerada"
        @click="applyFormat(() => editor.chain().focus().toggleOrderedList().run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13"/><text x="2" y="8" font-size="8" fill="currentColor">1</text><text x="2" y="14" font-size="8" fill="currentColor">2</text><text x="2" y="20" font-size="8" fill="currentColor">3</text></svg>
      </button>
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('blockquote') }]"
        title="Cita"
        @click="applyFormat(() => editor.chain().focus().toggleBlockquote().run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      </button>

      <span class="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600"></span>

      <!-- Link & Image -->
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive('link') }]"
        title="Enlace"
        @click="openLinkPanel"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      </button>
      <button
        type="button"
        class="toolbar-btn"
        title="Imagen"
        @click="openImagePanel"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </button>

      <span class="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600"></span>

      <button
        type="button"
        :class="['toolbar-btn', { active: activePanel === 'colors' }]"
        title="Color de texto"
        @click="togglePanel('colors')"
      >
        <span class="material-symbols-outlined text-[18px]">format_color_text</span>
      </button>

      <button
        type="button"
        :class="['toolbar-btn', { active: activePanel === 'emoji' }]"
        title="Insertar emoji"
        @click="togglePanel('emoji')"
      >
        <span class="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
      </button>

      <span class="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600"></span>

      <!-- Alignment -->
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive({ textAlign: 'left' }) }]"
        title="Alinear izquierda"
        @click="applyFormat(() => editor.chain().focus().setTextAlign('left').run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h14"/></svg>
      </button>
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive({ textAlign: 'center' }) }]"
        title="Centrar"
        @click="applyFormat(() => editor.chain().focus().setTextAlign('center').run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M5 18h14"/></svg>
      </button>
      <button
        type="button"
        :class="['toolbar-btn', { active: isActive({ textAlign: 'right' }) }]"
        title="Alinear derecha"
        @click="applyFormat(() => editor.chain().focus().setTextAlign('right').run())"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M6 18h14"/></svg>
      </button>
    </div>

    <div v-if="activePanel" class="border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
      <div v-if="activePanel === 'link'" class="flex flex-wrap items-center gap-2">
        <input
          v-model="linkUrl"
          type="url"
          class="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900"
          placeholder="https://ejemplo.com"
        />
        <button type="button" class="rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700" @click="applyLink">Aplicar</button>
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" @click="removeLink">Quitar</button>
      </div>

      <div v-else-if="activePanel === 'image'" class="flex flex-wrap items-center gap-2">
        <input
          v-model="imageUrl"
          type="url"
          class="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900"
          placeholder="https://cdn.site.com/imagen.png"
        />
        <button type="button" class="rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700" @click="applyImage">Insertar</button>
      </div>

      <div v-else-if="activePanel === 'colors'" class="flex flex-wrap items-center gap-2">
        <button
          v-for="pair in COLOR_PAIRS"
          :key="pair.id"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          :class="{ 'ring-2 ring-primary-500/40': isActive('colorPair', { pair: pair.id }) }"
          @click="setColorPair(pair.id)"
        >
          <span class="inline-flex items-center gap-1">
            <span class="h-3 w-3 rounded-full border border-white/40" :style="{ backgroundColor: pair.swatchLight }"></span>
            <span class="h-3 w-3 rounded-full border border-white/40" :style="{ backgroundColor: pair.swatchDark }"></span>
          </span>
          {{ pair.label }}
        </button>
        <button type="button" class="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" @click="clearColorPair">Quitar color</button>
      </div>

      <div v-else-if="activePanel === 'emoji'" class="grid grid-cols-8 gap-1 sm:grid-cols-10">
        <button
          v-for="emoji in EMOJIS"
          :key="emoji"
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          @click="insertEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="editor-content-wrapper" :style="{ maxHeight: props.maxHeight }" @mousedown="closePanels">
      <div class="px-4 py-3">
        <EditorContent :editor="editor" />
      </div>
    </div>

    <div v-if="embedPreviewItems.length" class="border-t border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
      <p class="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Vista previa multimedia</p>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <template v-for="item in embedPreviewItems" :key="item.key">
          <div v-if="item.type === 'image'" class="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <img :src="item.src" alt="Preview" class="h-32 w-full object-cover" loading="lazy" />
          </div>
          <a
            v-else
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group relative overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
          >
            <img :src="item.thumbnailUrl" alt="Preview YouTube" class="h-32 w-full object-cover" loading="lazy" />
            <span class="absolute inset-0 flex items-center justify-center bg-slate-950/30 text-white">
              <span class="material-symbols-outlined rounded-full bg-slate-950/70 p-2 transition group-hover:scale-105">play_arrow</span>
            </span>
          </a>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style.css";

.editor-content-wrapper {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgb(148 163 184 / 0.8) transparent;
}

.editor-content-wrapper::-webkit-scrollbar {
  width: 6px;
}

.editor-content-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.editor-content-wrapper::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: rgb(148 163 184 / 0.7);
}

.dark .editor-content-wrapper::-webkit-scrollbar-thumb {
  background: rgb(100 116 139 / 0.8);
}

.toolbar-btn {
  @apply flex h-7 w-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700;
}

.toolbar-btn.active {
  @apply bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300;
}

:deep(.tiptap) {
  @apply text-sm text-slate-800 dark:text-slate-200;
}

:deep(.tiptap p.is-editor-empty:first-child::before) {
  @apply text-slate-400;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.tiptap p.is-editor-empty:first-child):where(.dark, .dark *)::before {
  @apply text-slate-700;
}

:deep(.tiptap h1) {
  @apply text-2xl font-bold mb-2 mt-4 first:mt-0;
}

:deep(.tiptap h2) {
  @apply text-xl font-bold mb-2 mt-3 first:mt-0;
}

:deep(.tiptap h3) {
  @apply text-lg font-semibold mb-2 mt-3 first:mt-0;
}

:deep(.tiptap p) {
  @apply mb-2 last:mb-0;
}

:deep(.tiptap ul) {
  @apply list-disc pl-5 mb-2;
}

:deep(.tiptap ol) {
  @apply list-decimal pl-5 mb-2;
}

:deep(.tiptap li) {
  @apply mb-1;
}

:deep(.tiptap blockquote) {
  @apply border-l-4 border-primary-300 dark:border-primary-700 pl-4 italic text-slate-600 dark:text-slate-400 my-2;
}

:deep(.tiptap img) {
  @apply max-w-full rounded-lg my-2;
}

:deep(.tiptap a) {
  @apply text-primary-600 underline hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300;
}

:deep(.tiptap .rt-color-pair-rose) {
  @apply text-rose-600 dark:text-rose-300;
}

:deep(.tiptap .rt-color-pair-blue) {
  @apply text-blue-600 dark:text-blue-300;
}

:deep(.tiptap .rt-color-pair-emerald) {
  @apply text-emerald-600 dark:text-emerald-300;
}

:deep(.tiptap .rt-color-pair-amber) {
  @apply text-amber-600 dark:text-amber-300;
}

:deep(.tiptap .rt-color-pair-violet) {
  @apply text-violet-600 dark:text-violet-300;
}

:deep(.tiptap .rt-color-pair-slate) {
  @apply text-slate-700 dark:text-slate-200;
}
</style>
