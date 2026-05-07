import Inventory from "../models/inventory.model";
import { IInventory } from "../interfaces/inventory.interface";
import { AppError } from "../utils/AppError";

export class InventoryService {
  async createInventory(
    inventoryData: Partial<IInventory>
  ): Promise<IInventory> {
    // Check for duplicate name
    const existingInventory = await Inventory.findOne({
      name: inventoryData.name?.toLowerCase(),
    });

    if (existingInventory) {
      throw new AppError("Inventory with this name already exists", 400);
    }

    // Automatically disable inventory if quantity is 0
    const isActive =
      inventoryData.quantity && inventoryData.quantity > 0 ? true : false;

    const inventory = new Inventory({
      ...inventoryData,
      isActive,
    });
    return await inventory.save();
  }

  async getAllInventories(): Promise<IInventory[]> {
    return await Inventory.find({}).sort({ name: 1 });
  }

  async getActiveInventories(): Promise<IInventory[]> {
    return await Inventory.find({}).sort({ name: 1 });
  }

  async getInventoryById(id: string): Promise<IInventory | null> {
    return await Inventory.findById(id);
  }

  async updateInventory(
    id: string,
    updateData: Partial<IInventory>
  ): Promise<IInventory | null> {
    const existingInventory = await Inventory.findById(id);
    if (!existingInventory) {
      throw new AppError("Inventory not found", 404);
    }

    // Check for duplicate name if name is being updated
    if (updateData.name) {
      const duplicateInventory = await Inventory.findOne({
        name: updateData.name.toLowerCase(),
        _id: { $ne: id },
      });

      if (duplicateInventory) {
        throw new AppError("Inventory with this name already exists", 400);
      }
    }

    // Validate quantity update
    if (updateData.quantity !== undefined) {
      if (updateData.quantity < existingInventory.assignedQuantity) {
        throw new AppError(
          `Cannot reduce quantity below assigned amount. Current assigned: ${existingInventory.assignedQuantity}, New quantity: ${updateData.quantity}`,
          400
        );
      }

      // Automatically disable inventory if quantity is 0
      if (updateData.quantity === 0) {
        updateData.isActive = false;
      } else if (updateData.isActive === undefined) {
        // Keep current active status if not explicitly set
        updateData.isActive = existingInventory.isActive;
      }
    }

    return await Inventory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteInventory(id: string): Promise<IInventory | null> {
    const inventory = await Inventory.findById(id);
    if (!inventory) {
      throw new AppError("Inventory not found", 404);
    }

    // Check if inventory is assigned to any guards
    if (inventory.assignedQuantity > 0) {
      // Import Guard model here to avoid circular dependency
      const Guard = (await import("../models/guard.model")).default;

      const guardsWithInventory = await Guard.find({
        "assignedInventories.inventoryId": id,
      });

      if (guardsWithInventory.length > 0) {
        const guardNames = guardsWithInventory
          .map((guard) => `${guard.firstName} ${guard.lastName}`)
          .join(", ");
        throw new AppError(
          `Cannot delete inventory "${inventory.name}" as it is assigned to guard(s): ${guardNames}. Please unassign the inventory from all guards first.`,
          400
        );
      }
    }

    // Hard delete - completely remove from database
    await Inventory.findByIdAndDelete(id);
    return inventory as IInventory;
  }

  async getInventoryByName(name: string): Promise<IInventory | null> {
    return await Inventory.findOne({
      name: name.toLowerCase(),
    });
  }

  async assignInventoryQuantity(
    inventoryId: string,
    quantity: number
  ): Promise<IInventory | null> {
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      throw new AppError("Inventory not found", 404);
    }

    if (!inventory.isActive) {
      throw new AppError(
        `Cannot assign disabled inventory: ${inventory.name}`,
        400
      );
    }

    const availableQuantity = inventory.quantity - inventory.assignedQuantity;
    if (availableQuantity < quantity) {
      throw new AppError(
        `Insufficient inventory. Available: ${availableQuantity}, Requested: ${quantity}`,
        400
      );
    }

    return await Inventory.findByIdAndUpdate(
      inventoryId,
      { $inc: { assignedQuantity: quantity } },
      { new: true }
    );
  }

  async unassignInventoryQuantity(
    inventoryId: string,
    quantity: number
  ): Promise<IInventory | null> {
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      throw new AppError("Inventory not found", 404);
    }

    if (inventory.assignedQuantity < quantity) {
      throw new AppError(
        `Cannot unassign more than assigned. Assigned: ${inventory.assignedQuantity}, Requested: ${quantity}`,
        400
      );
    }

    return await Inventory.findByIdAndUpdate(
      inventoryId,
      { $inc: { assignedQuantity: -quantity } },
      { new: true }
    );
  }

  async getAvailableQuantity(inventoryId: string): Promise<number> {
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      throw new AppError("Inventory not found", 404);
    }
    return inventory.quantity - inventory.assignedQuantity;
  }

  async isInventoryAssignedToGuards(inventoryId: string): Promise<boolean> {
    // Import Guard model here to avoid circular dependency
    const Guard = (await import("../models/guard.model")).default;

    const guardsWithInventory = await Guard.countDocuments({
      isDeleted: false,
      "assignedInventories.inventoryId": inventoryId,
    });

    return guardsWithInventory > 0;
  }

  async getGuardsAssignedToInventory(inventoryId: string): Promise<any[]> {
    // Import Guard model here to avoid circular dependency
    const Guard = (await import("../models/guard.model")).default;

    return await Guard.find({
      "assignedInventories.inventoryId": inventoryId,
    }).select("firstName lastName assignedInventories.$");
  }

  async syncInventoryQuantities(): Promise<void> {
    // Reset all assigned quantities to 0
    await Inventory.updateMany({}, { assignedQuantity: 0 });

    // Import Guard model here to avoid circular dependency
    const Guard = (await import("../models/guard.model")).default;

    // Get all guards with assigned inventories
    const guards = await Guard.find({
      assignedInventories: { $exists: true, $ne: [] },
    });

    // Recalculate assigned quantities
    for (const guard of guards) {
      if (guard.assignedInventories && guard.assignedInventories.length > 0) {
        for (const assignedInventory of guard.assignedInventories) {
          await Inventory.findByIdAndUpdate(assignedInventory.inventoryId, {
            $inc: { assignedQuantity: assignedInventory.assignedQuantity },
          });
        }
      }
    }
  }
}
