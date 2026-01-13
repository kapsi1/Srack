# 🥨 Snack Deployment Guide

This guide describes how to deploy the **Snack** application (React + Node.js + Socket.io + Prisma) for free using **Neon**, **Railway**, and **Vercel**.

## 1. Database (Neon)
Neon provides a serverless PostgreSQL database with a generous free tier.

1.  **Create Account**: Sign up at [neon.tech](https://neon.tech/).
2.  **Create Project**: Name it `snack-db`.
3.  **Get Connection String**: Copy the "Connection string" (looks like `postgresql://user:password@hostname/neondb?sslmode=require`).
4.  **Save it**: You'll need this for the `DATABASE_URL` environment variable.

---

## 2. Backend (Koyeb)
Koyeb is a great alternative for Node.js backends. It doesn't "sleep" like some other free tiers, making it excellent for testing real-time apps.

1.  **Create Account**: Sign up at [koyeb.com](https://www.koyeb.com/).
2.  **Create App**: Select **"Web Service"** and connect your GitHub repo.
3.  **Configure Service**:
    *   **Root Directory**: `server`
    *   **Build Command**: `pnpm install && pnpm build`
    *   **Run Command**: `pnpm start`
4.  **Add Environment Variables**:
    *   `DATABASE_URL`: (The string from Neon)
    *   `JWT_SECRET`: (A random long string)
    *   `PORT`: `8000` (Koyeb default, make sure your app listens to the provided port)
5.  **Expose Port**: Ensure the service is set to expose the port (usually 8000 or the `PORT` env var).

---

## 3. Frontend (Vercel)
Vercel is the best platform for React/Vite frontends.

1.  **Create Account**: Sign up at [vercel.com](https://vercel.com/).
2.  **New Project**: Select your GitHub repo.
3.  **Configure Project**:
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: `client`
4.  **Add Environment Variables**:
    *   `VITE_API_URL`: (The URL of your Railway backend, e.g., `https://server-production.up.railway.app`)
5.  **Deploy**: Vercel will build and host your frontend.

---

## 4. Final Security Configurations

### CORS (Cross-Origin Resource Sharing)
Currently, the server allows all origins (`*`). For production, you should restrict this to your Vercel URL.

Update `server/src/app.ts`:
```typescript
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));
```
Then add `CORS_ORIGIN` to your Koyeb environment variables.

### Database Migrations
To apply your schema to Neon:
1.  Temporarily update your local `.env` with the Neon `DATABASE_URL`.
2.  Run `pnpm --filter server prisma migrate deploy`.
3.  **Alternatively**, run the command during the Koyeb build phase or manually via a temporary console.

---

## Summary of Environment Variables

### Backend (Koyeb)
| Variable | Value |
| :--- | :--- |
| `DATABASE_URL` | `postgresql://...` (from Neon) |
| `JWT_SECRET` | Your secret |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |

### Frontend (Vercel)
| Variable | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://your-backend.koyeb.app` |
