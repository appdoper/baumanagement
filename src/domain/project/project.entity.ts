export interface Project {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  /** Ids of the Standort (location) tags attached to this project. */
  locationIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
