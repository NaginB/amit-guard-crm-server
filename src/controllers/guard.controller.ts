import { Request, Response, NextFunction } from "express";
import * as guardService from "../services/guard.service";
import { AppError } from "../utils/AppError";
import ResponseHandler from "../utils/responseHandler";

export const createGuardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guard, password } = await guardService.createGuard(req.body);
    ResponseHandler.created(
      res,
      { guard, password },
      "Guard created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getAllGuardsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const guards = await guardService.getAllGuards();
    ResponseHandler.success(
      res,
      { guards, results: guards.length },
      "Guards retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getGuardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const guard = await guardService.getGuardById(req.params.guardId!);
    if (!guard) {
      return next(new AppError("Guard not found", 404));
    }
    ResponseHandler.success(res, { guard }, "Guard retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const updateGuardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const guard = await guardService.updateGuardById(
      req.params.guardId!,
      req.body
    );
    ResponseHandler.success(res, { guard }, "Guard updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteGuardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await guardService.deleteGuardById(req.params.guardId!);
    ResponseHandler.success(res, null, "Guard deleted successfully");
  } catch (error) {
    next(error);
  }
};
