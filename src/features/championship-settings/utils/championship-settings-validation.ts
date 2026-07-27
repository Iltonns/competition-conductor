import type { ChampionshipIdentityInput } from "../api/championship-settings";

export function validateChampionshipIdentity(identity: ChampionshipIdentityInput): string | null {
  if (identity.name.trim().length < 3) {
    return "Informe um nome com pelo menos 3 caracteres.";
  }
  if (identity.starts_at && identity.ends_at && identity.ends_at < identity.starts_at) {
    return "A data final não pode ser anterior à data inicial.";
  }
  if (identity.website_url && !isSecureUrl(identity.website_url)) {
    return "O website deve usar HTTPS.";
  }
  if (identity.instagram_url && !isSecureUrl(identity.instagram_url)) {
    return "O Instagram deve usar HTTPS.";
  }
  return null;
}

export function isDangerConfirmationValid(
  confirmation: string,
  championshipName: string,
  reason: string,
) {
  const reasonLength = reason.trim().length;
  return confirmation === championshipName && reasonLength >= 10 && reasonLength <= 1000;
}

function isSecureUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
