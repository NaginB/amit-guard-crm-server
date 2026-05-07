import { Schema, model } from "mongoose";
import { IProject } from "../interfaces/project.interface";
import { getNextSequence } from "./counter.model";

const projectSchema = new Schema<IProject>(
  {
    // Project Basic Info
    projectName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    projectId: {
      type: Number,
      unique: true,
      sparse: true,
    },

    // Project Details
    siteId: {
      type: String,
      required: true,
      ref: "Site",
    },

    // Project Timeline (removed at project level; handled per assignment)

    // Project Status
    status: {
      type: String,
      enum: ["Active", "Closed", "On Hold"],
      default: "Active",
    },

    // Guard Assignments
    guardAssignments: [
      new Schema(
        {
          guardId: {
            type: String,
            required: true,
            ref: "Guard",
          },
          startDate: {
            type: Date,
            required: true,
          },
          endDate: {
            type: Date,
          },
          guardName: {
            type: String,
            trim: true,
          },
          shiftType: {
            type: String,
            enum: ["Full Day", "Full Night", "Half Day", "Half Night"],
            required: true,
          },
          monthlyRate: {
            type: Number,
            required: true,
            min: 0,
          },
          assignedDate: {
            type: Date,
            default: Date.now,
          },
          assignedBy: {
            type: String,
            required: true,
          },
          isActive: {
            type: Boolean,
            default: true,
          },
        },
        { _id: false }
      ),
    ],

    // Financial Information
    totalMonthlyCost: {
      type: Number,
      default: 0,
    },
    totalProjectCost: {
      type: Number,
      default: 0,
    },

    // Project Management
    description: {
      type: String,
      trim: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
    },

    // System fields
    createdBy: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
projectSchema.index({ isDeleted: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ siteId: 1 });
projectSchema.index({
  "guardAssignments.startDate": 1,
  "guardAssignments.endDate": 1,
});
projectSchema.index({ "guardAssignments.guardId": 1 });
projectSchema.index({ createdBy: 1 });

// Auto-increment projectId middleware
projectSchema.pre("save", async function (next) {
  if (this.isNew && !this.projectId) {
    try {
      const nextId = await getNextSequence("projectId");
      this.projectId = nextId;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Calculate total monthly cost before saving
projectSchema.pre("save", function (next) {
  if (this.guardAssignments && this.guardAssignments.length > 0) {
    this.totalMonthlyCost = this.guardAssignments
      .filter((assignment) => assignment.isActive)
      .reduce((total, assignment) => total + assignment.monthlyRate, 0);
  } else {
    this.totalMonthlyCost = 0;
  }
  next();
});

// Calculate total monthly cost before updating
projectSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    const update = this.getUpdate() as any;

    if (update && update.guardAssignments) {
      const guardAssignments = update.guardAssignments;
      if (Array.isArray(guardAssignments)) {
        update.totalMonthlyCost = guardAssignments
          .filter((assignment: any) => assignment.isActive !== false)
          .reduce(
            (total: number, assignment: any) =>
              total + (assignment.monthlyRate || 0),
            0
          );
      }
    }

    next();
  }
);

const Project = model<IProject>("Project", projectSchema);

export default Project;
