import { Document } from "mongoose";

export interface IAdmin extends Document {
  email: string;
  password?: string;
  role: "admin";
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
}
