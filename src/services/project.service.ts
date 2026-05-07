import Project from "../models/project.model";
import Guard from "../models/guard.model";
import Site from "../models/site.model";
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  IProject,
} from "../interfaces/project.interface";
import { AppError } from "../utils/AppError";

export const createProject = async (
  projectData: CreateProjectRequest,
  createdBy: string
): Promise<IProject> => {
  try {
    // Validate site exists and is active
    const site = await Site.findById(projectData.siteId);
    if (!site) {
      throw new AppError("Site not found", 404);
    }
    if (!site.isActive) {
      throw new AppError("Cannot create project for inactive site", 400);
    }

    // Validate guards exist and are not deleted
    const guardIds = projectData.guardAssignments.map(
      (assignment) => assignment.guardId
    );
    const guards = await Guard.find({
      _id: { $in: guardIds },
      isDeleted: false,
    });

    if (guards.length !== guardIds.length) {
      throw new AppError("One or more guards not found or deleted", 404);
    }

    // Check for guard conflicts (per-assignment date ranges)
    await checkGuardConflictsForAssignments(projectData.guardAssignments);

    // Create project
    const project = new Project({
      ...projectData,
      guardAssignments: projectData.guardAssignments.map((assignment) => {
        const guard = guards.find(
          (g) => g._id?.toString() === assignment.guardId
        );
        return {
          ...assignment,
          guardName: guard
            ? `${guard.firstName} ${guard.lastName}`
            : "Unknown Guard",
          assignedBy: createdBy,
          assignedDate: new Date(),
          isActive: true, // Default to active for new assignments
        };
      }),
      createdBy,
      isDeleted: false, // Explicitly set isDeleted to false
    });

    await project.save();
    return project;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error creating project:", error);
    console.error("Error stack:", (error as Error).stack);
    console.error("Project data:", JSON.stringify(projectData, null, 2));
    throw new AppError("Failed to create project", 500);
  }
};

export const getAllProjects = async (
  filters: any = {}
): Promise<IProject[]> => {
  try {
    const query: any = { isDeleted: false };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.siteId) {
      query.siteId = filters.siteId;
    }
    if (filters.guardId) {
      query["guardAssignments.guardId"] = filters.guardId;
    }
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (start && end) {
        query.$or = [
          {
            "guardAssignments.startDate": { $lte: end },
            $or: [
              { "guardAssignments.endDate": { $gte: start } },
              { "guardAssignments.endDate": { $exists: false } },
              { "guardAssignments.endDate": null },
            ],
          },
        ];
      } else if (start) {
        query["guardAssignments.startDate"] = { $gte: start };
      } else if (end) {
        query["guardAssignments.endDate"] = { $lte: end };
      }
    }

    const projects = await Project.find(query)
      .populate("siteId", "name address city")
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50)
      .skip(((filters.page || 1) - 1) * (filters.limit || 50));

    return projects;
  } catch (error) {
    throw new AppError("Failed to fetch projects", 500);
  }
};

export const getProjectById = async (
  projectId: string
): Promise<IProject | null> => {
  try {
    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false,
    }).populate("siteId", "name address city");

    return project;
  } catch (error) {
    throw new AppError("Failed to fetch project", 500);
  }
};

export const updateProjectById = async (
  projectId: string,
  updateData: UpdateProjectRequest,
  updatedBy: string
): Promise<IProject | null> => {
  try {
    const project = await Project.findOne({ _id: projectId, isDeleted: false });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // If updating site, validate new site
    if (updateData.siteId && updateData.siteId !== project.siteId) {
      const site = await Site.findById(updateData.siteId);
      if (!site) {
        throw new AppError("Site not found", 404);
      }
      if (!site.isActive) {
        throw new AppError("Cannot assign project to inactive site", 400);
      }
    }

    // If updating guard assignments, validate guards and check conflicts
    if (updateData.guardAssignments) {
      const guardIds = updateData.guardAssignments.map(
        (assignment) => assignment.guardId
      );
      const guards = await Guard.find({
        _id: { $in: guardIds },
        isDeleted: false,
      });

      if (guards.length !== guardIds.length) {
        throw new AppError("One or more guards not found or deleted", 404);
      }

      // Check for conflicts per-assignment excluding current project
      await checkGuardConflictsForAssignments(
        updateData.guardAssignments,
        projectId
      );

      // Update guard assignments with denormalized data
      updateData.guardAssignments = updateData.guardAssignments.map(
        (assignment) => {
          const guard = guards.find(
            (g) => g._id?.toString() === assignment.guardId
          );
          return {
            ...assignment,
            guardName: guard
              ? `${guard.firstName} ${guard.lastName}`
              : "Unknown Guard",
            assignedBy: updatedBy,
            assignedDate: assignment.assignedDate || new Date(), // Preserve existing assignedDate or use current date
            isActive:
              assignment.isActive !== undefined ? assignment.isActive : true, // Preserve existing isActive or default to true
          };
        }
      );
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // Manually recalculate totalMonthlyCost to ensure accuracy
    if (updatedProject && updatedProject.guardAssignments) {
      updatedProject.totalMonthlyCost = updatedProject.guardAssignments
        .filter((assignment) => assignment.isActive)
        .reduce((total, assignment) => total + assignment.monthlyRate, 0);
      await updatedProject.save();
    }

    return updatedProject;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to update project", 500);
  }
};

export const deleteProjectById = async (projectId: string): Promise<void> => {
  try {
    const project = await Project.findOne({ _id: projectId, isDeleted: false });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Soft delete
    await Project.findByIdAndUpdate(projectId, {
      isDeleted: true,
      status: "Closed",
      updatedAt: new Date(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to delete project", 500);
  }
};

export const getProjectsByGuard = async (
  guardId: string,
  filters: any = {}
): Promise<IProject[]> => {
  try {
    const query: any = {
      isDeleted: false,
      "guardAssignments.guardId": guardId,
      "guardAssignments.isActive": true,
    };

    // Apply additional filters
    if (filters.status) {
      query.status = filters.status;
    }

    const projects = await Project.find(query)
      .populate("siteId", "name address city")
      .sort({ createdAt: -1 });

    return projects;
  } catch (error) {
    throw new AppError("Failed to fetch guard projects", 500);
  }
};

export const getProjectsBySite = async (
  siteId: string,
  filters: any = {}
): Promise<IProject[]> => {
  try {
    const query: any = {
      isDeleted: false,
      siteId: siteId,
    };

    // Apply additional filters
    if (filters.status) {
      query.status = filters.status;
    }

    const projects = await Project.find(query)
      .populate("siteId", "name address city")
      .sort({ createdAt: -1 });

    return projects;
  } catch (error) {
    throw new AppError("Failed to fetch site projects", 500);
  }
};

// Helper function to check for guard conflicts per assignment range
const checkGuardConflictsForAssignments = async (
  assignments: Array<{
    guardId: string;
    startDate: string | Date;
    endDate?: string | Date | null;
  }>,
  excludeProjectId?: string
): Promise<void> => {
  for (const assignment of assignments) {
    const guardId = assignment.guardId;
    const start = new Date(assignment.startDate);
    const end = assignment.endDate ? new Date(assignment.endDate) : null;

    const conflictQuery: any = {
      isDeleted: false,
      status: { $in: ["Active", "On Hold"] },
      "guardAssignments.guardId": guardId,
      "guardAssignments.isActive": true,
    };

    if (excludeProjectId) {
      conflictQuery._id = { $ne: excludeProjectId };
    }

    if (end) {
      conflictQuery.$or = [
        {
          "guardAssignments.startDate": { $lte: end },
          $or: [
            { "guardAssignments.endDate": { $gte: start } },
            { "guardAssignments.endDate": { $exists: false } },
            { "guardAssignments.endDate": null },
          ],
        },
      ];
    } else {
      conflictQuery["guardAssignments.startDate"] = { $gte: start };
    }

    const conflictingProjects = await Project.find(conflictQuery);
    if (conflictingProjects.length > 0) {
      const conflictingProjectNames = new Set<string>();
      conflictingProjects.forEach((project) => {
        conflictingProjectNames.add(project.projectName);
      });
      const projectNamesList = Array.from(conflictingProjectNames).join(", ");
      throw new AppError(
        `Guard is already assigned in: ${projectNamesList}. Adjust the assignment dates.`,
        400
      );
    }
  }
};
