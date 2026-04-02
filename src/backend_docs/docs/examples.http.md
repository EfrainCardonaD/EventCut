# Events Service — Ejemplos (basados en `.http`)

## Health

```http
GET http://127.0.0.1:8001/api/health
```

## Categories

```http
GET http://127.0.0.1:8001/api/v1/categories
```

## List events (month)

```http
GET http://127.0.0.1:8001/api/v1/events?month=2026-05&sort_by=score&limit=10
```

## Create community (auth)

```http
POST http://127.0.0.1:8001/api/v1/communities
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "name": "Runners Monterrey Test",
  "description": "Comunidad de corredores del área metropolitana de Monterrey para eventos de running y trail.",
  "image_url": null,
  "contact_email": "runners.mty@test.com",
  "is_accepted_terms": true,
  "social_links": {
    "whatsapp": "https://wa.me/528112345678",
    "facebook": "https://facebook.com/runnersmty",
    "instagram": "https://instagram.com/runnersmty"
  }
}
```

## Admin: approve community

```http
PATCH http://127.0.0.1:8001/api/v1/admin/communities/<COMMUNITY_ID>/status
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json

{ "action": "ACTIVATE" }
```

## Admin: ban user

```http
POST http://127.0.0.1:8001/api/v1/admin/users/<USER_ID>/ban
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json

{ "reason": "Test de baneo - violación de normas" }
```

