class JacksonError extends Error {
  constructor(message, statusCode = 200) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { JacksonError };
