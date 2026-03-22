export type PortfolioProject = {
  companyLogoUrl?: string;
  status?: "completed" | "in_progress";
  progressPercentage?: number;
  progressLabel?: string;
  progressNote?: string;
  projectOrientation?: string;
  whatWasDone?: string;
  servicesApplied?: string[];
  previewMode?: "embed" | "image" | "external_only";
  previewImageUrl?: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  heroImage?: string;
  websiteUrl?: string;
  gallery: string[];
  year?: string;
  services: string[];
  featured: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
  logoUrl?: string;
};

export type SiteContent = {
  metadata: {
    title: string;
    description: string;
  };
  nav: {
    brand: string;
    links: Array<{ label: string; href: string }>;
    copyEmail: string;
    contactWhatsapp: string;
  };
  hero: {
    label: string;
    marqueeText: string;
    paragraph: string;
    disciplines: string[];
    media: {
      type: "video" | "image";
      videoSrc?: string;
      imageSrc?: string;
      posterSrc?: string;
      fallbackColor?: string;
      overlayOpacity?: number;
    };
  };
  works: {
    homeHeading: string;
    homeIntro: string;
    pageHeading: string;
    pageIntro: string;
  };
  showreel: {
    heading: string;
    caption: string;
    videoSrc: string;
    posterSrc?: string;
    overlayOpacity?: number;
  };
  aboutStudio: {
    heading: string;
    paragraphs: string[];
  };
  expertise: {
    heading: string;
    intro: string;
    items: string[];
  };
  gallery: {
    heading: string;
    images: Array<{ src: string; alt: string }>;
  };
  contact: {
    heading: string;
    intro: string;
    email: string;
    contactLabel: string;
    copyEmail: string;
    whatsappLabel: string;
    socials: SocialLink[];
  };
  footer: {
    brandLine: string;
    copyright: string;
  };
};
