## Plan: Integración Comunidades + Admin Panel v2

Integrar el módulo de comunidades y el panel admin en el frontend (Vite + Vue + Pinia) alineado al contrato API v2.0: cualquiera autenticado crea comunidad (queda `PENDING`), admins aprueban/rechazan; nuevas rutas `/app/comunidades` (listado minimalista) y `/app/comunidades/:communityId` (detalle inspirado en `referencia.html` pero con el diseño actual tipo `DashBoardUniversal.vue`); ruta `/app/admin` completa (moderación + baneos). Añadir UI reusables para acciones admin, mostrar `social_links` y `community_id` solo en contexto de comunidad (vistas y popup), y “chip ADMIN” para usuarios con rol admin.

### Steps 1) Definir rutas, guards y navegación
1. Agregar rutas hijas en `src/router/index.js`: `/app/comunidades`, `/app/comunidades/:communityId`, `/app/admin`.
2. Usar `meta.roles: ['ADMIN','SECURITY_ADMIN']` en `/app/admin` (ya existe guard global `hasAnyRole`).
3. Ajustar navegación UI (navbar/header del layout actual) para incluir “Comunidades” y “Admin” (solo visible si rol admin).

### Steps 2) Crear capa API de comunidades y admin (contrato v2.0)
1. Crear `communitiesApi` / `adminApi` en `src/utils/` reutilizando `createApiClient` y patrones de `eventsApi`.
2. Implementar funciones para endpoints de comunidades (de `src/docs/integration/pendiente/FRONTEND_COMMUNITIES_INTEGRATION.md`):
   - `listActive`, `getDetail`, `listMy`, `create`, `update`, `delete`, `getCommunityEvents`, `requestEventJoin`, `listRequests`, `patchRequest`.
3. Implementar endpoints admin (de `src/docs/integration/pendiente/ADMIN_PANEL_INTEGRATION.md`):
   - `listCommunities(status,limit,offset)`, `patchCommunityStatus`, `banUser`, `unbanUser`, `listBannedUsers`, `getBanStatus`.
4. Estandarizar manejo de error `ApiResponse` y `data.code/details/trace_id` usando helpers existentes de `src/utils/apiFactory.js` (mapeo `code`→UX).

### Steps 3) Añadir stores Pinia para comunidades y admin
1. Crear `useCommunityStore` en `src/stores/` con estado:
   - `activeList`, `myList`, `detail`, `events`, `requests`, `isLoading*`, `error`, paginación `limit/offset/total`.
2. Crear `useAdminStore` en `src/stores/` con estado:
   - `pendingCommunities`, `activeCommunities`, `rejectedCommunities`, `bannedUsers`, `isLoading`, `error`, paginación, acciones `approve/reject`, `ban/unban`.
3. Seguir patrones de `useEventStore` (flags `isLoading...`, normalización, `toStoreErrorResult`, `uxAction` tipo `SHOW_FIELD_ERRORS` cuando `422`).
4. Asegurar que flujos con `USER_BANNED` (403) produzcan UX clara (bloqueo de mutaciones y mensaje consistente).

### Steps 4) Implementar vistas de Comunidades (listado + detalle)
1. Crear `src/views/communities/CommunitiesIndex.vue` para `/app/comunidades`: UI “SOLO dropdown + eventos”.
2. En `/app/comunidades` cargar `GET /v1/communities`; dropdown selecciona comunidad y muestra sus eventos (via `GET /v1/communities/:id/events`).
3. Crear `src/views/communities/CommunityDetailView.vue` para `/app/comunidades/:communityId` inspirado en `referencia.html`, pero usando clases/estructura visual de `src/views/DashBoardUniversal.vue` (header sticky, secciones, cards).
4. En detalle: mostrar hero (imagen/banner), nombre, descripción, owner display, contador eventos, y `social_links` (solo aquí).
5. Listar eventos del schedule de comunidad (solo `APPROVED` según doc) y habilitar abrir el popup/modal existente de evento.

### Steps 5) Ajustar eventos para soporte `community_id` y `social_links` solo en contexto comunidad
1. Confirmar que `EventCreate` ya soporta `social_links` y `community_id` (según `src/docs/integration/pendiente/CHANGELOG_v2.0.md` y `src/docs/integration/pendiente/FRONTEND_UPDATE_GUIDE_v2.md`).
2. Modificar `CreateEventModal` para permitir `community_id` solo cuando la vista actual sea comunidad (p.ej. prop `communityContextId`).
3. Modificar `EventCard` y `EventCardModal` para renderizar `social_links`/community badges solo si `communityContextId` existe (o si la data proviene del endpoint de comunidad).
4. En popup (modal) incluir sección “Comunidad” y links sociales únicamente cuando se está viendo desde `/app/comunidades/:id` o `/app/comunidades`.

### Steps 6) Implementar Panel Admin completo: moderación + baneos + UI reusables
1. Crear `src/views/admin/AdminPanelView.vue` para `/app/admin` con tabs/secciones: “Moderación comunidades” y “Baneos”.
2. Moderación: tabla/cards de comunidades `PENDING` con acciones `ACTIVATE` y `REJECT` (con motivo obligatorio).
3. Baneos: listado paginado de baneados + acción desbanear; formulario/modal banear por `user_id` y `reason` (5–500).
4. Crear componentes reusables para acciones admin en `src/components/admin/`: card/list row, modal de rechazo, modal ban/unban, confirmaciones (reusando `src/components/util/ConfirmModal.vue`).
5. Incluir “chip ADMIN” visible en UI global (header/aside) cuando `authStore.hasAnyRole(['ADMIN','SECURITY_ADMIN'])` sea true.

### Further Considerations 1. ¿Dónde mostrar “Crear comunidad”?
1. Opción A: botón en `/app/comunidades` (solo usuarios autenticados) abre modal “Crear comunidad”.
2. Opción B: botón global en sidebar/header (pero solo visible en rutas de comunidades).
3. Opción C: vista extra “Mis comunidades” (`/app/comunidades/mis`) si quieren owner management (no pedido, pero útil).

2. Reglas de error/validación a reflejar explícitamente
1. `TERMS_NOT_ACCEPTED` (400): bloquear submit y explicar aceptación de términos.
2. `DUPLICATE_COMMUNITY_NAME` (409): marcar campo `name` con error.
3. `VALIDATION_ERROR` (422): mapear `details` a `FieldError` estilo `DashBoardUniversal`.
4. `FORBIDDEN` (403) en admin: redirigir a `/app` y/o mostrar “Sin permisos”.
5. `USER_BANNED` (403): mostrar estado de cuenta suspendida al intentar mutaciones.

3. Checklist de verificación (basada en TESTS_COMUNIDADES.md)
1. Crear comunidad autenticado → `201` y `status=PENDING`.
2. Listado público de comunidades no muestra `PENDING` antes de aprobar.
3. Admin lista pendientes → incluye comunidad.
4. Admin activa comunidad → estado `ACTIVE`.
5. Listado público post-aprobación → comunidad visible.
6. Crear evento con `social_links` + `community_id` → crea evento + solicitud `PENDING`.
7. Owner lista solicitudes `PENDING` → solicitud visible (usar `request_id` correcto).
8. Schedule de comunidad antes de aprobar solicitud → sin eventos.
9. Owner aprueba solicitud → `APPROVED`.
10. Schedule después de aprobar → evento visible.
11. Admin banea usuario → baneo activo.
12. Listar baneados → usuario en lista.
13. Usuario baneado crea evento → `403 USER_BANNED`.
14. Admin desbanea → `200`.
15. Usuario desbaneado crea evento → `201`.
16. Crear comunidad sin aceptar términos → `400 TERMS_NOT_ACCEPTED`.
17. Crear comunidad nombre duplicado → `409 DUPLICATE_COMMUNITY_NAME`.
18. Usuario sin rol admin cambia estado → `403 FORBIDDEN`.
19. Social link inválido → `422 VALIDATION_ERROR`.

