import type { Location } from "@/domain/location/location.entity";
import type { LocationRepository } from "@/domain/location/location.repository";
import { prisma } from "./client";
import { toLocation } from "./mappers";

export class PrismaLocationRepository implements LocationRepository {
  async findAll(): Promise<Location[]> {
    const rows = await prisma.location.findMany({ orderBy: { name: "asc" } });
    return rows.map(toLocation);
  }

  async create(name: string): Promise<Location> {
    const row = await prisma.location.create({ data: { name } });
    return toLocation(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.location.delete({ where: { id } });
  }
}
