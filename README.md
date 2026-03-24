# Impulso Virtual

Web pública + panel admin de Impulso Virtual construida con Next.js, Supabase y Resend.

## Stack
- Next.js App Router + TypeScript
- Supabase (DB, Auth, Storage)
- Resend (emails comerciales)
- Tailwind CSS + Motion
- Deploy objetivo: Vercel

## Variables de entorno
Usa `.env.local.example` como plantilla local y `.env.example` como referencia de producción.

### Requeridas para producción
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `QUOTE_TO_EMAIL`
- `QUOTE_FROM_EMAIL`
- `CONTACT_USER_CONFIRMATION_ENABLED`
- `QUOTE_USER_CONFIRMATION_ENABLED`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_ENABLE_LEGACY_ADMIN` (mantener en `false`)

### Opcionales
- `OPENAI_PROJECT_ASSISTANT_MODEL` (por defecto `gpt-4.1-mini`)
- `OPENAI_BASE_URL` (por defecto `https://api.openai.com/v1`)
- `CMS_PREVIEW_SECRET`
- `DEFAULT_FROM_EMAIL` (fallback para remitente de email)
- `R2_*` (si usas subida/gestión de media en R2)
- `VERCEL_*`, `SUPABASE_MANAGEMENT_TOKEN`, `SUPABASE_PROJECT_REF`, `CLOUDFLARE_API_TOKEN`, `USAGE_SYNC_CRON_SECRET`, `CRON_SECRET` (panel operativo)

## Desarrollo local
```bash
npm install
npm run dev
```

Build de producción:
```bash
npm run build
npm run start
```

## Migraciones y tipos Supabase
```bash
npx supabase link
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.types.ts
```

## Deploy
Guía completa de despliegue y smoke test:
- [docs/deploy.md](docs/deploy.md)
