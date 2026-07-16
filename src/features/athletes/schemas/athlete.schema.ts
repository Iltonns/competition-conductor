import { z } from "zod";
export const athleteSchema = z.object({
  full_name: z.string().trim().min(3, "Informe o nome completo."),
  birth_date: z.string().optional(),
  document_type: z.string().optional(),
  document_number: z.string().max(30).optional(),
  photo_url: z.string().url().or(z.literal("")).optional(),
  shirt_number: z.coerce.number().int().min(0).max(999).optional(),
  position: z.string().max(60).optional(),
  is_goalkeeper: z.boolean().optional(),
  is_captain: z.boolean().optional(),
});
