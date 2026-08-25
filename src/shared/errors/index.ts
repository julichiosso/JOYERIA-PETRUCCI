// src/shared/errors/index.ts

export class AppError extends Error {
  statusCode: number;
  reason?: string;
  meta?: Record<string, unknown>;

  constructor(message: string, statusCode: number, meta?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.meta = meta;
    if (meta?.reason) this.reason = meta.reason as string;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 400, meta);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 404, meta);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 403, meta);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 409, meta);
  }
}