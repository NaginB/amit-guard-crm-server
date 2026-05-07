import { Document } from "mongoose";

export interface IProject extends Document {
  // Project Basic Info
  projectName: string;
  projectId?: number; // Auto-incremented ID

  // Project Details
  siteId: string; // Reference to Site

  // Project Timeline removed at project level; handled per guard assignment

  // Project Status
  status: "Active" | "Closed" | "On Hold";

  // Guard Assignments
  guardAssignments: Array<{
    guardId: string; // Reference to Guard
    startDate: Date; // Assignment start date
    endDate?: Date; // Assignment end date (optional)
    guardName?: string; // Denormalized for easier queries
    shiftType: "Full Day" | "Full Night" | "Half Day" | "Half Night";
    monthlyRate: number; // Price per month for this guard-shift combination
    assignedDate: Date;
    assignedBy: string; // Admin ID who assigned
    isActive: boolean; // Individual assignment status
  }>;

  // Financial Information
  totalMonthlyCost?: number; // Calculated field
  totalProjectCost?: number; // Calculated field

  // Project Management
  description?: string;
  specialInstructions?: string;

  // System fields
  createdBy: string; // Admin ID who created the project
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response interfaces for API
export interface CreateProjectRequest {
  projectName: string;
  siteId: string;
  status: "Active" | "Closed" | "On Hold";
  guardAssignments: Array<{
    guardId: string;
    startDate: string; // ISO date string
    endDate?: string; // ISO date string
    shiftType: "Full Day" | "Full Night" | "Half Day" | "Half Night";
    monthlyRate: number;
  }>;
  description?: string;
  specialInstructions?: string;
}

export interface UpdateProjectRequest {
  projectName?: string;
  siteId?: string;
  status?: "Active" | "Closed" | "On Hold";
  guardAssignments?: Array<{
    guardId: string;
    startDate: string;
    endDate?: string;
    shiftType: "Full Day" | "Full Night" | "Half Day" | "Half Night";
    monthlyRate: number;
    assignedDate?: Date;
    isActive?: boolean;
  }>;
  description?: string;
  specialInstructions?: string;
}

export interface ProjectResponse {
  _id: string;
  projectId: number;
  projectName: string;
  siteId: string;
  status: "Active" | "Closed" | "On Hold";
  guardAssignments: Array<{
    guardId: string;
    guardName: string;
    startDate: Date;
    endDate?: Date;
    shiftType: "Full Day" | "Full Night" | "Half Day" | "Half Night";
    monthlyRate: number;
    assignedDate: Date;
    assignedBy: string;
    isActive: boolean;
  }>;
  totalMonthlyCost: number;
  totalProjectCost?: number;
  description?: string;
  specialInstructions?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
