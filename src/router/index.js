import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LandingPageLayout from '@/layouts/LandingPageLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'

import LandingView from '@/views/LandingView.vue'
import DashBoardUniversal from '@/views/DashBoardUniversal.vue'
import CalendarView from '@/views/CalendarView.vue'
import CommunitiesIndex from '@/views/communities/CommunitiesIndex.vue'
import CommunityDetailView from '@/views/communities/CommunityDetailView.vue'
import AdminPanelView from '@/views/admin/AdminPanelView.vue'
import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import ResendVerification from '@/views/auth/ResendVerification.vue'
import VerifyEmail from '@/views/auth/VerifyEmail.vue'
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
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'AppHome',
        component: DashBoardUniversal,
      },
      {
        path: 'calendario',
        name: 'CalendarView',
        component: CalendarView,
      },
      {
        path: 'comunidades',
        name: 'CommunitiesIndex',
        component: CommunitiesIndex,
      },
      {
        path: 'comunidades/:communityId',
        name: 'CommunityDetail',
        component: CommunityDetailView,
      },
      {
        path: 'admin',
        name: 'AdminPanel',
        component: AdminPanelView,
        meta: { roles: ['ADMIN', 'SECURITY_ADMIN'] },
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
        alias: ['/login', '/iniciar-sesion'],
      },
      {
        path: 'register',
        name: 'Register',
        component: Register,
        alias: ['/register', '/registro'],
      },
      {
        path: 'forgot',
        name: 'ForgotPassword',
        component: ForgotPassword,
        alias: ['/forgot', '/recuperar-contrasena', '/recuperar-contraseña', '/recueprar-contraseña'],
      },
      {
        path: 'reset',
        name: 'ResetPassword',
        component: ResetPassword,
        alias: ['/reset-password'],
      },
      {
        path: 'verify/resend',
        name: 'ResendVerification',
        component: ResendVerification,
        alias: ['/verify/resend', '/verificacion', '/verificascion'],
      },
      {
        path: 'verify/email',
        name: 'VerifyEmail',
        component: VerifyEmail,
        alias: ['/verify/email'],
      },
      {
        path: 'verify/email/:token',
        name: 'VerifyEmailToken',
        component: VerifyEmail,
        props: true,
        alias: ['/verify/email/:token'],
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
    path: '/reset-password',
    redirect: '/auth/reset',
  },
  {
    path: '/verify/resend',
    redirect: '/auth/verify/resend',
  },
  {
    path: '/verify/email',
    redirect: '/auth/verify/email',
  },
  {
    path: '/verify/email/:token',
    redirect: (to) => `/auth/verify/email/${to.params.token}`,
  },
  {
    path: '/verify-email',
    redirect: (to) => ({ path: '/auth/verify/email', query: to.query }),
  },
  {
    path: '/dashboard',
    redirect: '/app',
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
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (!authStore.hasBootstrapped) {
    await authStore.bootstrapSession()
  }

  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isGuest = to.matched.some((record) => record.meta.guest)
  const requiredRoles = to.meta.roles || (to.meta.role ? [to.meta.role] : [])

  if (requiresAuth && !isAuthenticated) {
    return next({ path: '/auth/login', query: { redirect: to.fullPath } })
  }

  if (isGuest && isAuthenticated) {
    return next('/app')
  }

  if (requiredRoles.length > 0 && !authStore.hasAnyRole(requiredRoles)) {
    return next('/app')
  }

  next()
})

export default router
