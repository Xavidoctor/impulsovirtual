begin;

alter table public.projects
  add column if not exists progress_label text,
  add column if not exists project_orientation text,
  add column if not exists what_was_done text,
  add column if not exists services_applied text[] not null default '{}'::text[],
  add column if not exists preview_mode text not null default 'auto',
  add column if not exists preview_image_url text,
  add column if not exists live_url text;

alter table public.projects
  drop constraint if exists projects_preview_mode_check;

alter table public.projects
  add constraint projects_preview_mode_check
  check (preview_mode in ('auto', 'embed', 'image'));

update public.projects
set live_url = website_url
where live_url is null
  and website_url is not null;

update public.projects
set
  status = 'completed',
  progress_percentage = null,
  progress_note = null,
  progress_label = null,
  project_orientation = 'Web corporativa premium',
  what_was_done = 'Arquitectura de contenidos, diseño visual y optimización de la experiencia para mejorar posicionamiento y confianza.',
  services_applied = array['Estrategia digital', 'Diseño web premium', 'UX/UI'],
  preview_mode = 'auto',
  preview_image_url = '/og-cover.svg',
  live_url = 'https://www.estudiojuridicomr.com/',
  website_url = 'https://www.estudiojuridicomr.com/'
where slug = 'estudio-juridico-mr';

update public.projects
set
  status = 'completed',
  progress_percentage = null,
  progress_note = null,
  progress_label = null,
  project_orientation = 'Web comercial local',
  what_was_done = 'Diseño de estructura comercial, mensajes de servicio y experiencia optimizada para captación desde móvil.',
  services_applied = array['Diseño web', 'Optimización de conversión'],
  preview_mode = 'auto',
  preview_image_url = '/og-cover.svg',
  live_url = 'https://esdoctorphone.com/',
  website_url = 'https://esdoctorphone.com/'
where slug = 'es-doctor-phone';

update public.projects
set
  status = 'completed',
  progress_percentage = null,
  progress_note = null,
  progress_label = null,
  project_orientation = 'Portfolio profesional',
  what_was_done = 'Replanteamiento de narrativa de marca, estructura editorial y secciones orientadas a valor y autoridad.',
  services_applied = array['Brand strategy', 'Diseño web premium', 'Copy estratégico'],
  preview_mode = 'auto',
  preview_image_url = '/og-cover.svg',
  live_url = 'https://www.nachomasdesign.com/',
  website_url = 'https://www.nachomasdesign.com/'
where slug = 'nachomasdesign';

update public.projects
set
  status = 'completed',
  progress_percentage = null,
  progress_note = null,
  progress_label = null,
  project_orientation = 'Negocio local',
  what_was_done = 'Definición de presencia digital, presentación de servicios y canal de contacto directo con enfoque de conversión.',
  services_applied = array['Diseño web', 'SEO local', 'UX móvil'],
  preview_mode = 'auto',
  preview_image_url = '/og-cover.svg',
  live_url = 'https://barberiadenia.com/',
  website_url = 'https://barberiadenia.com/'
where slug = 'barberia-denia';

update public.projects
set
  status = 'in_progress',
  progress_percentage = 70,
  progress_note = 'Arquitectura y visual final completados. Pendiente QA y ajustes finales.',
  progress_label = 'Fase final de implementación',
  project_orientation = 'Ecommerce premium',
  what_was_done = 'Diseño base de tienda, flujo de compra y estructura de contenido comercial.',
  services_applied = array['Diseño ecommerce', 'UX/UI', 'Arquitectura de conversión'],
  preview_mode = 'auto',
  preview_image_url = '/og-cover.svg',
  live_url = 'https://ellaboutique.es/',
  website_url = 'https://ellaboutique.es/'
where slug = 'ella-boutique';

update public.projects
set
  status = 'in_progress',
  progress_percentage = 55,
  progress_note = 'Estructura principal terminada. En refinado de contenido y revisión funcional.',
  progress_label = 'En desarrollo activo',
  project_orientation = 'Web corporativa de servicios',
  what_was_done = 'Base técnica y estructura principal completadas con enfoque en claridad comercial.',
  services_applied = array['Estrategia digital', 'Diseño web', 'Implementación frontend'],
  preview_mode = 'auto',
  preview_image_url = '/og-cover.svg',
  live_url = 'https://experio.es/',
  website_url = 'https://experio.es/'
where slug = 'experio';

update public.projects
set
  status = 'in_progress',
  progress_percentage = 65,
  progress_note = 'Bloques clave completados. Falta pulido de mensajes y ajustes de lanzamiento.',
  progress_label = 'En fase de pulido',
  project_orientation = 'Producto digital B2B',
  what_was_done = 'Narrativa de producto, jerarquía de valor y estructura de captación implementadas.',
  services_applied = array['UX de producto', 'Estrategia de contenido', 'Diseño web premium'],
  preview_mode = 'auto',
  preview_image_url = '/og-cover.svg',
  live_url = 'https://factuclin.com/',
  website_url = 'https://factuclin.com/'
where slug = 'factuclin';

commit;
