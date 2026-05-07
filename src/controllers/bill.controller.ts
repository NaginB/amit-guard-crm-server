import { Request, Response, NextFunction } from "express";
import { BillService } from "../services/bill.service";
import { EmailService } from "../services/email.service";
import { AppError } from "../utils/AppError";
import { ResponseHandler } from "../utils/responseHandler";
import {
  GenerateBillRequest,
  SendBillEmailRequest,
} from "../interfaces/bill.interface";

export class BillController {
  // Generate bill for a project
  static async generateBill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const { year, month, tax, notes, guardId } = req.body;

      if (!projectId) {
        throw new AppError("Project ID is required", 400);
      }

      const targetYear = parseInt(year) || new Date().getFullYear();
      const targetMonth = parseInt(month) || new Date().getMonth() + 1;

      const billData: GenerateBillRequest = {
        projectId,
        year: targetYear,
        month: targetMonth,
        ...(guardId && { guardId }),
        ...(tax !== undefined && { tax: parseFloat(tax) }),
        ...(notes && { notes }),
      };

      const createdBy = (req as any).user?.id || "system";

      const bill = await BillService.generateBill(billData, createdBy);

      ResponseHandler.success(res, bill, "Bill generated successfully");
    } catch (error) {
      next(error);
    }
  }

  // Get bill by ID
  static async getBillById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { billId } = req.params;

      if (!billId) {
        throw new AppError("Bill ID is required", 400);
      }

      const bill = await BillService.getBillById(billId);

      ResponseHandler.success(res, bill, "Bill retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  // Get all bills for a project
  static async getBillsByProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    console.log("sdfsdfjn");
    try {
      const { projectId } = req.params;

      if (!projectId) {
        throw new AppError("Project ID is required", 400);
      }

      const bills = await BillService.getBillsByProject(projectId);

      ResponseHandler.success(res, bills, "Bills retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  // Update bill status
  static async updateBillStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { billId } = req.params;
      const { status } = req.body;

      if (!billId) {
        throw new AppError("Bill ID is required", 400);
      }

      if (!status || !["Pending", "Overdue", "Hold", "Paid"].includes(status)) {
        throw new AppError("Valid status is required", 400);
      }

      const bill = await BillService.updateBillStatus(billId, status);

      ResponseHandler.success(res, bill, "Bill status updated successfully");
    } catch (error) {
      next(error);
    }
  }

  // Update bill details
  static async updateBillDetails(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { billId } = req.params;
      const { tax, notes } = req.body;

      if (!billId) {
        throw new AppError("Bill ID is required", 400);
      }

      if (tax !== undefined && (isNaN(tax) || tax < 0)) {
        throw new AppError("Tax must be a valid non-negative number", 400);
      }

      const bill = await BillService.updateBillDetails(billId, { tax, notes });

      ResponseHandler.success(res, bill, "Bill updated successfully");
    } catch (error) {
      next(error);
    }
  }

  // Delete bill
  static async deleteBill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { billId } = req.params;

      if (!billId) {
        throw new AppError("Bill ID is required", 400);
      }

      await BillService.deleteBill(billId);

      ResponseHandler.success(res, null, "Bill deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // Send bill via email
  static async sendBillEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { billId } = req.params;
      const { recipientEmail, subject, message } = req.body;

      if (!billId) {
        throw new AppError("Bill ID is required", 400);
      }

      if (!recipientEmail) {
        throw new AppError("Recipient email is required", 400);
      }

      // Get bill data
      const bill = await BillService.getBillById(billId);

      // Send email (PDF attachment will be handled by frontend if needed)
      await EmailService.sendBillEmail(
        recipientEmail,
        bill,
        undefined, // PDF buffer can be added later if needed
        message,
      );

      // Update bill status to "Pending" (after sending, it's pending payment)
      await BillService.updateBillStatus(billId, "Pending");

      ResponseHandler.success(res, null, "Bill sent via email successfully");
    } catch (error) {
      next(error);
    }
  }
}
