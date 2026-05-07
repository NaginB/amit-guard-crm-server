import mongoose, { Schema } from "mongoose";
import {
  IAttendance,
  IAttendanceRecord,
} from "../interfaces/attendance.interface";

const attendanceSchema = new Schema<IAttendance>(
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
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day"],
      required: [true, "Status is required"],
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    photoUrl: {
      type: String,
      required: [true, "Site photo is required for attendance"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
attendanceSchema.index({ guardId: 1, projectId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ projectId: 1, date: 1 });
attendanceSchema.index({ siteId: 1, date: 1 });
attendanceSchema.index({ date: 1 });

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
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
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    totalDays: {
      type: Number,
      required: [true, "Total days is required"],
      min: [0, "Total days must be positive"],
    },
    presentDays: {
      type: Number,
      required: [true, "Present days is required"],
      min: [0, "Present days must be positive"],
    },
    absentDays: {
      type: Number,
      required: [true, "Absent days is required"],
      min: [0, "Absent days must be positive"],
    },
    lateDays: {
      type: Number,
      required: [true, "Late days is required"],
      min: [0, "Late days must be positive"],
    },
    halfDays: {
      type: Number,
      required: [true, "Half days is required"],
      min: [0, "Half days must be positive"],
    },
    attendancePercentage: {
      type: Number,
      required: [true, "Attendance percentage is required"],
      min: [0, "Attendance percentage must be between 0 and 100"],
      max: [100, "Attendance percentage must be between 0 and 100"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
attendanceRecordSchema.index({ guardId: 1, projectId: 1 }, { unique: true });
attendanceRecordSchema.index({ projectId: 1 });
attendanceRecordSchema.index({ siteId: 1 });

export const Attendance = mongoose.model<IAttendance>(
  "Attendance",
  attendanceSchema
);
export const AttendanceRecord = mongoose.model<IAttendanceRecord>(
  "AttendanceRecord",
  attendanceRecordSchema
);
