import { Response } from "express";

export interface ApiResponse<T = any> {
  status: "success" | "error" | "fail";
  message?: string;
  data?: T;
  error?: any;
  stack?: string;
}

export class ResponseHandler {
  /**
   * Send a successful response
   */
  static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      status: "success",
      ...(message && { message }),
      ...(data && { data }),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: any,
    stack?: string
  ): Response {
    const response: ApiResponse = {
      status: statusCode >= 400 && statusCode < 500 ? "fail" : "error",
      message,
      ...(error && { error }),
      ...(stack && { stack }),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201)
   */
  static created<T>(res: Response, data?: T, message?: string): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * Send a not found response (404)
   */
  static notFound(
    res: Response,
    message: string = "Resource not found"
  ): Response {
    return this.error(res, message, 404);
  }

  /**
   * Send an unauthorized response (401)
   */
  static unauthorized(
    res: Response,
    message: string = "Unauthorized access"
  ): Response {
    return this.error(res, message, 401);
  }

  /**
   * Send a forbidden response (403)
   */
  static forbidden(
    res: Response,
    message: string = "Forbidden access"
  ): Response {
    return this.error(res, message, 403);
  }

  /**
   * Send a bad request response (400)
   */
  static badRequest(res: Response, message: string = "Bad request"): Response {
    return this.error(res, message, 400);
  }

  /**
   * Send a validation error response (422)
   */
  static validationError(
    res: Response,
    message: string = "Validation failed",
    errors?: any
  ): Response {
    return this.error(res, message, 422, errors);
  }

  /**
   * Send a conflict response (409)
   */
  static conflict(res: Response, message: string = "Conflict"): Response {
    return this.error(res, message, 409);
  }

  /**
   * Send an internal server error response (500)
   */
  static internalError(
    res: Response,
    message: string = "Internal server error",
    error?: any
  ): Response {
    return this.error(res, message, 500, error);
  }
}

export default ResponseHandler;






























