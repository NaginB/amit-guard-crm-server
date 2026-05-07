import { Request, Response, NextFunction } from "express";
import { SalarySlipService } from "../services/salarySlip.service";
import { AppError } from "../utils/AppError";
import { ResponseHandler } from "../utils/responseHandler";

export class SalarySlipController {
  // Generate salary slip for a guard
  static async generateSalarySlip(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { guardId, siteId } = req.params;
      const { year, month } = req.query;

      if (!guardId || !siteId) {
        throw new AppError("Guard ID and Site ID are required", 400);
      }

      const targetYear = parseInt(year as string) || new Date().getFullYear();
      const targetMonth =
        parseInt(month as string) || new Date().getMonth() + 1;

      const salarySlip = await SalarySlipService.generateSalarySlip(
        guardId,
        siteId,
        targetYear,
        targetMonth
      );

      ResponseHandler.success(
        res,
        salarySlip,
        "Salary slip generated successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}

