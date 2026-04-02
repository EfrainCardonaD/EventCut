# Events Service — Esquemas (resumen)

> Para detalle exacto ver `events_service/app/schemas/*`.

## Events
- `EventCreate`, `EventUpdate`
- `EventResponse`, `EventListResponse`
- `EventFilters`
- `FavoriteToggleResponse`

Campos destacables:
- `social_links` (opcional): ver `SocialLinks`.

## Communities
- `CommunityCreate`, `CommunityUpdate`
- `CommunityResponse`, `CommunityListResponse`
- `CommunityScheduleResponse`
- `CommunityEventRequestAction`, `CommunityEventRequestResponse`

## Social Links
Validación de links (según `events_service/app/schemas/social.py`):
- WhatsApp: `https://wa.me/` o `https://chat.whatsapp.com/`
- Facebook: `https://facebook.com/` o `https://www.facebook.com/`
- Instagram: `https://instagram.com/` o `https://www.instagram.com/`

Ejemplo:
```json
{
  "social_links": {
    "whatsapp": "https://wa.me/528112345678",
    "facebook": "https://facebook.com/runnersmty",
    "instagram": "https://instagram.com/runnersmty"
  }
}
```

