import { Document } from "mongoose";
import { Designation } from "../constants/designation.constants";

export interface IGuard extends Document {
  // System ID
  guardId?: number;

  // Personal Details
  firstName: string;
  lastName: string;
  designation: Designation;
  dateOfBirth?: Date;
  gender?: "Male" | "Female" | "Other";
  contactNumber: string;
  alternateContactNumber?: string;
  email?: string;
  presentAddress?: string;
  permanentAddress?: string;

  // Authentication
  password?: string;
  guardToken?: string;

  // Bank Details
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  bankProof?: string;
  bankProofPublicId?: string;

  // Salary & Payment Records
  salary?: number;

  // KYC Documents
  aadharNumber?: string;
  panNumber?: string;
  photo?: string; // URL to the image
  photoPublicId?: string; // Cloudinary public ID for deletion
  aadharCardFront?: string;
  aadharCardFrontPublicId?: string;
  aadharCardBack?: string;
  aadharCardBackPublicId?: string;
  panCardFront?: string;
  panCardFrontPublicId?: string;
  panCardBack?: string;
  panCardBackPublicId?: string;

  // Family Details and Emergency Contacts
  fatherName?: string;
  motherName?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;

  // Children (optional overall; when present, entries should have name and age)
  children?: Array<{
    name: string;
    age: number;
    phoneNumber?: string;
    gender?: "Male" | "Female" | "Other";
  }>;

  // Assigned Inventories
  assignedInventories?: Array<{
    inventoryId: string;
    inventoryName: string;
    assignedQuantity: number;
    assignedDate: Date;
    assignedBy: string; // Admin ID who assigned
  }>;

  // System fields
  joiningDate: Date;
  expiryDate?: Date;
  isDeleted: boolean;

  // Authentication methods
  correctPassword?(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
}
