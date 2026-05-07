import Admin from "../models/admin.model";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export const login = async (email: string, password: any) => {
  try {
    if (!email || !password) {
      return {
        success: false,
        error: "Please provide email and password!",
        statusCode: 400,
      };
    }

    const admin: any = await Admin.findOne({ email }).select("+password");

    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      return {
        success: false,
        error: "Incorrect email or password",
        statusCode: 401,
      };
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN as string) || "90d";

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return {
        success: false,
        error: "JWT secret is not configured",
        statusCode: 500,
      };
    }

    const secret: Secret = jwtSecret;
    const options = {
      // SignOptions.expiresIn expects number | StringValue. We accept string durations like '90d'
      expiresIn: expiresIn as unknown as SignOptions["expiresIn"],
    } as SignOptions;

    const token = jwt.sign({ id: admin._id }, secret, options);

    return { success: true, token };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred during login",
      statusCode: 500,
    };
  }
};
