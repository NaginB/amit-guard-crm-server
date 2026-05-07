import { Request, Response, NextFunction } from "express";
import * as guardAuthService from "../services/guardAuth.service";
import ResponseHandler from "../utils/responseHandler";

export const guardLoginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactNumber, password } = req.body;

    const result = await guardAuthService.guardLogin(contactNumber, password);

    if (result.success) {
      return ResponseHandler.success(
        res,
        { token: result.token, guard: result.guard },
        "Login successful"
      );
    } else {
      return ResponseHandler.error(res, result.error, result.statusCode);
    }
  } catch (error: any) {
    return ResponseHandler.error(
      res,
      error.message || "An unexpected error occurred",
      500
    );
  }
};

