import { Request, Response, NextFunction } from "express";
import { AttendanceService } from "../services/attendance.service";
import { AppError } from "../utils/AppError";
import { ResponseHandler } from "../utils/responseHandler";

export class AttendanceController {
  // Create a new attendance record
  static async createAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const attendance = await AttendanceService.createAttendance(req.body);
      ResponseHandler.created(
        res,
        attendance,
        "Attendance record created successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all attendance records with filters
  static async getAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        guardId,
        projectId,
        siteId,
        startDate,
        endDate,
        status,
        page = 1,
        limit = 10,
      } = req.query;

      const filters: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      if (guardId) filters.guardId = guardId as string;
      if (projectId) filters.projectId = projectId as string;
      if (siteId) filters.siteId = siteId as string;
      if (status)
        filters.status = status as "present" | "absent" | "late" | "half_day";
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await AttendanceService.getAttendance(filters);
      ResponseHandler.success(
        res,
        result,
        "Attendance records retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get attendance record by ID
  static async getAttendanceById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError("Attendance ID is required", 400);
      }
      const attendance = await AttendanceService.getAttendanceById(id);
      ResponseHandler.success(
        res,
        attendance,
        "Attendance record retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Update attendance record
  static async updateAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError("Attendance ID is required", 400);
      }
      const attendance = await AttendanceService.updateAttendance(id, req.body);
      ResponseHandler.success(
        res,
        attendance,
        "Attendance record updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Bulk update attendance records
  static async bulkUpdateAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { attendanceIds, ...updateData } = req.body;

      if (
        !attendanceIds ||
        !Array.isArray(attendanceIds) ||
        attendanceIds.length === 0
      ) {
        throw new AppError("Attendance IDs array is required", 400);
      }

      const result = await AttendanceService.bulkUpdateAttendance(
        attendanceIds,
        updateData
      );
      ResponseHandler.success(res, result, "Bulk attendance update completed");
    } catch (error) {
      next(error);
    }
  }

  // Delete attendance record
  static async deleteAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError("Attendance ID is required", 400);
      }
      await AttendanceService.deleteAttendance(id);
      ResponseHandler.success(
        res,
        null,
        "Attendance record deleted successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get attendance calendar data
  static async getAttendanceCalendar(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { guardId, projectId } = req.params;
      const { startDate, endDate } = req.query;

      if (!guardId || !projectId) {
        throw new AppError("Guard ID and Project ID are required", 400);
      }

      const calendarData = await AttendanceService.getAttendanceCalendar(
        guardId,
        projectId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      ResponseHandler.success(
        res,
        calendarData,
        "Attendance calendar data retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get attendance analytics
  static async getAttendanceAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate, projectId, siteId } = req.query;

      const analytics = await AttendanceService.getAttendanceAnalytics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        projectId as string,
        siteId as string
      );

      ResponseHandler.success(
        res,
        analytics,
        "Attendance analytics retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get project assignments for attendance management
  static async getProjectAssignments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const assignments = await AttendanceService.getProjectAssignments();
      ResponseHandler.success(
        res,
        assignments,
        "Project assignments retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get attendance by guard
  static async getAttendanceByGuard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { guardId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!guardId) {
        throw new AppError("Guard ID is required", 400);
      }

      const filters: any = {
        guardId,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await AttendanceService.getAttendance(filters);
      ResponseHandler.success(
        res,
        result,
        "Guard attendance records retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get attendance by project
  static async getAttendanceByProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!projectId) {
        throw new AppError("Project ID is required", 400);
      }

      const filters: any = {
        projectId,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await AttendanceService.getAttendance(filters);
      ResponseHandler.success(
        res,
        result,
        "Project attendance records retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Create attendance with photo upload
  static async createAttendanceWithPhoto(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { guardId, siteId, photoUrl, notes } = req.body;

      if (!guardId || !siteId || !photoUrl) {
        throw new AppError(
          "Guard ID, Site ID, and Photo URL are required",
          400
        );
      }

      // Find a project for this site (we'll use the first active project)
      const { default: ProjectModel } = await import("../models/project.model");
      const project = await ProjectModel.findOne({ siteId, status: "Active" });

      if (!project) {
        throw new AppError("No active project found for this site", 404);
      }

      const attendanceData = {
        guardId: guardId as string,
        projectId: (project._id as any).toString(),
        siteId: siteId as string,
        date: new Date(),
        status: "present" as const,
        checkInTime: new Date(),
        photoUrl: photoUrl as string,
        notes: (notes as string) || "",
      };

      const attendance = await AttendanceService.createAttendance(
        attendanceData
      );
      ResponseHandler.created(
        res,
        attendance,
        "Attendance marked successfully with site photo"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get monthly attendance calendar for guard and site
  static async getMonthlyAttendanceCalendar(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { guardId, siteId } = req.params;
      const { year, month } = req.query;

      if (!guardId || !siteId) {
        throw new AppError("Guard ID and Site ID are required", 400);
      }

      const targetYear = parseInt(year as string) || new Date().getFullYear();
      const targetMonth =
        parseInt(month as string) || new Date().getMonth() + 1;

      // Create dates in UTC to avoid timezone issues
      const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

      const calendarData = await AttendanceService.getMonthlyAttendanceCalendar(
        guardId,
        siteId,
        startDate,
        endDate
      );

      ResponseHandler.success(
        res,
        calendarData,
        "Monthly attendance calendar retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
