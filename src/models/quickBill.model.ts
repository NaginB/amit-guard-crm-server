import { Schema, model } from "mongoose";
import { IQuickBill } from "../interfaces/quickBill.interface";
import { getNextSequence } from "./counter.model";

const quickBillSchema = new Schema<IQuickBill>(
  {
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    amountPerDay: {
      type: Number,
      required: [true, "Amount per day is required"],
    },
    totalDays: {
      type: Number,
      required: [true, "Total days is required"],
    },
    totalAmount: {
      type: Number,
    },
    billNumber: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

quickBillSchema.pre("save", async function (next) {
  // Calculate total amount
  if (this.amountPerDay && this.totalDays) {
    this.totalAmount = this.amountPerDay * this.totalDays;
  }
  
  // Generate Bill Number
  if (!this.billNumber) {
    try {
      const seq = await getNextSequence("quickBillId");
      // Format: QB-0001
      this.billNumber = `QB-${seq.toString().padStart(4, "0")}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

const QuickBill = model<IQuickBill>("QuickBill", quickBillSchema);

export default QuickBill;
