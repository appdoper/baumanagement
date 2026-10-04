"use server";

import { revalidatePath } from "next/cache";
import { auth, unstable_update } from "@/auth";
import { userService } from "@/container";
import type { UserRole } from "@/domain/user/user.entity";
import type { ChangePasswordInput } from "@/application/user/user.dto";
import { ValidationError } from "@/domain/shared/errors";
import { toActionError, type ActionResult } from "./result";

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new ValidationError("Keine Berechtigung.");
  }
  return session.user.id;
}

export interface CreateUserActionInput {
  name?: string | null;
  email: string;
  role?: UserRole;
}

export async function createUserAction(
  input: CreateUserActionInput,
): Promise<ActionResult<{ email: string; password: string }>> {
  try {
    await requireAdmin();
    const { user, password } = await userService.create(input);
    revalidatePath("/users");
    return { ok: true, data: { email: user.email, password } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ValidationError("Nicht angemeldet.");
    }
    await userService.changeOwnPassword(session.user.id, input);
    // Refresh the JWT so the proxy stops forcing /change-password.
    await unstable_update({ user: { requiresPasswordChange: false } });
    return { ok: true, data: undefined };
  } catch (e) {
    return toActionError(e);
  }
}

export async function resetUserPasswordAction(
  id: string,
): Promise<ActionResult<{ password: string }>> {
  try {
    await requireAdmin();
    const { password } = await userService.resetPassword(id);
    revalidatePath("/users");
    return { ok: true, data: { password } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  try {
    const adminId = await requireAdmin();
    if (id === adminId) {
      throw new ValidationError(
        "Du kannst deinen eigenen Account nicht löschen.",
      );
    }
    await userService.delete(id);
    revalidatePath("/users");
    return { ok: true, data: undefined };
  } catch (e) {
    return toActionError(e);
  }
}
