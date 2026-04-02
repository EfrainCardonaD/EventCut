<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'

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

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
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
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, false)
  }
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

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  const url = window.prompt('URL del enlace:', previousUrl || 'https://')
  if (url === null) return
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
  collapseSelection()
}

const addImage = () => {
  const url = window.prompt('URL de la imagen:', 'https://')
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run()
    collapseSelection()
  }
}
</script>

<template>
  <div class="rich-text-editor w-full rounded-xl border border-slate-300 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-950">
    <!-- Toolbar -->
    <div v-if="editor" class="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-900">
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
        @click="setLink"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      </button>
      <button
        type="button"
        class="toolbar-btn"
        title="Imagen"
        @click="addImage"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
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

    <!-- Editor Content -->
    <div class="editor-content-wrapper" :style="{ maxHeight: props.maxHeight }">
      <div class="px-4 py-3">
        <EditorContent :editor="editor" />
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
  @apply text-slate-400 dark:text-slate-500;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
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
</style>
