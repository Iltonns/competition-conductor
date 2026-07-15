import { z } from "zod";

const optionalText = (limit: number) => z.string().trim().max(limit).optional().or(z.literal(""));
const optionalUrl = z.string().trim().url("Informe uma URL válida.").optional().or(z.literal(""));

export const teamSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da equipe.").max(120),
  short_name: optionalText(60),
  abbreviation: z
    .string()
    .trim()
    .max(10, "Use no máximo 10 caracteres.")
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens.")
    .optional()
    .or(z.literal("")),
  crest_url: optionalUrl,
  cover_url: optionalUrl,
  primary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal.")
    .optional()
    .or(z.literal("")),
  secondary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal.")
    .optional()
    .or(z.literal("")),
  city: optionalText(100),
  state: optionalText(2),
  neighborhood: optionalText(100),
  foundation_year: z.union([
    z.literal(""),
    z.coerce.number().int().min(1800).max(new Date().getFullYear()),
  ]),
  category: optionalText(60),
  gender: optionalText(30),
  description: optionalText(1200),
  history: optionalText(5000),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  email: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
  instagram: optionalText(120),
  facebook: optionalText(200),
  website: optionalUrl,
  registration_number: optionalText(80),
  internal_notes: optionalText(2000),
});

export type TeamFormValues = z.infer<typeof teamSchema>;
