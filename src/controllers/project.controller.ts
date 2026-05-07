import { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service";
import { AppError } from "../utils/AppError";
import ResponseHandler from "../utils/responseHandler";

export const createProjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const createdBy = (req as any).user?.id || "system";
    const project = await projectService.createProject(req.body, createdBy);

    ResponseHandler.created(res, { project }, "Project created successfully");
  } catch (error) {
    next(error);
  }
};

export const getAllProjectsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projects = await projectService.getAllProjects(req.query);

    ResponseHandler.success(
      res,
      { projects, results: projects.length },
      "Projects retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getProjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return next(new AppError("Project ID is required", 400));
    }

    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    ResponseHandler.success(res, { project }, "Project retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const updateProjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return next(new AppError("Project ID is required", 400));
    }

    const updatedBy = (req as any).user?.id || "system";
    const project = await projectService.updateProjectById(
      projectId,
      req.body,
      updatedBy
    );

    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    ResponseHandler.success(res, { project }, "Project updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteProjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return next(new AppError("Project ID is required", 400));
    }

    await projectService.deleteProjectById(projectId);

    ResponseHandler.success(res, null, "Project deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getProjectsByGuardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const guardId = req.params.guardId;
    if (!guardId) {
      return next(new AppError("Guard ID is required", 400));
    }

    const projects = await projectService.getProjectsByGuard(
      guardId,
      req.query
    );

    ResponseHandler.success(
      res,
      { projects, results: projects.length },
      "Guard projects retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getProjectsBySiteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const siteId = req.params.siteId;
    if (!siteId) {
      return next(new AppError("Site ID is required", 400));
    }

    const projects = await projectService.getProjectsBySite(siteId, req.query);

    ResponseHandler.success(
      res,
      { projects, results: projects.length },
      "Site projects retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getProjectStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allProjects = await projectService.getAllProjects();

    const stats = {
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter((p) => p.status === "Active").length,
      closedProjects: allProjects.filter((p) => p.status === "Closed").length,
      onHoldProjects: allProjects.filter((p) => p.status === "On Hold").length,
      totalMonthlyCost: allProjects.reduce(
        (sum, p) => sum + (p.totalMonthlyCost || 0),
        0
      ),
      totalGuardsAssigned: new Set(
        allProjects.flatMap((p) =>
          p.guardAssignments.filter((a) => a.isActive).map((a) => a.guardId)
        )
      ).size,
    };

    ResponseHandler.success(
      res,
      { stats },
      "Project statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get guards assigned to a specific project
export const getGuardsByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      throw new AppError("Project ID is required", 400);
    }

    const project = await projectService.getProjectById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Extract guard IDs from guardAssignments
    const guardIds = project.guardAssignments
      .filter((assignment: any) => assignment.isActive !== false)
      .map((assignment: any) => assignment.guardId);

    if (guardIds.length === 0) {
      ResponseHandler.success(
        res,
        { guards: [] },
        "No guards assigned to this project"
      );
      return;
    }

    // Fetch guard details
    const Guard = require("../models/guard.model").default;
    const guards = await Guard.find({ _id: { $in: guardIds } });

    ResponseHandler.success(res, { guards }, "Guards retrieved successfully");
  } catch (error) {
    next(error);
  }
};
