import { Document } from "mongoose";

export interface IBill extends Document {
  billNumber: string;
  projectId: string;
  siteId: string;
  month: number;
  year: number;
  billingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  guardAssignments: Array<{
    guardId: string;
    guardName: string;
    shiftType: string;
    monthlyRate: number;
    daysWorked: number;
    workingDays: number;
    absentDays: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: number;
  totalAmount: number;
  status: "Pending" | "Overdue" | "Hold" | "Paid";
  sentAt?: Date;
  paidAt?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillData {
  _id?: string;
  billNumber: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  siteCity: string;
  siteContactPerson?: string;
  siteContactEmail?: string;
  siteContactPhone?: string;
  month: number;
  year: number;
  billingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  guardAssignments: Array<{
    guardId: string;
    guardName: string;
    shiftType: string;
    monthlyRate: number;
    daysWorked: number;
    workingDays: number;
    absentDays: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: number;
  totalAmount: number;
  status: "Pending" | "Overdue" | "Hold" | "Paid";
  generatedDate: Date;
}

export interface GenerateBillRequest {
  projectId: string;
  guardId?: string; // Optional: if provided, generate bill only for this guard
  year: number;
  month: number;
  tax?: number;
  notes?: string;
}

export interface SendBillEmailRequest {
  billId: string;
  recipientEmail: string;
  subject?: string;
  message?: string;
}

