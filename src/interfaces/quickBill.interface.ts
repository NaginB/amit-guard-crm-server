import { Document } from "mongoose";

export interface IQuickBill extends Document {
  address: string;
  amountPerDay: number;
  totalDays: number;
  totalAmount: number;
  billNumber: string;
  createdAt: Date;
  updatedAt: Date;
}
