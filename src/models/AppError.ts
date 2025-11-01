class AppError extends Error {
  public readonly status: number;
  public readonly isOperational: boolean;

  constructor(message: string, status: number, isOperational: boolean = true) {
    super(message);
    this.status = status;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // Static factory methods for common errors
  static badRequest(message: string = "Bad Request") {
    return new AppError(message, 400);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new AppError(message, 401);
  }

  static forbidden(message: string = "Forbidden") {
    return new AppError(message, 403);
  }

  static notFound(message: string = "Resource not found") {
    return new AppError(message, 404);
  }

  static conflict(message: string = "Conflict") {
    return new AppError(message, 409);
  }

  static internal(message: string = "Internal Server Error") {
    return new AppError(message, 500, false);
  }
}

export default AppError;
