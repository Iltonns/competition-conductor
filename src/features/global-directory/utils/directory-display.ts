import type { CompetitiveParticipation } from "../types/global-directory.types";

export function participationLabel(participation: CompetitiveParticipation) {
  return `${participation.championship_name} · ${participation.team_name}`;
}

export function totalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function ageFromBirthDate(birthDate: string | null, today = new Date()) {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split("-").map(Number);
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age -= 1;
  }
  return age;
}
