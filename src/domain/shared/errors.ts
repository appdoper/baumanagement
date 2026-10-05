export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} mit id "${id}" wurde nicht gefunden.`);
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly issues?: unknown,
  ) {
    super(message);
  }
}

/**
 * Optimistic-concurrency conflict: the record was changed by someone else
 * between read and write (version mismatch).
 */
export class ConflictError extends DomainError {
  constructor(
    message = "Dieser Vorgang wurde in der Zwischenzeit von jemand anderem bearbeitet.",
  ) {
    super(message);
  }
}
