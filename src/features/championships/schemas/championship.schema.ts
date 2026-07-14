import { z } from "zod";

const optionalDate = z
  .string()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(`${value}T00:00:00`)), {
    message: "Informe uma data válida",
  });

export const championshipSchema = z
  .object({
    name: z.string().trim().min(3, "O nome deve ter no mínimo 3 caracteres"),
    season: z.string().trim().max(40, "A temporada deve ter no máximo 40 caracteres"),
    description: z.string().trim().max(2_000, "A descrição deve ter no máximo 2.000 caracteres"),
    starts_at: optionalDate,
    ends_at: optionalDate,
    is_public: z.boolean(),
    status: z.enum(["draft", "active", "finished", "archived"]),
  })
  .superRefine(({ starts_at, ends_at }, context) => {
    if (starts_at && ends_at && ends_at < starts_at) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "A data final não pode ser anterior à data inicial",
      });
    }
  });

export type ChampionshipFormValues = z.infer<typeof championshipSchema>;
