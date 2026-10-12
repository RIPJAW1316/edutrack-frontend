# EduTrack frontend

React 19 and Vite client for the [EduTrack backend](https://github.com/RIPJAW1316/edutrack-backend). The app includes a student directory, departments, an overview dashboard, account pages, and light and dark themes.

![EduTrack overview dashboard](docs/overview-dark.webp)

## Run locally

Requires Node.js 20 or newer and a running API.

```bash
npm ci
npm run dev
```

The app opens at `http://localhost:5173`. By default it calls `http://localhost:8081`. To use a different API, set `VITE_API_URL` in a local `.env` file or in your deployment environment:

```text
VITE_API_URL=https://your-api.example.com
```

`VITE_API_URL` is read at build time. Rebuild or redeploy after changing it. The backend must allow the frontend origin through CORS.

## Checks

```bash
npm run lint
npm run build
```

## Deployment

Deploy this repository's root on Vercel. [`vercel.json`](vercel.json) configures Vite output and SPA route rewrites. Set `VITE_API_URL` to the public backend URL. The current demo is at [edutrack-ripjaw.vercel.app](https://edutrack-ripjaw.vercel.app).

## Related repositories

- [Spring Boot API and Dockerfile](https://github.com/RIPJAW1316/edutrack-backend)
- [Original combined repository](https://github.com/RIPJAW1316/edutrack)
