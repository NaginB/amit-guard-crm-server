import Bill from "../models/bill.model";
import Project from "../models/project.model";
import Site from "../models/site.model";
import Guard from "../models/guard.model";
import { Attendance } from "../models/attendance.model";
import { AppError } from "../utils/AppError";
import { BillData, GenerateBillRequest } from "../interfaces/bill.interface";

export class BillService {
  // Generate bill for a project for a specific month
  static async generateBill(
    data: GenerateBillRequest,
    createdBy: string
  ): Promise<BillData> {
    const { projectId, guardId, year, month, tax = 0, notes } = data;

    // Validate month and year
    if (month < 1 || month > 12) {
      throw new AppError("Invalid month. Month must be between 1 and 12", 400);
    }

    if (year < 2000 || year > 2100) {
      throw new AppError("Invalid year", 400);
    }

    // Get project details
    const project = await Project.findById(projectId).populate("siteId");
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (project.isDeleted) {
      throw new AppError("Project has been deleted", 404);
    }

    // Get site details
    const site = await Site.findById(project.siteId);
    if (!site) {
      throw new AppError("Site not found", 404);
    }

    const siteIdString = ((project.siteId as any)?._id || project.siteId).toString();

    // Get active guard assignments for the billing period
    // If guardId is provided, filter to only that guard's assignment
    let activeAssignments = project.guardAssignments.filter(
      (assignment) => assignment.isActive
    );

    if (guardId) {
      // Validate that the guard is assigned to this project
      activeAssignments = activeAssignments.filter(
        (assignment) => assignment.guardId.toString() === guardId
      );

      if (activeAssignments.length === 0) {
        throw new AppError(
          `Guard is not assigned to this project or assignment is not active`,
          400
        );
      }
    }

    // Check for duplicate bills - only check if the same guard(s) already have a bill for this project/month/year
    // Get the guard IDs that will be in this bill
    const guardIdsInBill = activeAssignments.map((assignment) =>
      assignment.guardId.toString()
    );

    // Check if any of these guards already have a bill for this project/month/year
    const existingBills = await Bill.find({
      projectId,
      month,
      year,
      "guardAssignments.guardId": { $in: guardIdsInBill },
    });

    // Check if any existing bill contains any of the guards we're trying to bill
    const duplicateBill = existingBills.find((bill) => {
      const billGuardIds = bill.guardAssignments.map((ga: any) =>
        ga.guardId.toString()
      );
      // Check if there's any overlap between guards in existing bill and guards in new bill
      return guardIdsInBill.some((guardId) => billGuardIds.includes(guardId));
    });

    if (duplicateBill) {
      const duplicateGuardIds = duplicateBill.guardAssignments
        .map((ga: any) => ga.guardId.toString())
        .filter((id: string) => guardIdsInBill.includes(id));
      const duplicateGuardNames = duplicateBill.guardAssignments
        .filter((ga: any) => duplicateGuardIds.includes(ga.guardId.toString()))
        .map((ga: any) => ga.guardName)
        .join(", ");

      throw new AppError(
        `A bill already exists for guard(s) ${duplicateGuardNames} for this project and month. Please delete the existing bill before generating a new one.`,
        400
      );
    }

    if (activeAssignments.length === 0) {
      throw new AppError(
        "No active guard assignments found for this project",
        400
      );
    }

    // Calculate bill details for each guard assignment
    const guardAssignmentsDetails = await Promise.all(
      activeAssignments.map(async (assignment) => {
        // Get guard details
        const guard = await Guard.findById(assignment.guardId);
        if (!guard) {
          throw new AppError(`Guard ${assignment.guardId} not found`, 404);
        }

        // Get all attendance records (present and absent) for this guard
        // Use UTC dates to match how attendance records are stored
        const startDateUTC = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const endDateUTC = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        
        const allAttendanceRecords = await Attendance.find({
          guardId: assignment.guardId,
          projectId: project._id,
          date: {
            $gte: startDateUTC,
            $lte: endDateUTC,
          },
        });

        // Get weekly off configuration to calculate working days
        const { WeeklyOffService } = await import("./weeklyOff.service");
        let weeklyOffDaysArray: number[] = [];
        try {
          const weeklyOff = await WeeklyOffService.getWeeklyOff(
            assignment.guardId,
            (project._id as any).toString()
          );
          if (weeklyOff && weeklyOff.weeklyOffDays) {
            weeklyOffDaysArray = weeklyOff.weeklyOffDays;
          }
        } catch (error) {
          // If weekly off not configured, continue without it
        }

        // Create a map of attendance records by date for quick lookup
        // Use the same logic as attendance calendar - normalize dates to UTC
        const attendanceMap = new Map<string, typeof allAttendanceRecords[0]>();
        const getDateString = (date: Date): string => {
          const normalized = new Date(date);
          normalized.setUTCHours(0, 0, 0, 0);
          return normalized.toISOString().split("T")[0] || "";
        };
        
        allAttendanceRecords.forEach((record) => {
          if (record.date) {
            const dateStr = getDateString(record.date);
            if (dateStr) {
              attendanceMap.set(dateStr, record);
            }
          }
        });

        // Calculate total working days and count present/absent days by iterating through each day
        // This matches the logic in getMonthlyAttendanceCalendar
        let workingDays = 0;
        let daysWorked = 0;
        let absentDays = 0;
        
        // Reuse the UTC dates already calculated above
        const currentDate = new Date(startDateUTC);
        
        while (currentDate <= endDateUTC) {
          const dayOfWeek = currentDate.getUTCDay();
          // Get date string in YYYY-MM-DD format using UTC (same as attendance calendar)
          const dateYear = currentDate.getUTCFullYear();
          const monthStr = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
          const day = String(currentDate.getUTCDate()).padStart(2, "0");
          const dateStr = `${dateYear}-${monthStr}-${day}`;
          
          // Only count working days (exclude weekly off days)
          if (!weeklyOffDaysArray.includes(dayOfWeek)) {
            workingDays++;
            
            if (dateStr) {
              const attendanceRecord = attendanceMap.get(dateStr);
              if (attendanceRecord) {
                if (attendanceRecord.status === "present") {
                  daysWorked++;
                } else if (attendanceRecord.status === "absent") {
                  absentDays++;
                }
              } else {
                // No attendance record exists for this working day - count as absent
                absentDays++;
              }
            }
          }
          
          // Move to next day in UTC
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          currentDate.setUTCHours(0, 0, 0, 0);
        }

        // Calculate amount based on monthly rate and days worked (using project rate)
        const perDayRate = assignment.monthlyRate / workingDays;
        const amount = Math.round(daysWorked * perDayRate * 100) / 100;

        return {
          guardId: (guard._id as any).toString(),
          guardName: `${guard.firstName} ${guard.lastName}`,
          shiftType: assignment.shiftType,
          monthlyRate: assignment.monthlyRate, // Project rate for bill
          daysWorked,
          workingDays,
          absentDays,
          amount,
        };
      })
    );

    // Calculate subtotal
    const subtotal = guardAssignmentsDetails.reduce(
      (sum, assignment) => sum + assignment.amount,
      0
    );

    // Calculate total with tax
    const totalAmount =
      Math.round((subtotal + (subtotal * tax) / 100) * 100) / 100;

    // Generate bill number (will be auto-generated by model, but we need it for response)
    // Bill number will be auto-generated in the model pre-save hook with project-specific counter
    // Format: BILL-YYYYMM-PROJ-XXXX where PROJ is first 4 chars of projectId
    const projectIdString = (project._id as any).toString();
    const projectHash = projectIdString.substring(0, 4).toUpperCase();
    const existingBillsCount = await Bill.countDocuments({
      projectId: projectIdString,
      year,
      month,
    });
    const billNumber = `BILL-${year}${String(month).padStart(2, "0")}-${projectHash}-${String(
      existingBillsCount + 1
    ).padStart(4, "0")}`;

    // Create bill data
    const billData: BillData = {
      billNumber,
      projectId: (project._id as any).toString(),
      projectName: project.projectName,
      siteId: (site._id as any).toString(),
      siteName: site.name,
      siteAddress: site.address,
      siteCity: site.city,
      ...(site.contactPersonName && {
        siteContactPerson: site.contactPersonName,
      }),
      ...(site.contactEmail && { siteContactEmail: site.contactEmail }),
      ...(site.contactPhoneNumber && {
        siteContactPhone: site.contactPhoneNumber,
      }),
      month,
      year,
      billingPeriod: {
        startDate: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
      },
      guardAssignments: guardAssignmentsDetails,
      subtotal,
      ...(tax > 0 && { tax }),
      totalAmount,
      status: "Pending",
      generatedDate: new Date(),
    };

    // Save bill to database
    const bill = new Bill({
      ...billData,
      createdBy,
      ...(notes && { notes }),
    });

    await bill.save();

    // Return bill data with ID
    return {
      ...billData,
      _id: (bill._id as any).toString(),
    };
  }

  // Get bill by ID
  static async getBillById(billId: string): Promise<BillData> {
    const bill = await Bill.findById(billId)
      .populate("projectId", "projectName")
      .populate(
        "siteId",
        "name address city contactPersonName contactEmail contactPhoneNumber"
      );

    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    // Get project and site - handle both populated and non-populated cases
    const projectIdForQuery =
      (bill.projectId as any)?._id?.toString() ||
      (bill.projectId as any)?.toString() ||
      (bill.projectId as any);
    const siteIdForQuery =
      (bill.siteId as any)?._id?.toString() ||
      (bill.siteId as any)?.toString() ||
      (bill.siteId as any);

    const project = await Project.findById(projectIdForQuery);
    const site = await Site.findById(siteIdForQuery);

    if (!project || !site) {
      throw new AppError("Project or Site not found", 404);
    }

    // Ensure projectId and siteId are strings
    const projectIdString = (project._id as any).toString();
    const siteIdString = (site._id as any).toString();

    return {
      _id: (bill._id as any).toString(),
      billNumber: bill.billNumber,
      projectId: projectIdString,
      projectName: project.projectName,
      siteId: siteIdString,
      siteName: site.name,
      siteAddress: site.address,
      siteCity: site.city,
      ...(site.contactPersonName && {
        siteContactPerson: site.contactPersonName,
      }),
      ...(site.contactEmail && { siteContactEmail: site.contactEmail }),
      ...(site.contactPhoneNumber && {
        siteContactPhone: site.contactPhoneNumber,
      }),
      month: bill.month,
      year: bill.year,
      billingPeriod: bill.billingPeriod,
      guardAssignments: bill.guardAssignments,
      subtotal: bill.subtotal,
      ...(bill.tax && { tax: bill.tax }),
      totalAmount: bill.totalAmount,
      status: bill.status,
      generatedDate: bill.createdAt,
    };
  }

  // Get all bills for a project
  static async getBillsByProject(projectId: string): Promise<BillData[]> {
    const bills = await Bill.find({ projectId })
      .sort({ year: -1, month: -1 })
      .populate("projectId", "projectName")
      .populate("siteId", "name address city");

    return bills.map((bill) => {
      const project = bill.projectId as any;
      const site = bill.siteId as any;

      // Handle populated projectId - it could be an object with _id or a string
      const projectIdString =
        project?._id?.toString() || project?.toString() || (bill.projectId as any).toString();
      
      // Handle populated siteId - it could be an object with _id or a string
      const siteIdString =
        site?._id?.toString() || site?.toString() || (bill.siteId as any).toString();

      return {
        _id: (bill._id as any).toString(),
        billNumber: bill.billNumber,
        projectId: projectIdString,
        projectName: project?.projectName || "",
        siteId: siteIdString,
        siteName: site?.name || "",
        siteAddress: site?.address || "",
        siteCity: site?.city || "",
        month: bill.month,
        year: bill.year,
        billingPeriod: bill.billingPeriod,
        guardAssignments: bill.guardAssignments,
        subtotal: bill.subtotal,
        ...(bill.tax && { tax: bill.tax }),
        totalAmount: bill.totalAmount,
        status: bill.status,
        generatedDate: bill.createdAt,
      };
    });
  }

  // Update bill status
  static async updateBillStatus(
    billId: string,
    status: "Pending" | "Overdue" | "Hold" | "Paid"
  ): Promise<BillData> {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    bill.status = status;
    if (status === "Paid") {
      bill.paidAt = new Date();
    }

    await bill.save();

    return this.getBillById(billId);
  }

  // Update bill details (tax, notes)
  static async updateBillDetails(
    billId: string,
    data: { tax?: number; notes?: string }
  ): Promise<BillData> {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    if (data.tax !== undefined) {
      if (data.tax < 0) {
        throw new AppError("Tax cannot be negative", 400);
      }
      bill.tax = data.tax;
      
      // Recalculate total amount
      const taxAmount = (bill.subtotal * bill.tax) / 100;
      bill.totalAmount = bill.subtotal + taxAmount;
    }

    if (data.notes !== undefined) {
      bill.notes = data.notes;
    }

    await bill.save();

    return this.getBillById(billId);
  }

  // Delete bill
  static async deleteBill(billId: string): Promise<void> {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    await bill.deleteOne();
  }
}
