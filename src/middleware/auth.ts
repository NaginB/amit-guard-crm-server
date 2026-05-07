import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import Admin from "../models/admin.model";
import Guard from "../models/guard.model";

export const protect = async (
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

    // Check if token belongs to an admin or guard
    if (decoded.role === "guard") {
      const currentGuard = await Guard.findById(decoded.id);
      if (!currentGuard) {
        return next(
          new AppError(
            "The guard belonging to this token does no longer exist.",
            401
          )
        );
      }
      // Attach guard info to request
      (req as any).guard = currentGuard;
      (req as any).guardId = decoded.guardId;
    } else {
      // Default to admin authentication
      const currentUser = await Admin.findById(decoded.id);
      if (!currentUser) {
        return next(
          new AppError(
            "The user belonging to this token does no longer exist.",
            401
          )
        );
      }
      // GRANT ACCESS TO PROTECTED ROUTE
      // req.user = currentUser;
    }

    next();
  } catch (error) {
    return next(new AppError("Invalid token. Please log in again.", 401));
  }
};
