import * as yup from "yup";
import { Designation } from "../constants/designation.constants";

const guardPayload = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  designation: yup
    .string()
    .oneOf(Object.values(Designation), "Invalid designation")
    .required("Designation is required"),
  dateOfBirth: yup
    .date()
    .required("Date of birth is required")
    .test(
      "age",
      "Age must be between 22 and 50 years",
      function (value) {
        if (!value) return false;
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age >= 22 && age <= 50;
      }
    ),
  gender: yup
    .string()
    .oneOf(["Male", "Female", "Other"], "Invalid gender")
    .required("Gender is required"),
  contactNumber: yup.string().required("Contact number is required"),
  alternateContactNumber: yup.string().optional(),
  email: yup.string().email("Must be a valid email").optional(),
  presentAddress: yup.string().required("Present address is required"),
  permanentAddress: yup.string().required("Permanent address is required"),
  bankName: yup.string().optional(),
  accountNumber: yup.string().optional(),
  ifscCode: yup.string().optional(),
  branchName: yup.string().optional(),
  salary: yup.number().optional(),
  aadharNumber: yup
    .string()
    .matches(
      /^(\d{16}|\d{4}[ \-]?\d{4}[ \-]?\d{4}[ \-]?\d{4})$/,
      "Aadhaar must be 16 digits"
    )
    .required("Aadhaar number is required"),
  panNumber: yup
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format")
    .optional(),
  photo: yup.string().url().optional(),
  photoPublicId: yup.string().optional(),
  aadharCardFront: yup.string().url().optional(),
  aadharCardFrontPublicId: yup.string().optional(),
  aadharCardBack: yup.string().url().optional(),
  aadharCardBackPublicId: yup.string().optional(),
  panCardFront: yup.string().url().optional(),
  panCardFrontPublicId: yup.string().optional(),
  panCardBack: yup.string().url().optional(),
  panCardBackPublicId: yup.string().optional(),
  bankProof: yup.string().url().optional(),
  bankProofPublicId: yup.string().optional(),
  fatherName: yup.string().required("Father name is required"),
  motherName: yup.string().required("Mother name is required"),
  emergencyContactName: yup
    .string()
    .required("Emergency contact name is required"),
  emergencyContactNumber: yup
    .string()
    .required("Emergency contact number is required"),
  emergencyContactRelation: yup
    .string()
    .required("Emergency contact relation is required"),
  joiningDate: yup.date().required("Joining date is required"),
  children: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required("Child name is required"),
        age: yup.number().required("Child age is required").min(0),
        phoneNumber: yup.string().optional(),
        gender: yup.string().oneOf(["Male", "Female", "Other"]).optional(),
      })
    )
    .optional(),
});

export const createGuardSchema = guardPayload;

export const updateGuardSchema = yup.object({
  guardId: yup.string().required("Guard ID is required"),
  firstName: yup.string().optional(),
  lastName: yup.string().optional(),
  designation: yup
    .string()
    .oneOf(Object.values(Designation), "Invalid designation")
    .optional(),
  dateOfBirth: yup
    .date()
    .optional()
    .test(
      "age",
      "Age must be between 22 and 50 years",
      function (value) {
        if (!value) return true;
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age >= 22 && age <= 50;
      }
    ),
  gender: yup.string().oneOf(["Male", "Female", "Other"]).optional(),
  contactNumber: yup.string().optional(),
  alternateContactNumber: yup.string().optional(),
  email: yup.string().email("Must be a valid email").optional(),
  presentAddress: yup.string().optional(),
  permanentAddress: yup.string().optional(),
  bankName: yup.string().optional(),
  accountNumber: yup.string().optional(),
  ifscCode: yup.string().optional(),
  branchName: yup.string().optional(),
  salary: yup.number().optional(),
  aadharNumber: yup
    .string()
    .matches(
      /^(\d{16}|\d{4}[ \-]?\d{4}[ \-]?\d{4}[ \-]?\d{4})$/,
      "Aadhaar must be 16 digits"
    )
    .optional(),
  panNumber: yup
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format")
    .optional(),
  photo: yup.string().url().optional(),
  photoPublicId: yup.string().optional(),
  aadharCardFront: yup.string().url().optional(),
  aadharCardFrontPublicId: yup.string().optional(),
  aadharCardBack: yup.string().url().optional(),
  aadharCardBackPublicId: yup.string().optional(),
  panCardFront: yup.string().url().optional(),
  panCardFrontPublicId: yup.string().optional(),
  panCardBack: yup.string().url().optional(),
  panCardBackPublicId: yup.string().optional(),
  bankProof: yup.string().url().optional(),
  bankProofPublicId: yup.string().optional(),
  fatherName: yup.string().optional(),
  motherName: yup.string().optional(),
  emergencyContactName: yup.string().optional(),
  emergencyContactNumber: yup.string().optional(),
  emergencyContactRelation: yup.string().optional(),
  joiningDate: yup.date().optional(),
  password: yup
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .test(
      "len",
      "Password must be at least 6 characters",
      (val) => !val || val.length >= 6
    )
    .optional(),
  children: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        age: yup.number().required().min(0),
        email: yup.string().email().optional(),
      })
    )
    .optional(),
});

export const getGuardSchema = yup.object({
  guardId: yup.string().required("Guard ID is required"),
});

export const deleteGuardSchema = yup.object({
  guardId: yup.string().required("Guard ID is required"),
});
