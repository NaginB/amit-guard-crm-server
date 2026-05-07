import express, { Express, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/database";
import guardRoutes from "./routes/guard.routes";
import uploadRoutes from "./routes/upload.routes";
import authRoutes from "./routes/auth.routes";
import inventoryRoutes from "./routes/inventory.routes";
import siteRoutes from "./routes/site.routes";
import projectRoutes from "./routes/project.routes";
import attendanceRoutes from "./routes/attendance.routes";
import weeklyOffRoutes from "./routes/weeklyOff.routes";
import salarySlipRoutes from "./routes/salarySlip.routes";
import billRoutes from "./routes/bill.routes";
import { errorHandler } from "./middleware/errorHandler";

const app: Express = express();
const port = 3000;

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Frontend URLs
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "15mb" }));

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use("/api/v1/guards", guardRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/upload", uploadRoutes);
// app.use("/api/v1/inventories", inventoryRoutes);
// app.use("/api/v1/sites", siteRoutes);
// app.use("/api/v1/projects", projectRoutes);
// app.use("/api/v1/attendance", attendanceRoutes);
// app.use("/api/v1/weekly-off", weeklyOffRoutes);
// app.use("/api/v1/salary-slip", salarySlipRoutes);
// app.use("/api/v1/bills", billRoutes);

app.use(errorHandler);

connectDB();

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
