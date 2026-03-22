begin;

insert into public.services (
  slug,
  title,
  subtitle,
  short_description,
  full_description,
  cover_image_url,
  icon_name,
  featured,
  sort_order,
  is_published,
  seo_title,
  seo_description
)
values
  (
    'estrategia-digital',
    'Estrategia Digital',
    'Posicionamiento y crecimiento',
    'Diagnostico de negocio, posicionamiento y hoja de ruta.',
    'Servicio orientado a definir una estrategia digital clara con objetivos, canales y plan de ejecucion medible.',
    '/assets/work-01.png',
    'target',
    true,
    10,
    true,
    'Estrategia Digital | Impulso Virtual',
    'Definicion de estrategia digital para empresas que buscan crecer con claridad.'
  ),
  (
    'diseno-web-premium',
    'Diseno Web Premium',
    'Experiencia y conversion',
    'Web corporativa o comercial con enfoque premium y orientado a conversion.',
    'Diseno y desarrollo de webs de alto impacto visual, rendimiento tecnico y estructura orientada a negocio.',
    '/assets/work-02.png',
    'sparkles',
    true,
    20,
    true,
    'Diseno Web Premium | Impulso Virtual',
    'Diseno web premium para marcas que necesitan posicionamiento y resultados.'
  ),
  (
    'automatizaciones',
    'Automatizaciones',
    'Escala operativa',
    'Automatizacion de procesos comerciales y operativos.',
    'Implementacion de automatizaciones para captacion, nurturing, seguimiento de leads y operaciones internas.',
    '/assets/work-03.png',
    'workflow',
    false,
    30,
    true,
    'Automatizaciones | Impulso Virtual',
    'Sistemas de automatizacion para escalar operaciones y ventas.'
  )
on conflict (slug) do update
set
  title = excluded.title,
  subtitle = excluded.subtitle,
  short_description = excluded.short_description,
  full_description = excluded.full_description,
  cover_image_url = excluded.cover_image_url,
  icon_name = excluded.icon_name,
  featured = excluded.featured,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;

insert into public.projects (
  slug,
  title,
  client_name,
  excerpt,
  description,
  challenge,
  solution,
  results,
  cover_image_url,
  website_url,
  featured,
  is_published,
  published_at,
  seo_title,
  seo_description
)
values
  (
    'rebrand-saas-b2b',
    'Rebrand SaaS B2B',
    'Aurea Systems',
    'Reposicionamiento digital de una plataforma SaaS B2B.',
    'Proyecto integral para redefinir narrativa, arquitectura web y embudos de captacion para un SaaS B2B.',
    'La marca no convertia y su propuesta de valor no estaba clara.',
    'Se rediseno la estrategia de comunicacion, nueva web y automatizaciones de nurturing.',
    'Incremento de solicitudes cualificadas y mejora de conversion de demos.',
    '/assets/work-01.png',
    'https://example.com/aurea',
    true,
    true,
    now(),
    'Rebrand SaaS B2B | Impulso Virtual',
    'Caso de reposicionamiento digital y crecimiento comercial.'
  ),
  (
    'lanzamiento-marca-ecommerce',
    'Lanzamiento Marca Ecommerce',
    'Nexo Atelier',
    'Lanzamiento digital de una marca ecommerce premium.',
    'Estrategia y ejecucion de lanzamiento digital con enfoque en marca, performance y captacion.',
    'No existia presencia digital ni sistema comercial inicial.',
    'Se construyo la plataforma web, contenidos base y flujo de captacion con automatizaciones.',
    'Primeras ventas en semanas y pipeline comercial estable.',
    '/assets/work-02.png',
    'https://example.com/nexo',
    false,
    true,
    now(),
    'Lanzamiento Ecommerce | Impulso Virtual',
    'Caso de lanzamiento de marca ecommerce con enfoque premium.'
  )
on conflict (slug) do update
set
  title = excluded.title,
  client_name = excluded.client_name,
  excerpt = excluded.excerpt,
  description = excluded.description,
  challenge = excluded.challenge,
  solution = excluded.solution,
  results = excluded.results,
  cover_image_url = excluded.cover_image_url,
  website_url = excluded.website_url,
  featured = excluded.featured,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;

with target_projects as (
  select id, slug, cover_image_url
  from public.projects
  where slug in ('rebrand-saas-b2b', 'lanzamiento-marca-ecommerce')
)
insert into public.project_media (
  project_id,
  kind,
  role,
  storage_key,
  public_url,
  alt_text,
  caption,
  sort_order
)
select
  tp.id,
  'image',
  'cover',
  'seed/projects/' || tp.slug || '/cover',
  tp.cover_image_url,
  'Portada ' || tp.slug,
  'Imagen de portada del proyecto',
  0
from target_projects tp
where tp.cover_image_url is not null
on conflict (storage_key) do update
set
  public_url = excluded.public_url,
  alt_text = excluded.alt_text,
  caption = excluded.caption,
  sort_order = excluded.sort_order;

with seed_testimonials as (
  select * from (
    values
      (
        'Clara Ibanez',
        'Aurea Systems',
        'CMO',
        'Impulso Virtual nos ayudo a convertir una web bonita en una maquina de oportunidades comerciales.',
        '/assets/work-01.png',
        10,
        true,
        true
      ),
      (
        'Javier Soler',
        'Nexo Atelier',
        'Founder',
        'Pasamos de no tener sistema digital a tener una estructura clara de captacion y seguimiento.',
        '/assets/work-02.png',
        20,
        false,
        true
      )
  ) as t(name, company, role, quote, avatar_url, sort_order, is_featured, is_published)
)
insert into public.testimonials (
  name,
  company,
  role,
  quote,
  avatar_url,
  sort_order,
  is_featured,
  is_published
)
select * from seed_testimonials
where not exists (select 1 from public.testimonials);

with seed_faqs as (
  select * from (
    values
      (
        'Servicios',
        'Trabajais proyectos completos o por fases?',
        'Ambas opciones. Podemos ejecutar una transformacion completa o iniciar por una fase prioritaria.',
        10,
        true
      ),
      (
        'Proceso',
        'Cuanto tarda un proyecto web premium?',
        'Depende del alcance, pero un proyecto estandar suele estar entre 4 y 8 semanas.',
        20,
        true
      ),
      (
        'Colaboracion',
        'Solo trabajais con empresas grandes?',
        'No. Trabajamos con empresas y marcas en crecimiento con ambicion de posicionamiento premium.',
        30,
        true
      ),
      (
        'Soporte',
        'Incluis soporte tras la entrega?',
        'Si. Definimos un tramo de soporte y mejora continua segun necesidades.',
        40,
        true
      )
  ) as t(category, question, answer, sort_order, is_published)
)
insert into public.faqs (category, question, answer, sort_order, is_published)
select * from seed_faqs
where not exists (select 1 from public.faqs);

insert into public.blog_categories (
  slug,
  name,
  description,
  sort_order,
  is_published
)
values
  (
    'estrategia',
    'Estrategia',
    'Estrategia digital y posicionamiento para marcas premium.',
    10,
    true
  ),
  (
    'growth',
    'Growth',
    'Captacion, conversion y sistemas de crecimiento.',
    20,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.blog_posts (
  slug,
  title,
  excerpt,
  content,
  cover_image_url,
  category_id,
  author_name,
  is_featured,
  is_published,
  published_at,
  seo_title,
  seo_description,
  og_image_url
)
values
  (
    'como-escalar-presencia-digital-premium',
    'Como escalar una presencia digital premium',
    'Principios para construir una web que posicione y convierta.',
    'Contenido de ejemplo para el post sobre presencia digital premium.',
    '/assets/work-03.png',
    (select id from public.blog_categories where slug = 'estrategia'),
    'Impulso Virtual',
    true,
    true,
    now(),
    'Como escalar una presencia digital premium',
    'Guia para mejorar posicionamiento y conversion digital.',
    '/og-cover.svg'
  ),
  (
    'errores-comunes-en-webs-de-servicios',
    'Errores comunes en webs de servicios de alto valor',
    'Que evitar para no perder leads cualificados.',
    'Contenido de ejemplo para el post sobre errores frecuentes.',
    '/assets/work-02.png',
    (select id from public.blog_categories where slug = 'growth'),
    'Impulso Virtual',
    false,
    true,
    now(),
    'Errores comunes en webs de servicios',
    'Checklist de errores que afectan ventas en servicios premium.',
    '/og-cover.svg'
  )
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  cover_image_url = excluded.cover_image_url,
  category_id = excluded.category_id,
  author_name = excluded.author_name,
  is_featured = excluded.is_featured,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  og_image_url = excluded.og_image_url;

insert into public.site_settings (
  business_name,
  hero_title,
  hero_subtitle,
  hero_cta_primary,
  hero_cta_secondary,
  contact_email,
  contact_phone,
  whatsapp_url,
  location,
  linkedin_url,
  instagram_url,
  behance_url,
  default_seo_title,
  default_seo_description,
  default_og_image_url
)
values (
  'Impulso Virtual',
  'Transformamos tu presencia digital en un sistema de crecimiento',
  'Estrategia, diseno web premium y automatizacion para marcas que quieren liderar.',
  'Solicitar propuesta',
  'Ver servicios',
  'hola@impulsovirtual.com',
  '+34 650 30 49 69',
  'https://wa.me/34650304969',
  'Madrid, Espana',
  'https://www.linkedin.com/company/impulso-virtual',
  'https://www.instagram.com/impulsovirtual',
  null,
  'Impulso Virtual | Servicios digitales premium',
  'Impulso Virtual impulsa marcas con estrategia digital, diseno web premium y automatizaciones.',
  '/og-cover.svg'
)
on conflict ((true)) do update
set
  business_name = excluded.business_name,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  hero_cta_primary = excluded.hero_cta_primary,
  hero_cta_secondary = excluded.hero_cta_secondary,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  whatsapp_url = excluded.whatsapp_url,
  location = excluded.location,
  linkedin_url = excluded.linkedin_url,
  instagram_url = excluded.instagram_url,
  behance_url = excluded.behance_url,
  default_seo_title = excluded.default_seo_title,
  default_seo_description = excluded.default_seo_description,
  default_og_image_url = excluded.default_og_image_url,
  updated_at = now();

insert into public.admin_panel_settings (
  contact_notification_email,
  contact_notifications_enabled,
  contact_auto_reply_enabled,
  contact_auto_reply_subject,
  contact_auto_reply_body,
  alerts_enabled,
  vercel_plan,
  supabase_plan,
  r2_plan_mode,
  email_provider,
  usage_warning_threshold,
  usage_danger_threshold,
  email_daily_limit,
  email_monthly_limit
)
values (
  'hola@impulsovirtual.com',
  true,
  false,
  'Gracias por escribir a Impulso Virtual',
  'Hemos recibido tu mensaje y te responderemos lo antes posible.',
  true,
  'sin definir',
  'sin definir',
  'sin definir',
  'resend',
  70,
  85,
  null,
  null
)
on conflict ((true)) do update
set
  contact_notification_email = excluded.contact_notification_email,
  contact_notifications_enabled = excluded.contact_notifications_enabled,
  contact_auto_reply_enabled = excluded.contact_auto_reply_enabled,
  contact_auto_reply_subject = excluded.contact_auto_reply_subject,
  contact_auto_reply_body = excluded.contact_auto_reply_body,
  alerts_enabled = excluded.alerts_enabled,
  vercel_plan = excluded.vercel_plan,
  supabase_plan = excluded.supabase_plan,
  r2_plan_mode = excluded.r2_plan_mode,
  email_provider = excluded.email_provider,
  usage_warning_threshold = excluded.usage_warning_threshold,
  usage_danger_threshold = excluded.usage_danger_threshold,
  email_daily_limit = excluded.email_daily_limit,
  email_monthly_limit = excluded.email_monthly_limit,
  updated_at = now();

commit;
