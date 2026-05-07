import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { Designation } from "../constants/designation.constants";
import { IGuard } from "../interfaces/guard.interface";
import { getNextSequence } from "./counter.model";

const guardSchema = new Schema<IGuard>(
  {
    // System ID
    guardId: { type: Number, unique: true, sparse: true },

    // Personal Details
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    designation: {
      type: String,
      enum: Object.values(Designation),
      required: true,
    },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    contactNumber: { type: String, required: true, trim: true, unique: true },
    alternateContactNumber: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    presentAddress: { type: String, trim: true },
    permanentAddress: { type: String, trim: true },

    // Authentication
    password: { type: String, select: false, trim: true },
    guardToken: { type: String, select: false, trim: true },

    // Bank Details
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    branchName: { type: String, trim: true },
    bankProof: { type: String },
    bankProofPublicId: { type: String, trim: true },

    // Salary & Payment Records
    salary: { type: Number },

    // KYC Documents
    aadharNumber: { type: String, trim: true, unique: true, sparse: true },
    panNumber: { type: String, trim: true, unique: true, sparse: true },
    photo: { type: String },
    photoPublicId: { type: String, trim: true },
    aadharCardFront: { type: String },
    aadharCardFrontPublicId: { type: String, trim: true },
    aadharCardBack: { type: String },
    aadharCardBackPublicId: { type: String, trim: true },
    panCardFront: { type: String },
    panCardFrontPublicId: { type: String, trim: true },
    panCardBack: { type: String },
    panCardBackPublicId: { type: String, trim: true },

    // Family Details and Emergency Contacts
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    emergencyContactName: { type: String, trim: true },
    emergencyContactNumber: { type: String, trim: true },
    emergencyContactRelation: { type: String, trim: true },

    // Children
    children: [
      new Schema(
        {
          name: { type: String, required: true, trim: true },
          age: { type: Number, required: true },
          phoneNumber: { type: String, trim: true },
          gender: { type: String, enum: ["Male", "Female", "Other"] },
        },
        { _id: false }
      ),
    ],

    // Assigned Inventories
    assignedInventories: [
      new Schema(
        {
          inventoryId: { type: String, required: true },
          inventoryName: { type: String, required: true },
          assignedQuantity: { type: Number, required: true, min: 1 },
          assignedDate: { type: Date, default: Date.now },
          assignedBy: { type: String, required: true },
        },
        { _id: false }
      ),
    ],

    // System fields
    joiningDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

guardSchema.index({ isDeleted: 1 });
guardSchema.index({ firstName: 1, lastName: 1 });
guardSchema.index({ contactNumber: 1 });

// Handle guardId auto-increment and password hashing
guardSchema.pre("save", async function (next) {
  // Hash password if it's modified
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Auto-increment guardId for new guards
  if (this.isNew && !this.guardId) {
    try {
      const nextId = await getNextSequence("guardId");
      this.guardId = nextId;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Compare password method
guardSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Guard = model<IGuard>("Guard", guardSchema);

export default Guard;
