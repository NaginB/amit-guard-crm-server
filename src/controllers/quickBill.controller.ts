import { Request, Response, NextFunction } from "express";
import QuickBill from "../models/quickBill.model";
import { AppError } from "../utils/AppError";
import ResponseHandler from "../utils/responseHandler";

export const createQuickBill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { address, amountPerDay, totalDays } = req.body;
    
    const quickBill = await QuickBill.create({
      address,
      amountPerDay,
      totalDays,
    });
    
    ResponseHandler.created(res, { quickBill }, "Quick bill created successfully");
  } catch (error) {
    next(error);
  }
};

export const getAllQuickBills = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const quickBills = await QuickBill.find().sort("-createdAt");
    
    ResponseHandler.success(
      res,
      { quickBills, results: quickBills.length },
      "Quick bills retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getQuickBill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const quickBill = await QuickBill.findById(req.params.id);
    if (!quickBill) {
      return next(new AppError("Quick bill not found", 404));
    }
    ResponseHandler.success(res, { quickBill }, "Quick bill retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const updateQuickBill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { address, amountPerDay, totalDays } = req.body;
    
    const quickBill = await QuickBill.findById(req.params.id);
    
    if (!quickBill) {
      return next(new AppError("Quick bill not found", 404));
    }

    if (address !== undefined) quickBill.address = address;
    if (amountPerDay !== undefined) quickBill.amountPerDay = amountPerDay;
    if (totalDays !== undefined) quickBill.totalDays = totalDays;

    await quickBill.save();
    
    ResponseHandler.success(res, { quickBill }, "Quick bill updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteQuickBill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const quickBill = await QuickBill.findByIdAndDelete(req.params.id);
    if (!quickBill) {
      return next(new AppError("Quick bill not found", 404));
    }
    ResponseHandler.success(res, null, "Quick bill deleted successfully");
  } catch (error) {
    next(error);
  }
};
