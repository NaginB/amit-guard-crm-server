import * as yup from "yup";

const guardAssignmentSchema = yup.object({
  guardId: yup.string().required("Guard ID is required"),
  startDate: yup.date().required("Assignment start date is required"),
  endDate: yup.date().nullable().optional(),
  shiftType: yup
    .string()
    .oneOf(
      ["Full Day", "Full Night", "Half Day", "Half Night"],
      "Invalid shift type"
    )
    .required("Shift type is required"),
  monthlyRate: yup
    .number()
    .positive("Monthly rate must be positive")
    .required("Monthly rate is required"),
});

const projectPayload = yup.object({
  projectName: yup.string().required("Project name is required").trim(),
  siteId: yup.string().required("Site ID is required"),
  status: yup
    .string()
    .oneOf(["Active", "Closed", "On Hold"], "Invalid project status")
    .default("Active"),
  guardAssignments: yup
    .array()
    .of(guardAssignmentSchema)
    .min(1, "At least one guard assignment is required")
    .required("Guard assignments are required"),
  description: yup.string().nullable().optional().trim(),
  specialInstructions: yup.string().nullable().optional().trim(),
});

export const createProjectSchema = projectPayload;

export const updateProjectSchema = yup.object({
  projectId: yup.string().required("Project ID is required"),
  projectName: yup.string().optional().trim(),
  siteId: yup.string().optional(),
  status: yup
    .string()
    .oneOf(["Active", "Closed", "On Hold"], "Invalid project status")
    .optional(),
  guardAssignments: yup.array().of(guardAssignmentSchema).optional(),
  description: yup.string().nullable().optional().trim(),
  specialInstructions: yup.string().nullable().optional().trim(),
});

export const getProjectSchema = yup.object({
  projectId: yup.string().required("Project ID is required"),
});

export const deleteProjectSchema = yup.object({
  projectId: yup.string().required("Project ID is required"),
});

export const getAllProjectsSchema = yup.object({
  status: yup.string().oneOf(["Active", "Closed", "On Hold"]).optional(),
  siteId: yup.string().optional(),
  guardId: yup.string().optional(),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
  page: yup.number().positive().optional(),
  limit: yup.number().positive().max(100).optional(),
});

export const getProjectsByGuardSchema = yup.object({
  guardId: yup.string().required("Guard ID is required"),
  status: yup.string().oneOf(["Active", "Closed", "On Hold"]).optional(),
  siteId: yup.string().optional(),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
  page: yup.number().positive().optional(),
  limit: yup.number().positive().max(100).optional(),
});

export const getProjectsBySiteSchema = yup.object({
  siteId: yup.string().required("Site ID is required"),
  status: yup.string().oneOf(["Active", "Closed", "On Hold"]).optional(),
  guardId: yup.string().optional(),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
  page: yup.number().positive().optional(),
  limit: yup.number().positive().max(100).optional(),
});
