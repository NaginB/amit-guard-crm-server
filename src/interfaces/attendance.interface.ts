import { Document } from "mongoose";

export interface IAttendance extends Document {
  guardId: string;
  projectId: string;
  siteId: string;
  date: Date;
  status: "present" | "absent" | "late" | "half_day";
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  photoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceRecord extends Document {
  guardId: string;
  projectId: string;
  siteId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  attendancePercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceCreateData {
  guardId: string;
  projectId: string;
  siteId: string;
  date: Date;
  status: "present" | "absent" | "late" | "half_day";
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  photoUrl: string;
}

export interface AttendanceUpdateData {
  status?: "present" | "absent" | "late" | "half_day";
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  photoUrl?: string;
}

export interface AttendanceFilters {
  guardId?: string;
  projectId?: string;
  siteId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: "present" | "absent" | "late" | "half_day";
}

export interface AttendanceAnalytics {
  totalGuards: number;
  totalProjects: number;
  totalSites: number;
  overallAttendancePercentage: number;
  projectAttendance: Array<{
    projectId: string;
    projectName: string;
    siteName: string;
    guardCount: number;
    averageAttendance: number;
  }>;
  guardAttendance: Array<{
    guardId: string;
    guardName: string;
    totalProjects: number;
    averageAttendance: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    averageAttendance: number;
    presentDays: number;
    absentDays: number;
  }>;
}

export interface AttendanceCalendarData {
  guardId: string;
  guardName: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  startDate: Date;
  endDate: Date;
  attendance: Array<{
    date: string;
    status: "present" | "absent" | "late" | "half_day";
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
    photoUrl?: string;
  }>;
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    attendancePercentage: number;
  };
}
