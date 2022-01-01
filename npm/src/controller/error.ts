export class JacksonError extends Error {
  public name: string;
  public statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
