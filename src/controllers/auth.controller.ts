import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import ResponseHandler from "../utils/responseHandler";

export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    if (result.success) {
      return ResponseHandler.success(
        res,
        { token: result.token },
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

export const getMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return ResponseHandler.error(res, "User not found", 404);
    }
    return ResponseHandler.success(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "User details retrieved successfully"
    );
  } catch (error: any) {
    return ResponseHandler.error(
      res,
      error.message || "An unexpected error occurred",
      500
    );
  }
};

