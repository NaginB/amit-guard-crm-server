import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import Guard from "../models/guard.model";

export const guardProtect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const currentGuard = await Guard.findById(decoded.id);
    if (!currentGuard) {
      return next(
        new AppError(
          "The guard belonging to this token does no longer exist.",
          401
        )
      );
    }

    // Check if the decoded role is guard
    if (decoded.role !== "guard") {
      return next(
        new AppError("Invalid token. This endpoint is for guards only.", 401)
      );
    }

    // Attach guard info to request
    (req as any).guard = currentGuard;
    (req as any).guardId = decoded.guardId;

    next();
  } catch (error) {
    return next(new AppError("Invalid token. Please log in again.", 401));
  }
};

