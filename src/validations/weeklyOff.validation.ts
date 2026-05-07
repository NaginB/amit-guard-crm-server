import * as yup from "yup";

export const upsertWeeklyOffSchema = yup.object({
  guardId: yup.string().required("Guard ID is required"),
  projectId: yup.string().required("Project ID is required"),
  siteId: yup.string().required("Site ID is required"),
  weeklyOffDays: yup
    .array()
    .of(yup.number().min(0).max(6))
    .required("Weekly off days are required"),
});

export const getWeeklyOffSchema = yup.object({
  guardId: yup.string().required("Guard ID is required"),
  projectId: yup.string().required("Project ID is required"),
});

export const updateWeeklyOffSchema = yup.object({
  guardId: yup.string().required("Guard ID is required"),
  projectId: yup.string().required("Project ID is required"),
  weeklyOffDays: yup
    .array()
    .of(yup.number().min(0).max(6))
    .required("Weekly off days are required"),
});

export const deleteWeeklyOffSchema = yup.object({
  guardId: yup.string().required("Guard ID is required"),
  projectId: yup.string().required("Project ID is required"),
});

