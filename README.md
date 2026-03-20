# untitled1

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Deploy en Vercel (desde GitHub)

Este repo ya está listo para desplegarse como SPA de Vue 3 + Vite.

### 1) Subir a GitHub

```sh
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

### 2) Importar en Vercel

1. Entra a https://vercel.com/new
2. Selecciona el repo de GitHub
3. Vercel detecta **Vite** automáticamente.

Configuración esperada (si te la pide):

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3) Rutas tipo SPA (Vue Router)

Incluimos `vercel.json` con un rewrite a `index.html` para que al recargar rutas (por ejemplo `/eventos`) no dé 404.


