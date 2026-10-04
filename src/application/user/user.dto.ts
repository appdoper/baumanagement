import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name darf nicht leer sein.").max(100).nullish(),
  email: z.string().trim().toLowerCase().email("Ungültige E-Mail-Adresse.").max(254),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Enforced wherever a user sets their OWN password. Admin-generated reset
 * passwords are deliberately exempt (temporary, shown once, changed on login).
 */
export const passwordSchema = z
  .string()
  .min(8, "Mindestens 8 Zeichen.")
  .max(128, "Höchstens 128 Zeichen.")
  .regex(/[A-Z]/, "Mindestens ein Großbuchstabe.")
  .regex(/[a-z]/, "Mindestens ein Kleinbuchstabe.")
  .regex(/[0-9]/, "Mindestens eine Zahl.")
  .regex(/[^A-Za-z0-9]/, "Mindestens ein Sonderzeichen.");

export const changePasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwörter stimmen nicht überein.",
    path: ["confirm"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
