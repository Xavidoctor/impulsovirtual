export type UUID = string;
export type ISODateTime = string;

export type AdminRole = "admin" | "editor";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "closed_won"
  | "closed_lost"
  | "spam";
export type QuoteRequestStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost";
export type ProjectStatus = "completed" | "in_progress";

export type ServiceEntity = {
  id: UUID;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string;
  full_description: string;
  cover_image_url: string | null;
  icon_name: string | null;
  featured: boolean;
  sort_order: number;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type ProjectEntity = {
  id: UUID;
  slug: string;
  title: string;
  client_name: string | null;
  excerpt: string;
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  cover_image_url: string | null;
  company_logo_url: string | null;
  website_url: string | null;
  live_url: string | null;
  featured: boolean;
  status: ProjectStatus;
  progress_percentage: number | null;
  progress_label: string | null;
  progress_note: string | null;
  project_orientation: string | null;
  what_was_done: string | null;
  services_applied: string[];
  preview_mode: "embed" | "image";
  preview_image_url: string | null;
  is_published: boolean;
  published_at: ISODateTime | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type ProjectMediaEntity = {
  id: UUID;
  project_id: UUID;
  file_url: string;
  alt: string | null;
  caption: string | null;
  sort_order: number;
  created_at: ISODateTime;
};

export type TestimonialEntity = {
  id: UUID;
  name: string;
  company: string | null;
  role: string | null;
  quote: string;
  avatar_url: string | null;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: ISODateTime;
};

export type FAQEntity = {
  id: UUID;
  category: string | null;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  created_at: ISODateTime;
};

export type BlogCategoryEntity = {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
};

export type BlogPostEntity = {
  id: UUID;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  category_id: UUID | null;
  author_name: string | null;
  is_featured: boolean;
  is_published: boolean;
  published_at: ISODateTime | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type LeadEntity = {
  id: UUID;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service_interest: string | null;
  message: string;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type QuoteRequestEntity = {
  id: UUID;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  project_type: string | null;
  requested_services: string[];
  budget_range: string | null;
  deadline: string | null;
  project_summary: string;
  references: string | null;
  status: QuoteRequestStatus;
  notes: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type SiteSettingsEntity = {
  id: UUID;
  business_name: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_primary: string | null;
  hero_cta_secondary: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_url: string | null;
  location: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  behance_url: string | null;
  default_seo_title: string | null;
  default_seo_description: string | null;
  default_og_image_url: string | null;
  updated_at: ISODateTime;
};

export type AdminProfileEntity = {
  id: UUID;
  user_id: UUID;
  email: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  last_login_at: ISODateTime | null;
  created_at: ISODateTime;
};

export type AdminPanelSettingsEntity = {
  id: UUID;
  contact_notification_email: string;
  contact_notifications_enabled: boolean;
  contact_auto_reply_enabled: boolean;
  contact_auto_reply_subject: string;
  contact_auto_reply_body: string;
  alerts_enabled: boolean;
  vercel_plan: string;
  supabase_plan: string;
  r2_plan_mode: string;
  email_provider: string;
  usage_warning_threshold: number;
  usage_danger_threshold: number;
  email_daily_limit: number | null;
  email_monthly_limit: number | null;
  updated_at: ISODateTime;
};
