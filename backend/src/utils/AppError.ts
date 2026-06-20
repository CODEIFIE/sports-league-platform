export class AppError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
  static badRequest(msg = 'Bad request', d?: unknown) { return new AppError(400, msg, d); }
  static unauthorized(msg = 'Unauthorized') { return new AppError(401, msg); }
  static forbidden(msg = 'Forbidden') { return new AppError(403, msg); }
  static notFound(msg = 'Not found') { return new AppError(404, msg); }
  static conflict(msg = 'Conflict') { return new AppError(409, msg); }
}
