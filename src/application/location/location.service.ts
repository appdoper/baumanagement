import type { Location } from "@/domain/location/location.entity";
import type { LocationRepository } from "@/domain/location/location.repository";
import { parseOrThrow } from "@/application/shared/validate";
import {
  createLocationSchema,
  type CreateLocationInput,
} from "./location.dto";

export class LocationService {
  constructor(private readonly locations: LocationRepository) {}

  list(): Promise<Location[]> {
    return this.locations.findAll();
  }

  async create(input: CreateLocationInput): Promise<Location> {
    const data = parseOrThrow(
      createLocationSchema,
      input,
      "Ungültiger Standort.",
    );
    return this.locations.create(data.name);
  }

  async delete(id: string): Promise<void> {
    await this.locations.delete(id);
  }
}
