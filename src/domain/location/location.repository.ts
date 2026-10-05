import type { Location } from "./location.entity";

/**
 * Port (domain boundary) for Standort master data. Infrastructure provides the
 * Prisma implementation.
 */
export interface LocationRepository {
  findAll(): Promise<Location[]>;
  create(name: string): Promise<Location>;
  delete(id: string): Promise<void>;
}
