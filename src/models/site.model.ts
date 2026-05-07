import mongoose, { Schema, Document } from "mongoose";

export interface ISite extends Document {
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  contactPersonName?: string;
  contactPhoneNumber?: string;
  contactEmail?: string;
  siteType: string;
  description?: string;
  securityRequirements?: string;
  specialInstructions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const siteSchema = new Schema<ISite>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    contactPersonName: {
      type: String,
      trim: true,
    },
    contactPhoneNumber: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    siteType: {
      type: String,
      required: true,
      enum: [
        "Hotel",
        "Office",
        "Residential",
        "Event",
        "Commercial",
        "Industrial",
        "Other",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    securityRequirements: {
      type: String,
      trim: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
siteSchema.index({ name: 1, address: 1 });
siteSchema.index({ city: 1 });
siteSchema.index({ siteType: 1 });
siteSchema.index({ isActive: 1 });

export default mongoose.model<ISite>("Site", siteSchema);
