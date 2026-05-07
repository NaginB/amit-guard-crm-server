import * as yup from "yup";
import { Designation } from "../constants/designation.constants";

const guardPayload = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  designation: yup
    .string()
    .oneOf(Object.values(Designation), "Invalid designation")
    .required("Designation is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
  gender: yup
    .string()
    .oneOf(["Male", "Female", "Other"], "Invalid gender")
    .required("Gender is required"),
  contactNumber: yup.string().required("Contact number is required"),
  alternateContactNumber: yup.string().optional(),
  email: yup.string().email("Must be a valid email").optional(),
  presentAddress: yup.string().required("Present address is required"),
  permanentAddress: yup.string().required("Permanent address is required"),
  bankName: yup.string().required("Bank name is required"),
  accountNumber: yup.string().required("Account number is required"),
  ifscCode: yup.string().required("IFSC code is required"),
  branchName: yup.string().required("Branch name is required"),
  salary: yup.number().required("Salary is required"),
  aadharNumber: yup
    .string()
    .matches(
      /^(\d{16}|\d{4}[ \-]?\d{4}[ \-]?\d{4}[ \-]?\d{4})$/,
      "Aadhaar must be 16 digits"
    )
    .required("Aadhaar number is required"),
  panNumber: yup
    .string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format")
    .required("PAN number is required"),
  photo: yup.string().url().optional(),
  photoPublicId: yup.string().optional(),
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
  dateOfBirth: yup.date().optional(),
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
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format")
    .optional(),
  photo: yup.string().url().optional(),
  photoPublicId: yup.string().optional(),
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
