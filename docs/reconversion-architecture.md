# Reconversion Architecture - Impulso Virtual

## Objetivo
- Mantener la base técnica actual.
- Desacoplar el modelo legacy de portfolio/CMS por secciones.
- Preparar estructura pública y admin para servicios digitales premium.

## Arquitectura pública objetivo
- `/`
- `/servicios`
- `/servicios/[slug]`
- `/proyectos`
- `/proyectos/[slug]`
- `/sobre-mi`
- `/blog`
- `/blog/[slug]`
- `/contacto`
- `/solicitar-propuesta`

## Arquitectura admin objetivo
- `/admin`
- `/admin/leads`
- `/admin/quote-requests`
- `/admin/services`
- `/admin/projects`
- `/admin/blog`
- `/admin/testimonials`
- `/admin/faqs`
- `/admin/settings`

## Compatibilidad legacy aplicada
- `/works` redirige a `/proyectos`
- `/works/[slug]` redirige a `/proyectos/[slug]`

## Entidades objetivo (fase de modelo de datos)
- `services`
- `projects`
- `project_media`
- `testimonials`
- `faqs`
- `blog_categories`
- `blog_posts`
- `leads`
- `quote_requests`
- `site_settings`
- `admin_profiles`

## Nota
- Esta fase no conecta todavía base de datos nueva ni CRUD final.
- Se prioriza estructura de rutas, navegación y tipos de dominio.
