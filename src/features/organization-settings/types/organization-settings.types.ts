export type OrganizationRole = "owner" | "admin" | "editor" | "viewer";

export interface ManageableOrganization {
  id: string;
  name: string;
  logo_url: string | null;
  role: OrganizationRole;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  city: string | null;
  state: string | null;
  timezone: string;
  locale: "pt-BR" | "en-US" | "es-ES";
  plan: string;
  plan_expires_at: string | null;
}

export interface OrganizationMember {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: OrganizationRole;
  joined_at: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: Exclude<OrganizationRole, "owner">;
  status: "pending" | "provisioned" | "revoked" | "expired";
  expires_at: string;
  last_sent_at: string | null;
  send_count: number;
  created_at: string;
}

export interface OrganizationAdminContext {
  organization: OrganizationProfile;
  actor_role: "owner" | "admin";
  actor_user_id: string;
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
}

export type OrganizationProfileInput = Pick<
  OrganizationProfile,
  | "name"
  | "logo_url"
  | "contact_email"
  | "contact_phone"
  | "website_url"
  | "city"
  | "state"
  | "timezone"
  | "locale"
>;
