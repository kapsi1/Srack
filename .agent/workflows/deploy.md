---
description: Steps to prepare and guide deployment of Snack (Neon / Railway / Vercel)
---

// turbo-all
1. Check that `server/package.json` has a production build script that includes prisma generation.
2. Verify `server/src/app.ts` is ready for the `CORS_ORIGIN` environment variable.
3. Remind user to set up a Neon database and provide the connection string.
4. Provide the exact commands needed to run migrations against the production database:
   ```bash
   pnpm --filter server prisma migrate deploy
   ```
5. Instructions for Koyeb:
   - Root: `server`
   - Build: `pnpm install && pnpm build`
   - Start: `pnpm start`
   - Port: `8000` (or as provided by env)
6. Instructions for Vercel:
   - Root: `client`
   - Build: `pnpm build`
   - Env: `VITE_API_URL`
