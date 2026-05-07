import { Schema, model } from "mongoose";
import { IBill } from "../interfaces/bill.interface";
import { getNextSequence } from "./counter.model";

const billSchema = new Schema<IBill>(
  {
    billNumber: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: String,
      required: true,
      ref: "Project",
    },
    siteId: {
      type: String,
      required: true,
      ref: "Site",
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    billingPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    guardAssignments: [
      {
        guardId: {
          type: String,
          required: true,
          ref: "Guard",
        },
        guardName: {
          type: String,
          required: true,
        },
        shiftType: {
          type: String,
          required: true,
        },
        monthlyRate: {
          type: Number,
          required: true,
          min: 0,
        },
        daysWorked: {
          type: Number,
          required: true,
          min: 0,
        },
        workingDays: {
          type: Number,
          required: true,
          min: 0,
        },
        absentDays: {
          type: Number,
          required: true,
          min: 0,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Overdue", "Hold", "Paid"],
      default: "Pending",
    },
    sentAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
// Allow multiple bills per project/month/year for different guards
billSchema.index({ projectId: 1, year: 1, month: 1 }); // Non-unique to allow multiple bills for different guards
billSchema.index({ siteId: 1, year: 1, month: 1 });
billSchema.index({ billNumber: 1 }); // Non-unique index for queries
billSchema.index({ status: 1 });
billSchema.index({ createdAt: -1 });
// Index for checking duplicate bills by guard
billSchema.index({ "guardAssignments.guardId": 1, projectId: 1, year: 1, month: 1 });

// Auto-generate bill number
billSchema.pre("save", async function (next) {
  if (this.isNew && !this.billNumber) {
    try {
      // Use project-specific counter to allow same date bills for different projects
      const counterName = `billNumber-${this.projectId}`;
      const nextId = await getNextSequence(counterName);
      const year = this.year;
      const month = String(this.month).padStart(2, "0");
      // Include project ID hash (first 4 chars) to make bill numbers unique per project
      const projectHash = this.projectId.toString().substring(0, 4).toUpperCase();
      this.billNumber = `BILL-${year}${month}-${projectHash}-${String(nextId).padStart(4, "0")}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

export default model<IBill>("Bill", billSchema);

