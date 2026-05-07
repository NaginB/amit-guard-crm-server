import { Schema, model } from "mongoose";
import { IInventory } from "../interfaces/inventory.interface";

const inventorySchema = new Schema<IInventory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    assignedQuantity: { type: Number, default: 0, min: 0 },
    unit: {
      type: String,
      required: true,
      trim: true,
      enum: ["pieces", "pairs", "sets", "units", "items"],
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

inventorySchema.index({ name: 1 });
inventorySchema.index({ isActive: 1 });

const Inventory = model<IInventory>("Inventory", inventorySchema);

export default Inventory;
