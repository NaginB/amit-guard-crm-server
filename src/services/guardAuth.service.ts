import Guard from "../models/guard.model";
import Project from "../models/project.model";
import Site from "../models/site.model";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export const guardLogin = async (contactNumber: string, password: string) => {
  try {
    if (!contactNumber || !password) {
      return {
        success: false,
        error: "Please provide contact number and password!",
        statusCode: 400,
      };
    }

    const guard: any = await Guard.findOne({ contactNumber }).select(
      "+password"
    );

    if (!guard) {
      return {
        success: false,
        error: "No guard found with this contact number",
        statusCode: 404,
      };
    }

    // Check if guard has a password set
    if (!guard.password) {
      return {
        success: false,
        error: "Password not set for this guard. Please contact administrator.",
        statusCode: 401,
      };
    }

    if (!(await guard.correctPassword(password, guard.password))) {
      return {
        success: false,
        error: "Incorrect contact number or password",
        statusCode: 401,
      };
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN as string) || "90d";

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return {
        success: false,
        error: "JWT secret is not configured",
        statusCode: 500,
      };
    }

    const secret: Secret = jwtSecret;
    const options = {
      expiresIn: expiresIn as unknown as SignOptions["expiresIn"],
    } as SignOptions;

    // Include guard role and id in token payload
    const token = jwt.sign(
      { id: guard._id, role: "guard", guardId: guard.guardId },
      secret,
      options
    );

    // Store token in guard document
    guard.guardToken = token;
    await guard.save({ validateBeforeSave: false });

    // Get assigned sites for the guard
    const assignedSites = await getAssignedSites(guard._id);

    return {
      success: true,
      token,
      guard: {
        id: guard._id,
        guardId: guard.guardId,
        firstName: guard.firstName,
        lastName: guard.lastName,
        contactNumber: guard.contactNumber,
        email: guard.email,
        assignedSites,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred during login",
      statusCode: 500,
    };
  }
};

// Get assigned sites for a guard
export const getAssignedSites = async (guardId: any) => {
  try {
    // Find all active projects where the guard is assigned
    const projects = await Project.find({
      "guardAssignments.guardId": guardId,
      "guardAssignments.isActive": true,
      status: "Active",
      isDeleted: false,
    }).populate("siteId", "name address city state postalCode country");

    // Get unique sites from the projects
    const siteMap = new Map();
    projects.forEach((project: any) => {
      const site = project.siteId;
      if (site && !siteMap.has(site._id.toString())) {
        siteMap.set(site._id.toString(), {
          siteId: site._id,
          siteName: site.name,
          address: site.address,
          city: site.city,
          state: site.state,
          postalCode: site.postalCode,
          country: site.country,
        });
      }
    });

    return Array.from(siteMap.values());
  } catch (error) {
    console.error("Error getting assigned sites:", error);
    return [];
  }
};
