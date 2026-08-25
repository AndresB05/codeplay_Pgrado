export class AppError extends Error {
  public readonly code: string;
  public readonly cause?: unknown;

  public constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}
