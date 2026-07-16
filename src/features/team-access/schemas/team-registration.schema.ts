import { z } from "zod";

export const registrationSectionSchema = z.object({
  section: z.enum(["team", "responsibles", "staff", "athletes", "documents"]),
  value: z.unknown(),
  markComplete: z.boolean().default(false),
});

export const registrationUploadSchema = z.object({
  name: z.string().trim().min(1).max(180),
  mimeType: z.enum([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]),
  base64: z.string().min(1).max(14_000_000),
});

const cleanText = (max: number) => z.string().trim().max(max);
export const registrationTeamSchema = z.object({
  name: cleanText(120).min(2),
  shortName: cleanText(80),
  abbreviation: cleanText(10),
  city: cleanText(100),
  state: cleanText(2),
  neighborhood: cleanText(100),
  category: cleanText(80),
  gender: cleanText(40),
  foundationYear: cleanText(4),
  phone: cleanText(30),
  whatsapp: cleanText(30),
  email: cleanText(160),
  instagram: cleanText(160),
  crestUrl: cleanText(1000),
  coverUrl: cleanText(1000),
});

export const registrationPersonSchema = z.object({
  id: z.string().min(1).max(80),
  fullName: cleanText(160).min(3),
  role: cleanText(80).min(2),
  phone: cleanText(30),
  email: cleanText(160),
  isPrimary: z.boolean().optional(),
});

export const registrationAthleteSchema = z.object({
  id: z.string().min(1).max(80),
  fullName: cleanText(160).min(3),
  birthDate: cleanText(10),
  documentNumber: cleanText(40),
  position: cleanText(60),
  shirtNumber: cleanText(3),
  isCaptain: z.boolean(),
  isGoalkeeper: z.boolean(),
});

export const registrationDocumentSchema = z.object({
  id: z.string().min(1).max(80),
  name: cleanText(180).min(1),
  path: cleanText(500).min(1),
  mimeType: cleanText(80),
  size: z.number().int().min(1).max(10_485_760),
  uploadedAt: z.string().datetime(),
});
