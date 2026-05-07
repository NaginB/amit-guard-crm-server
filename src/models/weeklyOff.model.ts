import mongoose, { Schema } from "mongoose";
import { IWeeklyOff } from "../interfaces/weeklyOff.interface";

const weeklyOffSchema = new Schema<IWeeklyOff>(
  {
    guardId: {
      type: String,
      required: [true, "Guard ID is required"],
      ref: "Guard",
    },
    projectId: {
      type: String,
      required: [true, "Project ID is required"],
      ref: "Project",
    },
    siteId: {
      type: String,
      required: [true, "Site ID is required"],
      ref: "Site",
    },
    weeklyOffDays: {
      type: [Number],
      required: [true, "Weekly off days are required"],
      validate: {
        validator: function (days: number[]) {
          return (
            Array.isArray(days) &&
            days.every((day) => day >= 0 && day <= 6) &&
            days.length === new Set(days).size // No duplicates
          );
        },
        message: "Weekly off days must be unique numbers between 0 (Sunday) and 6 (Saturday)",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries - one configuration per guard-project combination
weeklyOffSchema.index({ guardId: 1, projectId: 1 }, { unique: true });
weeklyOffSchema.index({ projectId: 1 });
weeklyOffSchema.index({ siteId: 1 });

export const WeeklyOff = mongoose.model<IWeeklyOff>("WeeklyOff", weeklyOffSchema);

