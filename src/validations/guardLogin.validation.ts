import * as yup from "yup";

export const guardLoginSchema = yup.object({
  contactNumber: yup
    .string()
    .required("Contact number is required")
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number must not exceed 15 digits"),
  password: yup.string().required("Password is required"),
});
