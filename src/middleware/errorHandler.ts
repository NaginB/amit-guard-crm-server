import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import ResponseHandler from "../utils/responseHandler";

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
  // Try to extract offending key/value for clearer message
  const key = err?.keyValue ? Object.keys(err.keyValue)[0] : undefined;
  const value = key && err.keyValue ? err.keyValue[key] : undefined;
  const message = key
    ? `Duplicate ${key}: ${value}`
    : "Duplicate field value. Please use another value.";
  return new AppError(message, 409);
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err: AppError, res: Response) => {
  ResponseHandler.error(res, err.message, err.statusCode, err, err.stack);
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    ResponseHandler.error(res, err.message, err.statusCode);
  } else {
    console.error("ERROR 💥", err);
    ResponseHandler.internalError(res, "Something went very wrong!");
  }
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const env = process.env.NODE_ENV;
  if (env === "development" || !env) {
    return sendErrorDev(err, res);
  }

  let error: any = { ...err };
  error.message = err.message;

  if (error.name === "CastError") error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === "ValidationError") error = handleValidationErrorDB(error);

  return sendErrorProd(error, res);
};
