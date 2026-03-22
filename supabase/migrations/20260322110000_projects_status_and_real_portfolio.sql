begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum ('completed', 'in_progress');
  end if;
end $$;

alter table public.projects
  add column if not exists status public.project_status not null default 'completed',
  add column if not exists progress_percentage integer,
  add column if not exists progress_note text;

alter table public.projects
  drop constraint if exists projects_progress_percentage_range_check;

alter table public.projects
  add constraint projects_progress_percentage_range_check
  check (
    progress_percentage is null
    or (progress_percentage >= 0 and progress_percentage <= 100)
  );

alter table public.projects
  drop constraint if exists projects_progress_required_for_in_progress_check;

alter table public.projects
  add constraint projects_progress_required_for_in_progress_check
  check (
    status <> 'in_progress'
    or progress_percentage is not null
  );

create index if not exists projects_status_published_idx
  on public.projects(status, is_published, featured desc, published_at desc nulls last, created_at desc);

delete from public.project_media
where project_id in (
  select id
  from public.projects
  where slug in ('rebrand-saas-b2b', 'lanzamiento-marca-ecommerce')
);

delete from public.projects
where slug in ('rebrand-saas-b2b', 'lanzamiento-marca-ecommerce');

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
  status,
  progress_percentage,
  progress_note,
  seo_title,
  seo_description
)
values
  (
    'estudio-juridico-mr',
    'Estudio Juridico MR',
    'Estudio Juridico MR',
    'Web corporativa legal con enfoque premium, claridad de servicios y confianza de marca.',
    'Proyecto web orientado a reforzar credibilidad del despacho, mejorar experiencia de usuario y ordenar la captacion digital.',
    'El sitio anterior no transmitia posicionamiento premium ni estructuraba bien la oferta legal.',
    'Se desarrollo una arquitectura clara de servicios, narrativa institucional y una presencia visual coherente con el sector.',
    'Mejor percepcion de marca, experiencia de navegacion mas limpia y canal digital preparado para captacion.',
    '/og-cover.svg',
    'https://www.estudiojuridicomr.com/',
    true,
    true,
    now(),
    'completed',
    null,
    null,
    'Estudio Juridico MR | Proyecto Web Premium',
    'Caso de diseno y desarrollo web premium para Estudio Juridico MR.'
  ),
  (
    'es-doctor-phone',
    'ES Doctor Phone',
    'ES Doctor Phone',
    'Proyecto digital para servicio tecnico y captacion local con enfoque comercial.',
    'Se trabajo una web orientada a conversion para un negocio de reparacion de dispositivos, priorizando claridad y accion.',
    'Necesidad de visibilidad, confianza y conversion en un mercado local muy competitivo.',
    'Se aplico estructura orientada a servicios, mensajes directos y puntos de contacto estrategicos.',
    'Presencia digital mas solida y mejor preparacion para captar demanda cualificada.',
    '/og-cover.svg',
    'https://esdoctorphone.com/',
    false,
    true,
    now(),
    'completed',
    null,
    null,
    'ES Doctor Phone | Proyecto Digital',
    'Caso de web comercial orientada a conversion para ES Doctor Phone.'
  ),
  (
    'nachomasdesign',
    'Nachomasdesign',
    'Nachomasdesign',
    'Proyecto de identidad y presencia digital con enfoque creativo y comercial.',
    'Web de portfolio y servicios orientada a posicionar el estudio y presentar trabajos con narrativa profesional.',
    'El proyecto necesitaba ordenar oferta, casos y discurso para elevar percepcion de valor.',
    'Se planteo estructura editorial, secciones de servicios y presentacion visual cuidada.',
    'Base digital mas clara para marca personal y conversion de oportunidades.',
    '/og-cover.svg',
    'https://www.nachomasdesign.com/',
    true,
    true,
    now(),
    'completed',
    null,
    null,
    'Nachomasdesign | Proyecto Web',
    'Caso de presencia digital para estudio creativo.'
  ),
  (
    'barberia-denia',
    'Barberia Denia',
    'Barberia Denia',
    'Web de negocio local con enfoque en posicionamiento, servicios y contacto directo.',
    'Proyecto pensado para mejorar visibilidad online de la barberia y facilitar la captacion de nuevos clientes.',
    'Faltaba una presencia digital estructurada con informacion clara y llamadas a la accion.',
    'Se diseno una web clara, visual y optimizada para consulta rapida desde movil.',
    'Mejora de imagen digital y canal directo para solicitudes de cita e informacion.',
    '/og-cover.svg',
    'https://barberiadenia.com/',
    false,
    true,
    now(),
    'completed',
    null,
    null,
    'Barberia Denia | Proyecto Web Local',
    'Caso de web local orientada a marca y captacion para Barberia Denia.'
  ),
  (
    'ella-boutique',
    'Ella Boutique',
    'Ella Boutique',
    'Ecommerce boutique en fase avanzada de desarrollo con enfoque premium.',
    'Proyecto en desarrollo para construir una presencia digital de marca con experiencia de compra cuidada.',
    'Definir una experiencia ecommerce elegante, clara y preparada para conversion.',
    'Arquitectura de tienda, diseño visual y optimizacion de flujo de compra.',
    'Fase avanzada de implementacion lista para cierre tecnico y QA final.',
    '/og-cover.svg',
    'https://ellaboutique.es/',
    true,
    true,
    null,
    'in_progress',
    70,
    'Arquitectura y visual final completados. Ajustes finales de contenido y QA.',
    'Ella Boutique | Proyecto en desarrollo',
    'Estado actual del proyecto digital de Ella Boutique.'
  ),
  (
    'experio',
    'Experio',
    'Experio',
    'Proyecto corporativo en desarrollo con base tecnica y posicionamiento de marca.',
    'Desarrollo de presencia digital orientada a servicios profesionales con enfoque editorial y comercial.',
    'Alinear propuesta de valor, estructura y conversion en una sola experiencia.',
    'Trabajo en arquitectura de contenidos, componentes clave y flujo de contacto.',
    'Base funcional estable con fase de refinado y cierre de contenidos en curso.',
    '/og-cover.svg',
    'https://experio.es/',
    false,
    true,
    null,
    'in_progress',
    55,
    'Estructura principal terminada. Pendiente refinado de contenidos y secciones clave.',
    'Experio | Proyecto en desarrollo',
    'Seguimiento del proyecto web de Experio en fase activa.'
  ),
  (
    'factuclin',
    'Factuclin',
    'Factuclin',
    'Plataforma en desarrollo con foco en claridad de producto y captacion B2B.',
    'Proyecto digital para presentar solucion de forma clara y profesional, reforzando confianza comercial.',
    'Comunicar producto tecnico sin perder sencillez ni enfoque de conversion.',
    'Definicion de narrativa de producto, secciones de valor y flujo de contacto.',
    'Implementacion avanzada con puntos de conversion principales ya operativos.',
    '/og-cover.svg',
    'https://factuclin.com/',
    false,
    true,
    null,
    'in_progress',
    65,
    'Bloques principales construidos. En fase de afinado de mensajes y validacion final.',
    'Factuclin | Proyecto en desarrollo',
    'Estado de avance del proyecto digital de Factuclin.'
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
  status = excluded.status,
  progress_percentage = excluded.progress_percentage,
  progress_note = excluded.progress_note,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  updated_at = now();

commit;
