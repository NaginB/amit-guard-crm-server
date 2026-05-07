import { Attendance, AttendanceRecord } from "../models/attendance.model";
import Guard from "../models/guard.model";
import Project from "../models/project.model";
import Site from "../models/site.model";
import {
  IAttendance,
  IAttendanceRecord,
  AttendanceCreateData,
  AttendanceUpdateData,
  AttendanceFilters,
  AttendanceAnalytics,
  AttendanceCalendarData,
} from "../interfaces/attendance.interface";
import { AppError } from "../utils/AppError";

export class AttendanceService {
  // Create a new attendance record
  static async createAttendance(
    data: AttendanceCreateData
  ): Promise<IAttendance> {
    // Check if guard exists
    const guard = await Guard.findById(data.guardId);
    if (!guard) {
      throw new AppError("Guard not found", 404);
    }

    // Check if project exists
    const project = await Project.findById(data.projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Check if site exists
    const site = await Site.findById(data.siteId);
    if (!site) {
      throw new AppError("Site not found", 404);
    }

    // Normalize date to start of day for comparison (ignore time component)
    const attendanceDate = new Date(data.date);
    attendanceDate.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // First, try to find existing record for this guard, project, and date (any time on that day)
    // We use a date range query to find records regardless of the time component
    // Also try exact date match as fallback
    let existingAttendance = await Attendance.findOne({
      guardId: data.guardId,
      projectId: data.projectId,
      date: {
        $gte: attendanceDate,
        $lte: endOfDay,
      },
    });

    // If not found with range query, try exact date match (in case date was already normalized)
    if (!existingAttendance) {
      existingAttendance = await Attendance.findOne({
        guardId: data.guardId,
        projectId: data.projectId,
        date: attendanceDate,
      });
    }

    let attendance: IAttendance;

    if (existingAttendance) {
      // Update existing record - preserve the ID to avoid unique constraint issues
      existingAttendance.status = data.status;
      existingAttendance.siteId = data.siteId;
      existingAttendance.photoUrl = data.photoUrl;
      if (data.checkInTime !== undefined) {
        existingAttendance.checkInTime = data.checkInTime;
      }
      if (data.checkOutTime !== undefined) {
        existingAttendance.checkOutTime = data.checkOutTime;
      }
      if (data.notes !== undefined) {
        existingAttendance.notes = data.notes;
      }
      // Normalize the date to start of day for consistency
      existingAttendance.date = attendanceDate;
      await existingAttendance.save();
      attendance = existingAttendance;
    } else {
      // Create new record with normalized date
      // If creation fails due to unique constraint (race condition), try to find and update
      try {
        attendance = new Attendance({
          ...data,
          date: attendanceDate, // Store normalized date
        });
        await attendance.save();
      } catch (error: any) {
        // If unique constraint violation, the record might have been created by another request
        // Try to find it and update it
        if (error.code === 11000 || error.name === "MongoServerError") {
          const raceConditionRecord = await Attendance.findOne({
            guardId: data.guardId,
            projectId: data.projectId,
            date: {
              $gte: attendanceDate,
              $lte: endOfDay,
            },
          });

          if (raceConditionRecord) {
            // Update the record that was created by another request
            raceConditionRecord.status = data.status;
            raceConditionRecord.siteId = data.siteId;
            raceConditionRecord.photoUrl = data.photoUrl;
            if (data.checkInTime !== undefined) {
              raceConditionRecord.checkInTime = data.checkInTime;
            }
            if (data.checkOutTime !== undefined) {
              raceConditionRecord.checkOutTime = data.checkOutTime;
            }
            if (data.notes !== undefined) {
              raceConditionRecord.notes = data.notes;
            }
            raceConditionRecord.date = attendanceDate;
            await raceConditionRecord.save();
            attendance = raceConditionRecord;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    // Update attendance record summary
    await this.updateAttendanceRecord(data.guardId, data.projectId);

    return attendance;
  }

  // Get all attendance records with filters
  static async getAttendance(
    filters: AttendanceFilters & { page?: number; limit?: number }
  ): Promise<{
    attendance: IAttendance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, ...filterData } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filterData.guardId) {
      query.guardId = filterData.guardId;
    }

    if (filterData.projectId) {
      query.projectId = filterData.projectId;
    }

    if (filterData.siteId) {
      query.siteId = filterData.siteId;
    }

    if (filterData.status) {
      query.status = filterData.status;
    }

    if (filterData.startDate && filterData.endDate) {
      query.date = {
        $gte: filterData.startDate,
        $lte: filterData.endDate,
      };
    }

    const attendance = await Attendance.find(query)
      .populate("guardId", "firstName lastName guardId")
      .populate("projectId", "name description")
      .populate("siteId", "name address city")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(query);

    return {
      attendance,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get attendance by ID
  static async getAttendanceById(id: string): Promise<IAttendance> {
    const attendance = await Attendance.findById(id)
      .populate("guardId", "firstName lastName guardId")
      .populate("projectId", "name description")
      .populate("siteId", "name address city");

    if (!attendance) {
      throw new AppError("Attendance record not found", 404);
    }

    return attendance;
  }

  // Update attendance record
  static async updateAttendance(
    id: string,
    data: AttendanceUpdateData
  ): Promise<IAttendance> {
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      throw new AppError("Attendance record not found", 404);
    }

    Object.assign(attendance, data);
    await attendance.save();

    // Update attendance record summary
    await this.updateAttendanceRecord(attendance.guardId, attendance.projectId);

    return attendance;
  }

  // Bulk update attendance records
  static async bulkUpdateAttendance(
    attendanceIds: string[],
    data: AttendanceUpdateData
  ): Promise<{
    results: Array<{
      id: string;
      success: boolean;
      attendance?: IAttendance;
      error?: string;
    }>;
  }> {
    const results = [];

    for (const id of attendanceIds) {
      try {
        const attendance = await this.updateAttendance(id, data);
        results.push({ id, success: true, attendance });
      } catch (error) {
        results.push({ id, success: false, error: (error as Error).message });
      }
    }

    return { results };
  }

  // Delete attendance record
  static async deleteAttendance(id: string): Promise<void> {
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      throw new AppError("Attendance record not found", 404);
    }

    await Attendance.findByIdAndDelete(id);

    // Update attendance record summary
    await this.updateAttendanceRecord(attendance.guardId, attendance.projectId);
  }

  // Get attendance calendar data for a specific guard and project
  static async getAttendanceCalendar(
    guardId: string,
    projectId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AttendanceCalendarData> {
    const guard = await Guard.findById(guardId);
    if (!guard) {
      throw new AppError("Guard not found", 404);
    }

    const project = await Project.findById(projectId).populate("siteId");
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Get project assignment dates
    const projectStartDate = project.guardAssignments.find(
      (assignment) => assignment.guardId === guardId
    )?.startDate;
    const projectEndDate = project.guardAssignments.find(
      (assignment) => assignment.guardId === guardId
    )?.endDate;

    const queryStartDate = startDate || projectStartDate || new Date();
    const queryEndDate = endDate || projectEndDate || new Date();

    const attendance = await Attendance.find({
      guardId,
      projectId,
      date: {
        $gte: queryStartDate,
        $lte: queryEndDate,
      },
    }).sort({ date: 1 });

    // Calculate summary
    const totalDays =
      Math.ceil(
        (queryEndDate.getTime() - queryStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;
    const presentDays = attendance.filter((a) => a.status === "present").length;
    const absentDays = attendance.filter((a) => a.status === "absent").length;
    const lateDays = attendance.filter((a) => a.status === "late").length;
    const halfDays = attendance.filter((a) => a.status === "half_day").length;
    const attendancePercentage =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Format attendance data for calendar
    const attendanceData = attendance.map((a) => ({
      date:
        a.date?.toISOString().split("T")[0] ||
        new Date().toISOString().split("T")[0],
      status: a.status,
      checkInTime: a.checkInTime?.toISOString(),
      checkOutTime: a.checkOutTime?.toISOString(),
      notes: a.notes,
    }));

    return {
      guardId,
      guardName: `${guard.firstName} ${guard.lastName}`,
      projectId,
      projectName: project.projectName,
      siteId: (project.siteId as any)._id.toString(),
      siteName: (project.siteId as any).name,
      startDate: queryStartDate,
      endDate: queryEndDate,
      attendance: attendanceData as any,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        attendancePercentage,
      },
    };
  }

  // Get attendance analytics
  static async getAttendanceAnalytics(
    startDate?: Date,
    endDate?: Date,
    projectId?: string,
    siteId?: string
  ): Promise<AttendanceAnalytics> {
    const query: any = {};

    if (startDate && endDate) {
      // Normalize startDate to beginning of day (UTC)
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setUTCHours(0, 0, 0, 0);
      
      // Normalize endDate to end of day (UTC) to include the full day
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setUTCHours(23, 59, 59, 999);
      
      query.date = { $gte: normalizedStartDate, $lte: normalizedEndDate };
    } else if (startDate) {
      // If only startDate is provided, normalize to beginning of day
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setUTCHours(0, 0, 0, 0);
      query.date = { $gte: normalizedStartDate };
    } else if (endDate) {
      // If only endDate is provided, normalize to end of day
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setUTCHours(23, 59, 59, 999);
      query.date = { $lte: normalizedEndDate };
    }

    if (projectId) {
      query.projectId = projectId;
    }

    if (siteId) {
      query.siteId = siteId;
    }

    const attendance = await Attendance.find(query)
      .populate("guardId", "firstName lastName")
      .populate("projectId", "name")
      .populate("siteId", "name")
      .sort({ date: 1 }); // Sort by date to ensure consistent ordering

    // Calculate overall statistics
    const totalGuards = new Set(attendance.map((a) => a.guardId.toString()))
      .size;
    const totalProjects = new Set(attendance.map((a) => a.projectId.toString()))
      .size;
    const totalSites = new Set(attendance.map((a) => a.siteId.toString())).size;

    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === "present").length;
    const overallAttendancePercentage =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Project-wise attendance
    const projectMap: { [key: string]: any } = {};
    attendance.forEach((a) => {
      const projectKey = a.projectId.toString();
      if (!projectMap[projectKey]) {
        projectMap[projectKey] = {
          projectId: projectKey,
          projectName: (a.projectId as any).name,
          siteName: (a.siteId as any).name,
          guards: new Set(),
          totalDays: 0,
          presentDays: 0,
        };
      }
      projectMap[projectKey].guards.add(a.guardId.toString());
      projectMap[projectKey].totalDays++;
      if (a.status === "present") {
        projectMap[projectKey].presentDays++;
      }
    });

    const projectAttendance = Object.values(projectMap).map((project: any) => ({
      projectId: project.projectId,
      projectName: project.projectName,
      siteName: project.siteName,
      guardCount: project.guards.size,
      averageAttendance:
        project.totalDays > 0
          ? Math.round((project.presentDays / project.totalDays) * 100)
          : 0,
    }));

    // Guard-wise attendance
    const guardMap: { [key: string]: any } = {};
    attendance.forEach((a) => {
      const guardKey = a.guardId.toString();
      if (!guardMap[guardKey]) {
        guardMap[guardKey] = {
          guardId: guardKey,
          guardName: `${(a.guardId as any).firstName} ${
            (a.guardId as any).lastName
          }`,
          projects: new Set(),
          totalDays: 0,
          presentDays: 0,
        };
      }
      guardMap[guardKey].projects.add(a.projectId.toString());
      guardMap[guardKey].totalDays++;
      if (a.status === "present") {
        guardMap[guardKey].presentDays++;
      }
    });

    const guardAttendance = Object.values(guardMap).map((guard: any) => ({
      guardId: guard.guardId,
      guardName: guard.guardName,
      totalProjects: guard.projects.size,
      averageAttendance:
        guard.totalDays > 0
          ? Math.round((guard.presentDays / guard.totalDays) * 100)
          : 0,
    }));

    // Monthly trends
    const monthlyMap: { [key: string]: any } = {};
    attendance.forEach((a) => {
      if (!a.date) return; // Skip if date is missing
      
      // Normalize date to UTC to ensure consistent month key
      const date = new Date(a.date);
      // Ensure we're using UTC for month calculation
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${month}`; // YYYY-MM format
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
        };
      }
      monthlyMap[monthKey].totalDays++;
      if (a.status === "present") {
        monthlyMap[monthKey].presentDays++;
      } else if (a.status === "absent") {
        monthlyMap[monthKey].absentDays++;
      }
    });

    const monthlyTrends = Object.values(monthlyMap).map((month: any) => ({
      month: month.month,
      averageAttendance:
        month.totalDays > 0
          ? Math.round((month.presentDays / month.totalDays) * 100)
          : 0,
      presentDays: month.presentDays,
      absentDays: month.absentDays,
    }));

    return {
      totalGuards,
      totalProjects,
      totalSites,
      overallAttendancePercentage,
      projectAttendance,
      guardAttendance,
      monthlyTrends,
    };
  }

  // Get project assignments for attendance management
  static async getProjectAssignments(): Promise<
    Array<{
      guardId: string;
      guardName: string;
      projectId: string;
      projectName: string;
      siteId: string;
      siteName: string;
      startDate: Date;
      endDate: Date;
    }>
  > {
    const projects = await Project.find().populate(
      "siteId",
      "name address city"
    );

    // Get all unique guard IDs from all projects
    const allGuardIds = new Set<string>();
    projects.forEach((project) => {
      if (project.guardAssignments && project.guardAssignments.length > 0) {
        project.guardAssignments.forEach((assignment: any) => {
          allGuardIds.add(assignment.guardId);
        });
      }
    });

    // Fetch all guards data
    const guards = await Guard.find({ _id: { $in: Array.from(allGuardIds) } });
    const guardMap = new Map();
    guards.forEach((guard) => {
      guardMap.set((guard._id as any).toString(), guard);
    });

    const assignments: Array<{
      guardId: string;
      guardName: string;
      projectId: string;
      projectName: string;
      siteId: string;
      siteName: string;
      startDate: Date;
      endDate: Date;
    }> = [];

    projects.forEach((project) => {
      if (project.guardAssignments && project.guardAssignments.length > 0) {
        project.guardAssignments.forEach((assignment: any) => {
          const guard = guardMap.get(assignment.guardId);
          assignments.push({
            guardId: assignment.guardId,
            guardName: guard
              ? `${guard.firstName} ${guard.lastName}`
              : "Unknown Guard",
            projectId: (project._id as any).toString(),
            projectName: project.projectName,
            siteId: (project.siteId as any)._id.toString(),
            siteName: (project.siteId as any).name,
            startDate: assignment.startDate,
            endDate: assignment.endDate,
          });
        });
      }
    });

    return assignments;
  }

  // Update or create attendance record summary
  static async updateAttendanceRecord(
    guardId: string,
    projectId: string
  ): Promise<void> {
    const project = await Project.findById(projectId);
    if (!project) return;

    const attendance = await Attendance.find({
      guardId,
      projectId,
    });

    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === "present").length;
    const absentDays = attendance.filter((a) => a.status === "absent").length;
    const lateDays = attendance.filter((a) => a.status === "late").length;
    const halfDays = attendance.filter((a) => a.status === "half_day").length;
    const attendancePercentage =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    await AttendanceRecord.findOneAndUpdate(
      { guardId, projectId },
      {
        guardId,
        projectId,
        siteId: project.siteId.toString(),
        startDate:
          project.guardAssignments.find((a) => a.guardId === guardId)
            ?.startDate || new Date(),
        endDate:
          project.guardAssignments.find((a) => a.guardId === guardId)
            ?.endDate || new Date(),
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        attendancePercentage,
      },
      { upsert: true, new: true }
    );
  }

  // Get monthly attendance calendar for guard and site
  static async getMonthlyAttendanceCalendar(
    guardId: string,
    siteId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    guardId: string;
    guardName: string;
    siteId: string;
    siteName: string;
    month: string;
    year: number;
    calendar: Array<{
      date: string;
      day: number;
      status: "present" | "absent" | "not_applicable";
      photoUrl?: string;
      checkInTime?: string;
      notes?: string;
    }>;
    summary: {
      totalDays: number;
      workingDays: number;
      presentDays: number;
      absentDays: number;
      attendancePercentage: number;
    };
  }> {
    const guard = await Guard.findById(guardId);
    if (!guard) {
      throw new AppError("Guard not found", 404);
    }

    // Find the site
    const site = await Site.findById(siteId);
    if (!site) {
      throw new AppError("Site not found", 404);
    }

    // Find an active project for this site and guard
    const project = await Project.findOne({
      siteId,
      "guardAssignments.guardId": guardId,
      "guardAssignments.isActive": true,
      status: "Active",
      isDeleted: false,
    });

    if (!project) {
      throw new AppError(
        "No active project found for this guard and site",
        404
      );
    }

    // Get weekly off configuration
    const { WeeklyOffService } = await import("./weeklyOff.service");
    const weeklyOff = await WeeklyOffService.getWeeklyOff(
      guardId,
      (project._id as any).toString()
    );

    // Get attendance records for this specific project and guard
    const attendance = await Attendance.find({
      guardId,
      projectId: project._id,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: 1 });

    // Create calendar array for the month
    const calendar = [];
    // Work with UTC dates to avoid timezone shifts
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);
    
    // Ensure we're working with UTC dates
    currentDate.setUTCHours(0, 0, 0, 0);
    lastDate.setUTCHours(23, 59, 59, 999);

    // Helper function to normalize date to UTC start of day and get date string
    const getDateString = (date: Date): string => {
      const normalized = new Date(date);
      normalized.setUTCHours(0, 0, 0, 0);
      return normalized.toISOString().split("T")[0] || "";
    };

    while (currentDate <= lastDate) {
      // Get date string in YYYY-MM-DD format using UTC
      const year = currentDate.getUTCFullYear();
      const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getUTCDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      
      // Get day of month and day of week using UTC
      const dayOfMonth = currentDate.getUTCDate();
      const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Check if this day is a weekly off day
      const isWeeklyOff =
        weeklyOff &&
        weeklyOff.weeklyOffDays &&
        weeklyOff.weeklyOffDays.includes(dayOfWeek);

      // Find attendance record for this date (normalize both dates for comparison)
      const attendanceRecord = attendance.find((a) => {
        if (!a.date) return false;
        const attendanceDateStr = getDateString(a.date);
        return attendanceDateStr === dateStr;
      });

      let status: "present" | "absent" | "not_applicable" = "not_applicable";
      let photoUrl: string | undefined;
      let checkInTime: string | undefined;
      let notes: string | undefined;

      if (isWeeklyOff) {
        // If it's a weekly off day, mark as not_applicable
        status = "not_applicable";
      } else if (attendanceRecord) {
        status = attendanceRecord.status === "present" ? "present" : "absent";
        photoUrl = attendanceRecord.photoUrl;
        checkInTime = attendanceRecord.checkInTime?.toISOString();
        notes = attendanceRecord.notes;
      } else {
        // If no attendance record exists, consider as absent
        status = "absent";
      }

      calendar.push({
        date: dateStr,
        day: dayOfMonth,
        status,
        ...(photoUrl && { photoUrl }),
        ...(checkInTime && { checkInTime }),
        ...(notes && { notes }),
      });

      // Move to next day in UTC
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      currentDate.setUTCHours(0, 0, 0, 0);
    }

    // Calculate summary
    const totalDays = calendar.length;
    const presentDays = calendar.filter((d) => d.status === "present").length;
    const absentDays = calendar.filter((d) => d.status === "absent").length;

    // Calculate weekly off days
    let weeklyOffDays = 0;
    if (weeklyOff && weeklyOff.weeklyOffDays) {
      const weeklyOffDaysArray = weeklyOff.weeklyOffDays;
      const currentDateForCount = new Date(startDate);
      while (currentDateForCount <= lastDate) {
        const dayOfWeek = currentDateForCount.getDay();
        if (weeklyOffDaysArray.includes(dayOfWeek)) {
          weeklyOffDays++;
        }
        currentDateForCount.setDate(currentDateForCount.getDate() + 1);
      }
    }

    // Calculate working days (total days - weekly off days)
    const workingDays = totalDays - weeklyOffDays;

    const attendancePercentage =
      workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

    return {
      guardId,
      guardName: `${guard.firstName} ${guard.lastName}`,
      siteId: (site._id as any).toString(),
      siteName: site.name,
      month: startDate.toLocaleString("default", { month: "long" }),
      year: startDate.getFullYear(),
      calendar,
      summary: {
        totalDays,
        workingDays,
        presentDays,
        absentDays,
        attendancePercentage,
      },
    };
  }
}
