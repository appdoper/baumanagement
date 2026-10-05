"use server";

import { revalidatePath } from "next/cache";
import { locationService } from "@/container";
import type { Location } from "@/domain/location/location.entity";
import { toActionError, type ActionResult } from "./result";

export async function createLocationAction(
  name: string,
): Promise<ActionResult<Location>> {
  try {
    const location = await locationService.create({ name });
    revalidatePath("/", "layout");
    return { ok: true, data: location };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteLocationAction(
  id: string,
): Promise<ActionResult> {
  try {
    await locationService.delete(id);
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return toActionError(e);
  }
}
