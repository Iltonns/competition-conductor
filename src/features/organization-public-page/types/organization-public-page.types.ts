export type OrganizationSocialNetwork = "instagram" | "facebook" | "youtube" | "linkedin";

export interface OrganizationPublicPageSettings {
  organization_id: string;
  organization_name: string;
  organization_logo_url: string | null;
  slug: string;
  headline: string | null;
  description: string | null;
  social_links: Partial<Record<OrganizationSocialNetwork, string>>;
  show_contact_email: boolean;
  show_contact_phone: boolean;
  is_public: boolean;
  published_at: string | null;
}

export type OrganizationPublicPageInput = Pick<
  OrganizationPublicPageSettings,
  "slug" | "headline" | "description" | "social_links" | "show_contact_email" | "show_contact_phone"
>;

export interface PublicOrganizationChampionship {
  id: string;
  name: string;
  slug: string;
  season: string | null;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  cover_url: string | null;
}

export interface PublicOrganizationPortal {
  organization: {
    name: string;
    slug: string;
    logo_url: string | null;
    headline: string | null;
    description: string;
    city: string | null;
    state: string | null;
    website_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    social_links: Partial<Record<OrganizationSocialNetwork, string>>;
  };
  championships: PublicOrganizationChampionship[];
}
