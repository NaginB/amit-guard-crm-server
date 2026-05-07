import { Attendance } from "../models/attendance.model";
import Guard from "../models/guard.model";
import Project from "../models/project.model";
import Site from "../models/site.model";
import { AppError } from "../utils/AppError";

export interface SalarySlipData {
  guardId: string;
  guardName: string;
  guardIdNumber?: number;
  contactNumber: string;
  email?: string;
  address?: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  siteCity: string;
  projectId: string;
  projectName: string;
  month: number;
  year: number;
  shiftType: string;
  monthlyRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  weeklyOffDays: number;
  workingDays: number;
  perDayRate: number;
  earnedSalary: number;
  startDate: Date;
  endDate: Date;
  generatedDate: Date;
}

export class SalarySlipService {
  // Generate salary slip for a guard for a specific month
  static async generateSalarySlip(
    guardId: string,
    siteId: string,
    year: number,
    month: number
  ): Promise<SalarySlipData> {
    // Validate month and year
    if (month < 1 || month > 12) {
      throw new AppError("Invalid month. Month must be between 1 and 12", 400);
    }

    if (year < 2000 || year > 2100) {
      throw new AppError("Invalid year", 400);
    }

    // Get guard details
    const guard = await Guard.findById(guardId);
    if (!guard) {
      throw new AppError("Guard not found", 404);
    }

    // Get site details
    const site = await Site.findById(siteId);
    if (!site) {
      throw new AppError("Site not found", 404);
    }

    // Find active project for this guard and site
    const project = await Project.findOne({
      siteId,
      "guardAssignments.guardId": guardId,
      "guardAssignments.isActive": true,
      status: "Active",
      isDeleted: false,
    }).populate("siteId", "name address city");

    if (!project) {
      throw new AppError(
        "No active project found for this guard and site",
        404
      );
    }

    // Get guard assignment details
    const assignment = project.guardAssignments.find(
      (a: any) => a.guardId === guardId && a.isActive
    );

    if (!assignment) {
      throw new AppError("Guard assignment not found", 404);
    }

    // Use guard salary first, then fallback to project assignment rate
    const monthlyRate = guard.salary || assignment.monthlyRate || 0;
    const shiftType = assignment.shiftType || "Full Day";

    // Helper to build YYYY-MM-DD strings in UTC (matches attendance calendar & bill logic)
    const getDateString = (date: Date): string => {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    // Calculate date range for the month in UTC to avoid timezone issues
    const startDateUTC = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDateUTC = new Date(
      Date.UTC(year, month, 0, 23, 59, 59, 999)
    ); // Last day of the month (end-of-day)

    // Get weekly off configuration first (needed to filter attendance)
    const { WeeklyOffService } = await import("./weeklyOff.service");
    let weeklyOffDaysArray: number[] = [];
    let weeklyOffDays = 0;
    try {
      const weeklyOff = await WeeklyOffService.getWeeklyOff(
        guardId,
        (project._id as any).toString()
      );
      if (weeklyOff && weeklyOff.weeklyOffDays) {
        weeklyOffDaysArray = weeklyOff.weeklyOffDays;
        // Calculate number of weekly off days in the month (using UTC)
        const currentDate = new Date(startDateUTC);
        while (currentDate <= endDateUTC) {
          const dayOfWeek = currentDate.getUTCDay();
          if (weeklyOffDaysArray.includes(dayOfWeek)) {
            weeklyOffDays++;
          }
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          currentDate.setUTCHours(0, 0, 0, 0);
        }
      }
    } catch (error) {
      // If weekly off not configured, continue without it
      console.log("Weekly off not configured for this guard/project");
    }

    // Get attendance records for the month (using UTC range)
    const attendanceRecords = await Attendance.find({
      guardId,
      projectId: project._id,
      date: {
        $gte: startDateUTC,
        $lte: endDateUTC,
      },
    }).sort({ date: 1 });

    // Calculate attendance statistics - only count working days (exclude weekly off days)
    // This matches the logic in getMonthlyAttendanceCalendar / bill generation
    const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate(); // Total days in the month
    const workingDays = totalDays - weeklyOffDays;

    // Create a map of attendance records by date for quick lookup
    const attendanceMap = new Map<string, (typeof attendanceRecords)[0]>();
    attendanceRecords.forEach((record) => {
      if (record.date) {
        const dateStr = getDateString(record.date);
        if (dateStr) {
          attendanceMap.set(dateStr, record);
        }
      }
    });

    // Count present and absent days only for working days
    let presentDays = 0;
    let absentDays = 0;
    const dateForCounting = new Date(startDateUTC);
    while (dateForCounting <= endDateUTC) {
      const dayOfWeek = dateForCounting.getUTCDay();
      const dateStr = getDateString(dateForCounting);

      // Only count if it's a working day (not a weekly off day)
      if (!weeklyOffDaysArray.includes(dayOfWeek)) {
        const attendanceRecord = attendanceMap.get(dateStr);
        if (attendanceRecord) {
          if (attendanceRecord.status === "present") {
            presentDays++;
          } else if (attendanceRecord.status === "absent") {
            absentDays++;
          }
        } else {
          // No attendance record exists for this working day - count as absent
          absentDays++;
        }
      }

      // Move to next day in UTC
      dateForCounting.setUTCDate(dateForCounting.getUTCDate() + 1);
      dateForCounting.setUTCHours(0, 0, 0, 0);
    }

    // Calculate per day rate (monthly rate / working days)
    const perDayRate =
      workingDays > 0 ? Math.round((monthlyRate / workingDays) * 100) / 100 : 0;

    // Calculate earned salary (present days * per day rate)
    const earnedSalary = Math.round(presentDays * perDayRate * 100) / 100;

    // Build salary slip data
    const salarySlipData: SalarySlipData = {
      guardId: (guard._id as any).toString(),
      guardName: `${guard.firstName} ${guard.lastName}`,
      ...(guard.guardId !== undefined && { guardIdNumber: guard.guardId }),
      contactNumber: guard.contactNumber,
      ...(guard.email !== undefined && { email: guard.email }),
      ...((guard.presentAddress || guard.permanentAddress) && {
        address: guard.presentAddress || guard.permanentAddress,
      }),
      siteId: (site._id as any).toString(),
      siteName: site.name,
      siteAddress: site.address,
      siteCity: site.city,
      projectId: (project._id as any).toString(),
      projectName: project.projectName,
      month,
      year,
      shiftType,
      monthlyRate,
      totalDays,
      presentDays,
      absentDays,
      weeklyOffDays,
      workingDays,
      perDayRate,
      earnedSalary,
      startDate: startDateUTC,
      endDate: endDateUTC,
      generatedDate: new Date(),
    };

    return salarySlipData;
  }
}

