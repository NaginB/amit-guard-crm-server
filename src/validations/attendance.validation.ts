import * as yup from "yup";

export const createAttendanceSchema = yup.object().shape({
  guardId: yup.string().required("Guard ID is required"),
  projectId: yup.string().required("Project ID is required"),
  siteId: yup.string().required("Site ID is required"),
  date: yup.date().required("Date is required"),
  status: yup
    .string()
    .oneOf(["present", "absent", "late", "half_day"], "Invalid status")
    .required("Status is required"),
  checkInTime: yup.date().optional(),
  checkOutTime: yup.date().optional(),
  notes: yup.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const updateAttendanceSchema = yup.object().shape({
  status: yup
    .string()
    .oneOf(["present", "absent", "late", "half_day"], "Invalid status")
    .optional(),
  checkInTime: yup.date().optional(),
  checkOutTime: yup.date().optional(),
  notes: yup.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const bulkUpdateAttendanceSchema = yup.object().shape({
  attendanceIds: yup
    .array()
    .of(yup.string())
    .min(1, "At least one attendance ID is required")
    .required("Attendance IDs are required"),
  status: yup
    .string()
    .oneOf(["present", "absent", "late", "half_day"], "Invalid status")
    .required("Status is required"),
  checkInTime: yup.date().optional(),
  checkOutTime: yup.date().optional(),
  notes: yup.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const getAttendanceSchema = yup.object().shape({
  guardId: yup.string().optional(),
  projectId: yup.string().optional(),
  siteId: yup.string().optional(),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
  status: yup
    .string()
    .oneOf(["present", "absent", "late", "half_day"], "Invalid status")
    .optional(),
  page: yup.number().min(1).default(1),
  limit: yup.number().min(1).max(100).default(10),
});

export const getAttendanceCalendarSchema = yup.object().shape({
  guardId: yup.string().required("Guard ID is required"),
  projectId: yup.string().required("Project ID is required"),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
});

export const getAttendanceAnalyticsSchema = yup.object().shape({
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
  projectId: yup.string().optional(),
  siteId: yup.string().optional(),
});

export const createAttendanceRecordSchema = yup.object().shape({
  guardId: yup.string().required("Guard ID is required"),
  projectId: yup.string().required("Project ID is required"),
  siteId: yup.string().required("Site ID is required"),
  startDate: yup.date().required("Start date is required"),
  endDate: yup.date().required("End date is required"),
  totalDays: yup
    .number()
    .required("Total days is required")
    .min(0, "Total days must be positive"),
  presentDays: yup
    .number()
    .required("Present days is required")
    .min(0, "Present days must be positive"),
  absentDays: yup
    .number()
    .required("Absent days is required")
    .min(0, "Absent days must be positive"),
  lateDays: yup
    .number()
    .required("Late days is required")
    .min(0, "Late days must be positive"),
  halfDays: yup
    .number()
    .required("Half days is required")
    .min(0, "Half days must be positive"),
  attendancePercentage: yup
    .number()
    .required("Attendance percentage is required")
    .min(0, "Attendance percentage must be between 0 and 100")
    .max(100, "Attendance percentage must be between 0 and 100"),
});

export const createAttendanceWithPhotoSchema = yup.object().shape({
  guardId: yup.string().required("Guard ID is required"),
  siteId: yup.string().required("Site ID is required"),
  photoUrl: yup
    .string()
    .url("Photo URL must be valid")
    .required("Photo URL is required"),
  notes: yup.string().max(500, "Notes cannot exceed 500 characters").optional(),
});
