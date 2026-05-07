import { Document } from "mongoose";

export interface IWeeklyOff extends Document {
  guardId: string;
  projectId: string;
  siteId: string;
  weeklyOffDays: number[]; // Array of day numbers: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyOffCreateData {
  guardId: string;
  projectId: string;
  siteId: string;
  weeklyOffDays: number[];
}

export interface WeeklyOffUpdateData {
  weeklyOffDays: number[];
}

