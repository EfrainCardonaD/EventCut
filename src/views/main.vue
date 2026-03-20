<script setup>
import { ref, reactive } from 'vue'

import AppHeader from '../components/AppHeader.vue'
import EventCalendar from '../components/EventCalendar.vue'
import CategoryFilters from '../components/CategoryFilters.vue'
import EventList from '../components/EventList.vue'

// Navegación interna (tabs). Si después quieres mejores prácticas de routing,
// esto puede convertirse en rutas / y /eventos.
const currentView = ref('eventos')

// Mock de datos: Categorías (Mapeo reactivo de filtros)
const categorias = reactive([
  { id: 'all', nombre: 'Todos', selected: true },
  { id: 'ing', nombre: 'Ingeniería', selected: false },
  { id: 'lic', nombre: 'Licenciatura', selected: false },
  { id: 'cine', nombre: 'CineCUT', selected: false },
  { id: 'tal', nombre: 'Talleres', selected: false },
  { id: 'conf', nombre: 'Conferencias', selected: false },
])

// Lógica de Calendario Dinámico (Marzo 2026)
const generarCalendario = () => {
  const dias = []
  // Padding previo: Febrero 2026 termina en sábado 28
  const paddingPrevio = [23, 24, 25, 26, 27, 28]
  paddingPrevio.forEach((n) => dias.push({ numero: n, isCurrentMonth: false, hasEvent: false }))

  // Días del mes actual
  const eventosFechas = [13, 15, 20, 25, 28]
  for (let i = 1; i <= 31; i++) {
    dias.push({
      numero: i,
      isCurrentMonth: true,
      hasEvent: eventosFechas.includes(i),
      isSelected: i === 20,
      isToday: i === 20,
    })
  }

  // Padding posterior: Completar la matriz de 42 celdas
  const paddingPosterior = [1, 2, 3, 4, 5]
  paddingPosterior.forEach((n) => dias.push({ numero: n, isCurrentMonth: false, hasEvent: false }))

  return dias
}

const diasCalendario = ref(generarCalendario())

const seleccionarDia = (dia) => {
  if (!dia?.isCurrentMonth) return
  diasCalendario.value.forEach((d) => (d.isSelected = false))
  dia.isSelected = true
}

// Base centralizada de eventos
const eventosDestacados = ref([
  {
    id: 1,
    dia: '20',
    mes: 'marzo',
    categoria: 'CineCUT',
    titulo: 'Cineteca CUT: Proyección Especial "Blade Runner 2049"',
    requiereAprobacion: false,
    horario: 'Viernes 16:00 - 18:30',
    ubicacion: 'Auditorio Principal',
    descripcion:
      'Apertura del ciclo "Futuros Distópicos y Tecnología". Incluye un conversatorio posterior sobre la ética en la inteligencia artificial moderado por académicos de la división de ingenierías.',
    asistentes: '120/150',
    imagen: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
  },
])

const eventosProximos = ref([
  {
    id: 2,
    dia: '25',
    mes: 'marzo',
    categoria: 'Conferencias',
    titulo: 'Seminario de Investigación: Energías Limpias',
    requiereAprobacion: true,
    horario: 'Miércoles 11:00 - 13:00',
    ubicacion: 'Aula Magna 3',
    descripcion:
      'Panel de discusión con expertos invitados sobre la viabilidad de la transición energética en el occidente de México. Dirigido a estudiantes de posgrado y licenciatura de últimos semestres.',
    asistentes: '45/80',
    imagen: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 3,
    dia: '28',
    mes: 'marzo',
    categoria: 'Talleres',
    titulo: 'Taller Intensivo de Vibe Coding y Prototipado Rápido',
    requiereAprobacion: true,
    horario: 'Sábado 09:00 - 14:00',
    ubicacion: 'Laboratorio de Cómputo B',
    descripcion:
      'Sesión intensiva enfocada en vibe coding: construir, experimentar y prototipar sin fricción. Los participantes desarrollarán un MVP usando IA generativa y frameworks modernos.',
    asistentes: '28/30',
    imagen: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
  },
])

const onNavigate = (view) => {
  currentView.value = view
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader :current="currentView" @navigate="onNavigate" />

    <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

      <!-- VISTA: INICIO (Perfil Institucional) -->
      <div v-if="currentView === 'inicio'">
        <!-- Banner -->
        <div class="h-48 md:h-64 w-full rounded-3xl overflow-hidden relative bg-gray-100 shadow-sm border border-gray-200">
          <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="Banner CUTonalá" class="w-full h-full object-cover">
        </div>

        <!-- Info del Perfil -->
        <div class="relative px-4 sm:px-8 -mt-12 flex justify-between items-end">
          <div class="flex items-end gap-6">
            <!-- Avatar Institucional -->
            <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-surface bg-white shadow-sm flex items-center justify-center overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=CUT&background=ffffff&color=0FA0E3&size=128&bold=true" alt="Logo CUTonalá" class="w-full h-full object-contain p-2">
            </div>
          </div>
          <button @click="currentView = 'eventos'" class="bg-brand text-white px-5 py-2 rounded-full text-sm font-medium mb-2 shadow-sm hover:bg-brand-hover transition-colors">
            Ver eventos
          </button>
        </div>

        <div class="mt-6 px-4 sm:px-8 max-w-3xl">
          <h1 class="text-3xl font-bold text-gray-900">Centro Universitario de Tonalá <span class="text-gray-400 font-normal">CUT</span></h1>
          <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            Tonalá, Jalisco
                        </span>
            <a href="#" class="flex items-center gap-1 text-brand hover:underline">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              cutonala.udg.mx y 4 más
            </a>
          </div>

          <div class="mt-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">Acerca de</h2>
            <div class="prose prose-sm text-gray-600 space-y-4">
              <p>El Centro Universitario de Tonalá es parte de la Red Universitaria de la Universidad de Guadalajara.</p>
              <p>Ofrecen programas académicos en áreas de ciencias de la salud, ingenierías, ciencias sociales y humanidades.</p>
              <p>En CUTonalá:</p>
              <ul class="list-disc pl-5 space-y-1">
                <li>Forman profesionales comprometidos con el desarrollo de la región.</li>
                <li>Impulsan la investigación aplicada y la innovación tecnológica.</li>
                <li>Promueven la cultura y el deporte a través de eventos y actividades.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- VISTA: EVENTOS (Cartelera Centralizada) -->
      <div v-if="currentView === 'eventos'" class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- Columna Izquierda: Lista de Eventos -->
        <div class="lg:col-span-2 space-y-8">
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight mb-6">Eventos</h1>

          <!-- Sección Destacados -->
          <EventList title="Destacados" :events="eventosDestacados" />

          <!-- Sección Próximos -->
          <div class="mt-10">
            <EventList title="Próximos" :events="eventosProximos" />
          </div>
        </div>

        <!-- Columna Derecha: Sidebar (Calendario y Filtros) -->
        <aside class="space-y-8">
          <EventCalendar title="March 2026" :days="diasCalendario" @select-day="seleccionarDia" />
          <CategoryFilters v-model="categorias" />
        </aside>
      </div>
    </main>
  </div>
</template>
