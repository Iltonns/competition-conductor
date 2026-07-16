export const REGISTRATION_STEP_IDS = [
  "team",
  "responsibles",
  "staff",
  "athletes",
  "documents",
  "review",
] as const;

export type RegistrationStepId = (typeof REGISTRATION_STEP_IDS)[number];

export interface RegistrationPerson {
  id: string;
  fullName: string;
  role: string;
  phone: string;
  email: string;
  isPrimary?: boolean;
}

export interface RegistrationAthlete {
  id: string;
  fullName: string;
  birthDate: string;
  documentNumber: string;
  position: string;
  shirtNumber: string;
  isCaptain: boolean;
  isGoalkeeper: boolean;
}

export interface RegistrationDocument {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface RegistrationTeamDetails {
  name: string;
  shortName: string;
  abbreviation: string;
  city: string;
  state: string;
  neighborhood: string;
  category: string;
  gender: string;
  foundationYear: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  crestUrl: string;
  coverUrl: string;
}

export interface TeamRegistrationPayload {
  team: RegistrationTeamDetails;
  responsibles: RegistrationPerson[];
  staff: RegistrationPerson[];
  athletes: RegistrationAthlete[];
  documents: RegistrationDocument[];
}

export interface TeamRegistrationDraft {
  payload: TeamRegistrationPayload;
  completedSteps: RegistrationStepId[];
  status: "draft" | "submitted" | "changes_requested" | "approved";
  version: number;
  updatedAt: string | null;
  submittedAt: string | null;
}
