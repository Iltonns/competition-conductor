import type {
  OrganizationProfileInput,
  OrganizationRole,
} from "../types/organization-settings.types";

export function validateOrganizationProfile(profile: OrganizationProfileInput): string | null {
  if (profile.name.trim().length < 3 || profile.name.trim().length > 120) {
    return "Informe um nome entre 3 e 120 caracteres.";
  }
  if (profile.website_url && !isSecureUrl(profile.website_url)) {
    return "O website deve usar HTTPS.";
  }
  if (profile.logo_url && !isSecureUrl(profile.logo_url)) {
    return "A URL do logo deve usar HTTPS.";
  }
  return null;
}

export function assignableRoles(
  actorRole: "owner" | "admin",
  includeOwner = false,
): OrganizationRole[] {
  if (actorRole === "admin") return ["editor", "viewer"];
  return includeOwner ? ["owner", "admin", "editor", "viewer"] : ["admin", "editor", "viewer"];
}

function isSecureUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
