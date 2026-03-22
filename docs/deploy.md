# Deploy a Producción (Vercel + Supabase + Resend)

## 1) Requisitos previos
- Proyecto Supabase creado y vacío (o ya migrado con baseline actual).
- Dominio de envío verificado en Resend para usar `CONTACT_FROM_EMAIL` y `QUOTE_FROM_EMAIL`.
- Proyecto en Vercel conectado al repositorio.

## 2) Aplicar base de datos
Desde local (CLI enlazado al proyecto destino):

```bash
npx supabase link
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.types.ts
```

Si cambiaste tipos, confirma build local:

```bash
npm run build
```

## 3) Variables de entorno en Vercel
Configura estas variables en `Project Settings > Environment Variables` (Production y Preview según convenga):

Importante: `NEXT_PUBLIC_SITE_URL` debe coincidir exactamente con el dominio final público (incluyendo `https://`).

### Críticas
- `NEXT_PUBLIC_SITE_URL` (ej: `https://impulsovirtual.com`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `QUOTE_TO_EMAIL`
- `QUOTE_FROM_EMAIL`
- `CONTACT_USER_CONFIRMATION_ENABLED` (`true`/`false`)
- `QUOTE_USER_CONFIRMATION_ENABLED` (`true`/`false`)
- `NEXT_PUBLIC_ENABLE_LEGACY_ADMIN` (`false`, mantener desactivado en producción)

### Opcionales (solo si los usas)
- `CMS_PREVIEW_SECRET`
- `DEFAULT_FROM_EMAIL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `VERCEL_API_TOKEN`
- `VERCEL_PROJECT_ID`
- `VERCEL_TEAM_ID`
- `SUPABASE_MANAGEMENT_TOKEN`
- `SUPABASE_PROJECT_REF`
- `CLOUDFLARE_API_TOKEN`
- `USAGE_SYNC_CRON_SECRET`
- `CRON_SECRET`

## 4) Pasos manuales para primer acceso admin
El login al panel requiere **Auth user + fila en `admin_profiles`**.

1. Crea usuario en Supabase Auth (Dashboard > Authentication > Users).
2. Copia su `id` (UUID).
3. Ejecuta SQL en el proyecto:

```sql
insert into public.admin_profiles (id, user_id, email, full_name, role, is_active)
values ('<AUTH_USER_ID>', '<AUTH_USER_ID>', '<EMAIL_ADMIN>', 'Administrador', 'admin', true)
on conflict (id) do update
set
  user_id = excluded.user_id,
  email = excluded.email,
  full_name = excluded.full_name,
  role = 'admin',
  is_active = true;
```

Sin ese registro, `/admin/login` autentica pero no autoriza acceso.

## 5) Resend en producción
- Verifica dominio/remitente (`from`) en Resend.
- Recomendado usar remitentes reales del dominio (`noreply@...` o `hola@...`).
- Si `RESEND_API_KEY` falta, los formularios guardan en DB pero no envían correo.

## 6) SEO técnico esperado
- `metadataBase` y canonicals basadas en `NEXT_PUBLIC_SITE_URL`.
- `robots.txt` bloquea `/admin` y `/api`.
- `app/admin/layout.tsx` marca `noindex, nofollow`.
- `sitemap.xml` incluye rutas públicas y slugs publicados.

## 7) Smoke test post-deploy
1. Pública:
   - `/`
   - `/servicios`
   - `/proyectos`
   - `/blog`
   - `/contacto`
   - `/solicitar-propuesta`
2. SEO:
   - `/<ruta>` tiene title/description y canonical correctos.
   - `/robots.txt` accesible.
   - `/sitemap.xml` accesible.
3. Comercial:
   - Enviar contacto y comprobar:
     - alta en `leads`
     - email interno recibido
   - Enviar solicitud de propuesta y comprobar:
     - alta en `quote_requests`
     - email interno recibido
4. Admin:
   - Login en `/admin/login`.
   - Listados de `leads` y `quote-requests` visibles.
   - Cambio de estado/notas funciona.
   - CRUD de contenido (services/projects/blog/faqs/testimonials/settings) operativo.

## 8) Errores frecuentes
- `Missing NEXT_PUBLIC_SUPABASE_*`: faltan variables públicas de Supabase.
- `Missing SUPABASE_SERVICE_ROLE_KEY`: faltan credenciales server-side.
- Login admin sin acceso: falta/está desactivado `admin_profiles`.
- No llegan correos: remitente no verificado o `RESEND_API_KEY` inválida.
