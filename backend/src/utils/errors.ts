/**
 * Hierarchia błędów aplikacji — dzięki temu centralny error handler
 * potrafi mapować je na odpowiednie kody HTTP i strukturalne odpowiedzi.
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Nieprawidłowe żądanie.', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Brak autoryzacji.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Brak uprawnień.') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Nie znaleziono.') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Konflikt zasobu.', details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Plik za duży.') {
    super(413, 'PAYLOAD_TOO_LARGE', message);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Nieobsługiwany format pliku.') {
    super(415, 'UNSUPPORTED_MEDIA_TYPE', message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Zbyt wiele żądań — spróbuj za chwilę.') {
    super(429, 'TOO_MANY_REQUESTS', message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Usługa tymczasowo niedostępna.') {
    super(503, 'SERVICE_UNAVAILABLE', message);
  }
}
