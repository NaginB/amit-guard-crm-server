import { WeeklyOff } from "../models/weeklyOff.model";
import {
  IWeeklyOff,
  WeeklyOffCreateData,
  WeeklyOffUpdateData,
} from "../interfaces/weeklyOff.interface";
import { AppError } from "../utils/AppError";
import { default as Guard } from "../models/guard.model";
import { default as Project } from "../models/project.model";
import { default as Site } from "../models/site.model";
import { Attendance } from "../models/attendance.model";

export class WeeklyOffService {
  // Create or update weekly off configuration
  static async upsertWeeklyOff(
    data: WeeklyOffCreateData
  ): Promise<IWeeklyOff> {
    // Validate guard exists
    const guard = await Guard.findById(data.guardId);
    if (!guard) {
      throw new AppError("Guard not found", 404);
    }

    // Validate project exists
    const project = await Project.findById(data.projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Validate site exists
    const site = await Site.findById(data.siteId);
    if (!site) {
      throw new AppError("Site not found", 404);
    }

    // Get existing weekly off configuration to identify newly added weekly off days
    const existingWeeklyOff = await WeeklyOff.findOne({
      guardId: data.guardId,
      projectId: data.projectId,
    });

    // Upsert weekly off configuration
    const weeklyOff = await WeeklyOff.findOneAndUpdate(
      { guardId: data.guardId, projectId: data.projectId },
      {
        guardId: data.guardId,
        projectId: data.projectId,
        siteId: data.siteId,
        weeklyOffDays: data.weeklyOffDays,
      },
      { upsert: true, new: true }
    );

    // Delete attendance records for days that are now marked as weekly off
    // Find newly added weekly off days (days in new config but not in old config)
    const newlyAddedWeeklyOffDays = existingWeeklyOff
      ? data.weeklyOffDays.filter(
          (day) => !existingWeeklyOff.weeklyOffDays.includes(day)
        )
      : data.weeklyOffDays; // If no existing config, all days are newly added

    if (newlyAddedWeeklyOffDays.length > 0) {
      // Get all attendance records for this guard and project
      const allAttendanceRecords = await Attendance.find({
        guardId: data.guardId,
        projectId: data.projectId,
      });

      // Collect IDs of attendance records to delete (those that fall on newly added weekly off days)
      const attendanceIdsToDelete: string[] = [];
      for (const attendanceRecord of allAttendanceRecords) {
        if (attendanceRecord.date) {
          const dayOfWeek = attendanceRecord.date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          if (newlyAddedWeeklyOffDays.includes(dayOfWeek)) {
            attendanceIdsToDelete.push((attendanceRecord._id as any).toString());
          }
        }
      }

      // Bulk delete attendance records
      if (attendanceIdsToDelete.length > 0) {
        await Attendance.deleteMany({
          _id: { $in: attendanceIdsToDelete },
        });

        // Update attendance record summary after deleting records
        const { AttendanceService } = await import("./attendance.service");
        await AttendanceService.updateAttendanceRecord(
          data.guardId,
          data.projectId
        );
      }
    }

    return weeklyOff;
  }

  // Get weekly off configuration
  static async getWeeklyOff(
    guardId: string,
    projectId: string
  ): Promise<IWeeklyOff | null> {
    const weeklyOff = await WeeklyOff.findOne({
      guardId,
      projectId,
    });

    return weeklyOff;
  }

  // Update weekly off configuration
  static async updateWeeklyOff(
    guardId: string,
    projectId: string,
    data: WeeklyOffUpdateData
  ): Promise<IWeeklyOff> {
    // Get existing weekly off configuration to identify newly added weekly off days
    const existingWeeklyOff = await WeeklyOff.findOne({
      guardId,
      projectId,
    });

    if (!existingWeeklyOff) {
      throw new AppError("Weekly off configuration not found", 404);
    }

    const weeklyOff = await WeeklyOff.findOneAndUpdate(
      { guardId, projectId },
      { weeklyOffDays: data.weeklyOffDays },
      { new: true }
    );

    if (!weeklyOff) {
      throw new AppError("Weekly off configuration not found", 404);
    }

    // Delete attendance records for days that are now marked as weekly off
    // Find newly added weekly off days (days in new config but not in old config)
    const newlyAddedWeeklyOffDays = data.weeklyOffDays.filter(
      (day) => !existingWeeklyOff.weeklyOffDays.includes(day)
    );

    if (newlyAddedWeeklyOffDays.length > 0) {
      // Get all attendance records for this guard and project
      const allAttendanceRecords = await Attendance.find({
        guardId,
        projectId,
      });

      // Collect IDs of attendance records to delete (those that fall on newly added weekly off days)
      const attendanceIdsToDelete: string[] = [];
      for (const attendanceRecord of allAttendanceRecords) {
        if (attendanceRecord.date) {
          const dayOfWeek = attendanceRecord.date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          if (newlyAddedWeeklyOffDays.includes(dayOfWeek)) {
            attendanceIdsToDelete.push((attendanceRecord._id as any).toString());
          }
        }
      }

      // Bulk delete attendance records
      if (attendanceIdsToDelete.length > 0) {
        await Attendance.deleteMany({
          _id: { $in: attendanceIdsToDelete },
        });

        // Update attendance record summary after deleting records
        const { AttendanceService } = await import("./attendance.service");
        await AttendanceService.updateAttendanceRecord(guardId, projectId);
      }
    }

    return weeklyOff;
  }

  // Delete weekly off configuration
  static async deleteWeeklyOff(
    guardId: string,
    projectId: string
  ): Promise<void> {
    const result = await WeeklyOff.deleteOne({ guardId, projectId });

    if (result.deletedCount === 0) {
      throw new AppError("Weekly off configuration not found", 404);
    }
  }

  // Check if a specific date is a weekly off day
  static async isWeeklyOffDay(
    guardId: string,
    projectId: string,
    date: Date
  ): Promise<boolean> {
    const weeklyOff = await this.getWeeklyOff(guardId, projectId);

    if (!weeklyOff || !weeklyOff.weeklyOffDays.length) {
      return false;
    }

    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return weeklyOff.weeklyOffDays.includes(dayOfWeek);
  }
}

