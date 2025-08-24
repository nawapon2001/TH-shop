Standalone build and deploy (Next.js)

This repo can produce a standalone output directory after building. The standalone folder contains a minimal Node server and all assets required to run the app without Node modules resolution from the project root.

How to build the standalone bundle (on server or CI):

```bash
# install
npm ci

# build (this will create .next/standalone)
npm run build
```

Where to find the standalone bundle:
- `.next/standalone` — contains `server.js` (Node server) and a `server` folder with the compiled app and assets.

Deploying the standalone folder (example):
1. Copy only the `standalone` folder and `node_modules` for the runtime if you want (standalone includes its own node runtime files) to `/path/to/deploy`.
2. Ensure environment variables are present (via `.env.production` in the deploy directory or system env). Important: `MONGO_URI`, `NODE_ENV=production`, `PORT`.
3. Start using node directly:

```bash
cd /path/to/deploy
NODE_ENV=production PORT=3000 node server.js
```

Alternatives:
- Use `pm2` to start/manage:
  pm2 start server.js --name signshop --update-env
- Use systemd unit with `ExecStart=/usr/bin/node /path/to/deploy/server.js` and `EnvironmentFile=/path/to/deploy/.env.production`

Notes:
- The standalone build reduces deployment complexity (no rebuilding on server required), but you must still install dependencies for any native modules if used.
- Node version must match the build/runtime expectations. Use the same major Node version during build and runtime.
