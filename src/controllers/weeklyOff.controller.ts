import { Request, Response, NextFunction } from "express";
import { WeeklyOffService } from "../services/weeklyOff.service";
import { ResponseHandler } from "../utils/responseHandler";
import { AppError } from "../utils/AppError";

export class WeeklyOffController {
  // Create or update weekly off configuration
  static async upsertWeeklyOff(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { guardId, projectId, siteId, weeklyOffDays } = req.body;

      if (!guardId || !projectId || !siteId || !weeklyOffDays) {
        throw new AppError("Guard ID, Project ID, Site ID, and Weekly Off Days are required", 400);
      }

      if (!Array.isArray(weeklyOffDays)) {
        throw new AppError("Weekly off days must be an array", 400);
      }

      const weeklyOff = await WeeklyOffService.upsertWeeklyOff({
        guardId,
        projectId,
        siteId,
        weeklyOffDays,
      });

      ResponseHandler.success(
        res,
        weeklyOff,
        "Weekly off configuration saved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get weekly off configuration
  static async getWeeklyOff(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { guardId, projectId } = req.params;

      if (!guardId || !projectId) {
        throw new AppError("Guard ID and Project ID are required", 400);
      }

      const weeklyOff = await WeeklyOffService.getWeeklyOff(guardId, projectId);

      ResponseHandler.success(
        res,
        weeklyOff || { weeklyOffDays: [] },
        "Weekly off configuration retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Update weekly off configuration
  static async updateWeeklyOff(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { guardId, projectId } = req.params;
      const { weeklyOffDays } = req.body;

      if (!guardId || !projectId) {
        throw new AppError("Guard ID and Project ID are required", 400);
      }

      if (!Array.isArray(weeklyOffDays)) {
        throw new AppError("Weekly off days must be an array", 400);
      }

      const weeklyOff = await WeeklyOffService.updateWeeklyOff(
        guardId,
        projectId,
        { weeklyOffDays }
      );

      ResponseHandler.success(
        res,
        weeklyOff,
        "Weekly off configuration updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Delete weekly off configuration
  static async deleteWeeklyOff(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { guardId, projectId } = req.params;

      if (!guardId || !projectId) {
        throw new AppError("Guard ID and Project ID are required", 400);
      }

      await WeeklyOffService.deleteWeeklyOff(guardId, projectId);

      ResponseHandler.success(
        res,
        null,
        "Weekly off configuration deleted successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}

