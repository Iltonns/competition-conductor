import type { OrganizationPublicPageInput } from "../types/organization-public-page.types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeOrganizationSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function validateOrganizationPublicPage(input: OrganizationPublicPageInput): string | null {
  if (input.slug.length < 3 || input.slug.length > 80 || !slugPattern.test(input.slug)) {
    return "Use um endereço de 3 a 80 caracteres, com letras minúsculas, números e hífens.";
  }
  if (input.headline && (input.headline.length < 3 || input.headline.length > 160)) {
    return "O título deve ter entre 3 e 160 caracteres.";
  }
  if (input.description && input.description.length > 2000) {
    return "A descrição deve ter no máximo 2.000 caracteres.";
  }
  for (const url of Object.values(input.social_links)) {
    if (url && !isSecureUrl(url)) return "Todos os links públicos devem usar HTTPS.";
  }
  return null;
}

function isSecureUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
