import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LandingPageLayout from '@/layouts/LandingPageLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'

import LandingView from '@/views/LandingView.vue'
import DashBoardUniversal from '@/views/DashBoardUniversal.vue'
import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import NotFound from '@/components/error/NotFound.vue'

const routes = [
  {
    path: '/',
    component: LandingPageLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'Home',
        component: LandingView,
      },
    ],
  },
  {
    path: '/app',
    component: MainLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'App',
        component: DashBoardUniversal,
      },
    ],
  },
  {
    path: '/auth',
    component: AuthLayout,
    meta: { guest: true },
    children: [
      {
        path: 'login',
        name: 'Login',
        component: Login,
        alias: ['/login'],
      },
      {
        path: 'register',
        name: 'Register',
        component: Register,
        alias: ['/register'],
      },
      {
        path: 'forgot',
        name: 'ForgotPassword',
        component: ForgotPassword,
        alias: ['/forgot'],
      },
    ],
  },
  {
    path: '/login',
    redirect: '/auth/login',
  },
  {
    path: '/register',
    redirect: '/auth/register',
  },
  {
    path: '/forgot',
    redirect: '/auth/forgot',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard de navegación global
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isGuest = to.matched.some((record) => record.meta.guest)
  const requiredRole = to.meta.role

  // 1. Proteger rutas privadas
  if (requiresAuth && !isAuthenticated) {
    return next('/auth/login')
  }

  // 2. Redirigir usuarios logueados que intentan acceder al login/registro
  if (isGuest && isAuthenticated) {
    return next('/')
  }

  // 3. Validación de Roles (si se usa RBAC en el futuro)
  if (requiredRole && authStore.role !== requiredRole) {
    return next('/')
  }

  next()
})

export default router
