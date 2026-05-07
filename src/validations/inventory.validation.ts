import * as yup from "yup";

const inventoryPayload = yup.object({
  name: yup
    .string()
    .required("Inventory name is required")
    .min(2, "Inventory name must be at least 2 characters")
    .max(50, "Inventory name must not exceed 50 characters"),
  description: yup
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  quantity: yup
    .number()
    .required("Quantity is required")
    .min(0, "Quantity must be non-negative")
    .integer("Quantity must be an integer"),
  unit: yup
    .string()
    .oneOf(["pieces", "pairs", "sets", "units", "items"], "Invalid unit")
    .required("Unit is required"),
});

export const createInventoryValidation = inventoryPayload;

export const updateInventoryValidation = yup.object({
  id: yup.string().required("Inventory ID is required"),
  name: yup
    .string()
    .min(2, "Inventory name must be at least 2 characters")
    .max(50, "Inventory name must not exceed 50 characters")
    .optional(),
  description: yup
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  quantity: yup
    .number()
    .min(0, "Quantity must be non-negative")
    .integer("Quantity must be an integer")
    .optional(),
  unit: yup
    .string()
    .oneOf(["pieces", "pairs", "sets", "units", "items"], "Invalid unit")
    .optional(),
  isActive: yup.boolean().optional(),
});
