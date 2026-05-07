import { Document } from "mongoose";

export interface IInventory extends Document {
  name: string;
  description?: string;
  quantity: number; // Total quantity
  assignedQuantity: number; // Quantity assigned to guards
  unit: string; // e.g., "pieces", "pairs", "sets"
  isActive: boolean;
}
