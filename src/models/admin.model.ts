import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { IAdmin } from "../interfaces/admin.interface";

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: any
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Admin = model<IAdmin>("Admin", adminSchema);

export default Admin;
