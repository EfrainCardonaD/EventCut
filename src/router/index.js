import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/event'

const LandingPageLayout = () => import('@/layouts/LandingPageLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')
const MainLayout = () => import('@/layouts/MainLayout.vue')
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

const LandingView = () => import('@/views/LandingView.vue')
const DashBoardUniversal = () => import('@/views/DashBoardUniversal.vue')
const CalendarView = () => import('@/views/CalendarView.vue')
const CommunitiesIndex = () => import('@/views/communities/CommunitiesIndex.vue')
const CommunityDetailView = () => import('@/views/communities/CommunityDetailView.vue')
const AdminDashboardView = () => import('@/views/admin/AdminDashboardView.vue')
const UsersDirectoryView = () => import('@/views/admin/UsersDirectoryView.vue')
const BansRegistryView = () => import('@/views/admin/BansRegistryView.vue')
const CommunitiesModerationView = () => import('@/views/admin/CommunitiesModerationView.vue')
const EventsAuditView = () => import('@/views/admin/EventsAuditView.vue')
const CategoriesCatalogView = () => import('@/views/admin/CategoriesCatalogView.vue')
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const ResetPassword = () => import('@/views/auth/ResetPassword.vue')
const ResendVerification = () => import('@/views/auth/ResendVerification.vue')
const VerifyEmail = () => import('@/views/auth/VerifyEmail.vue')
const NotFound = () => import('@/components/error/NotFound.vue')

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
    meta: { requiresAuth: false
    },
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
    ],
  },
  {
    path: '/app/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['ADMIN', 'SECURITY_ADMIN'] },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboardView,
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: UsersDirectoryView,
      },
      {
        path: 'bans',
        name: 'AdminBans',
        component: BansRegistryView,
      },
      {
        path: 'communities',
        name: 'AdminCommunities',
        component: CommunitiesModerationView,
      },
      {
        path: 'events',
        name: 'AdminEvents',
        component: EventsAuditView,
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: CategoriesCatalogView,
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

  // Mantiene el cache de favoritos scopeado por usuario.
  const eventStore = useEventStore()
  const scopeKey = authStore.user?.id || authStore.user?.email || authStore.user?.username || 'anon'
  eventStore.setFavoritesUserScope(scopeKey)

  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isGuest = to.matched.some((record) => record.meta.guest)
  
  // Collect roles from all matched routes (parent + child)
  const requiredRoles = to.matched.reduce((roles, record) => {
    if (record.meta.roles) {
      return [...roles, ...record.meta.roles]
    }
    if (record.meta.role) {
      return [...roles, record.meta.role]
    }
    return roles
  }, [])

  if (requiresAuth && !isAuthenticated) {
    return next({ path: '/auth/login', query: { redirect: to.fullPath } })
  }

  if (isGuest && isAuthenticated) {
    return next('/app')
  }

  if (requiredRoles.length > 0 && !authStore.hasAnyRole(requiredRoles)) {
    return next('/app')
  }

  if(to.path === '/' && isAuthenticated) {
    return next('/app')
  }

  next()
})

// Revalidación “live-ish” multi-dispositivo: al volver a foco o salir del background.
// No usa websockets; hace un refresh throttled (ver minIntervalMs en el store).
if (typeof window !== 'undefined') {
  const refresh = async () => {
    try {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return
      const eventStore = useEventStore()
      await eventStore.refreshFavoritesFromServer({ minIntervalMs: 15_000 })
    } catch {
      // noop
    }
  }

  window.addEventListener('focus', refresh)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh()
  })
}

export default router
