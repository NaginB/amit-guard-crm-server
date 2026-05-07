import Guard from "../models/guard.model";
import { IGuard } from "../interfaces/guard.interface";
import { AppError } from "../utils/AppError";
import { InventoryService } from "./inventory.service";
import crypto from "crypto";

const inventoryService = new InventoryService();

// Generate a random secure password
const generatePassword = (): string => {
  const length = 10;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomBytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    const byte = randomBytes.readUInt8(i);
    password += charset[byte % charset.length];
  }
  return password;
};

export const createGuard = async (
  guardData: Partial<IGuard>,
): Promise<{ guard: IGuard; password: string }> => {
  try {
    // Optional pre-check to provide clearer, field-specific errors
    const duplicate = await Guard.findOne({
      isDeleted: false,
      $or: [
        guardData.contactNumber
          ? { contactNumber: guardData.contactNumber }
          : undefined,
        guardData.email ? { email: guardData.email } : undefined,
        guardData.aadharNumber
          ? { aadharNumber: guardData.aadharNumber }
          : undefined,
        guardData.panNumber ? { panNumber: guardData.panNumber } : undefined,
      ].filter(Boolean) as any,
    }).lean();

    if (duplicate) {
      throw new AppError(
        "A guard with provided contact/email/Aadhar/PAN already exists",
        409,
      );
    }

    // Generate auto password if not provided
    const plainPassword = guardData.password || generatePassword();
    const guardWithPassword = { ...guardData, password: plainPassword };

    const guard = new Guard(guardWithPassword);
    const savedGuard = await guard.save();

    // Update inventory quantities if inventories are assigned
    if (
      savedGuard.assignedInventories &&
      savedGuard.assignedInventories.length > 0
    ) {
      for (const assignedInventory of savedGuard.assignedInventories) {
        // Validate that inventory is active before assignment
        const inventory = await inventoryService.getInventoryById(
          assignedInventory.inventoryId,
        );
        if (!inventory || !inventory.isActive) {
          throw new AppError(
            `Cannot assign disabled inventory: ${assignedInventory.inventoryName}`,
            400,
          );
        }

        await inventoryService.assignInventoryQuantity(
          assignedInventory.inventoryId,
          assignedInventory.assignedQuantity,
        );
      }
    }

    // Return guard and plain password
    return { guard: savedGuard, password: plainPassword };
  } catch (error: any) {
    // Mongo duplicate key error fallback
    if (error?.code === 11000) {
      const key = Object.keys(error.keyValue || {})[0];
      const message = key
        ? `Duplicate ${key}: ${(error.keyValue as any)[key]}`
        : "Duplicate value";
      throw new AppError(message, 409);
    }
    throw error;
  }
};

export const getAllGuards = async (): Promise<IGuard[]> => {
  return await Guard.find({});
};

export const getGuardById = async (id: string): Promise<IGuard | null> => {
  return await Guard.findById(id);
};

export const updateGuardById = async (
  id: string,
  guardData: Partial<IGuard>,
): Promise<IGuard | null> => {
  try {
    // Get the existing guard to compare inventory assignments
    const existingGuard = await Guard.findById(id);
    if (!existingGuard) {
      throw new AppError("Guard not found", 404);
    }

    // Avoid conflicts when updating to values used by another document
    const fieldsToCheck = [
      guardData.contactNumber && { contactNumber: guardData.contactNumber },
      guardData.email && { email: guardData.email },
      guardData.aadharNumber && { aadharNumber: guardData.aadharNumber },
      guardData.panNumber && { panNumber: guardData.panNumber },
    ].filter(Boolean) as Array<Record<string, unknown>>;

    if (fieldsToCheck.length > 0) {
      const conflict = await Guard.findOne({
        _id: { $ne: id },
        $or: fieldsToCheck,
      }).lean();
      if (conflict) {
        throw new AppError(
          "Another guard already uses the provided contact/email/ID",
          409,
        );
      }
    }

    // Store old inventories before updating
    const oldInventories = existingGuard.assignedInventories || [];

    // Update guard fields - if password is provided, it will be hashed by pre-save hook
    Object.assign(existingGuard, guardData);

    // Save to trigger pre-save hook for password hashing
    const guard = await existingGuard.save();

    // Handle inventory quantity changes
    const newInventories = guard.assignedInventories || [];

    // Create maps for easier comparison
    const oldInventoryMap = new Map(
      oldInventories.map((inv) => [inv.inventoryId, inv.assignedQuantity]),
    );
    const newInventoryMap = new Map(
      newInventories.map((inv) => [inv.inventoryId, inv.assignedQuantity]),
    );

    // Process inventory changes
    const allInventoryIds = new Set([
      ...oldInventoryMap.keys(),
      ...newInventoryMap.keys(),
    ]);

    for (const inventoryId of allInventoryIds) {
      const oldQuantity = oldInventoryMap.get(inventoryId) || 0;
      const newQuantity = newInventoryMap.get(inventoryId) || 0;

      if (oldQuantity !== newQuantity) {
        if (newQuantity > oldQuantity) {
          // Validate that inventory is active before assignment
          const inventory =
            await inventoryService.getInventoryById(inventoryId);
          if (!inventory || !inventory.isActive) {
            throw new AppError(
              `Cannot assign disabled inventory: ${
                inventory?.name || inventoryId
              }`,
              400,
            );
          }

          // Assign additional quantity
          await inventoryService.assignInventoryQuantity(
            inventoryId,
            newQuantity - oldQuantity,
          );
        } else if (newQuantity < oldQuantity) {
          // Unassign quantity
          await inventoryService.unassignInventoryQuantity(
            inventoryId,
            oldQuantity - newQuantity,
          );
        }
      }
    }

    return guard;
  } catch (error: any) {
    if (error?.code === 11000) {
      const key = Object.keys(error.keyValue || {})[0];
      const message = key
        ? `Duplicate ${key}: ${(error.keyValue as any)[key]}`
        : "Duplicate value";
      throw new AppError(message, 409);
    }
    throw error;
  }
};

export const deleteGuardById = async (id: string): Promise<IGuard | null> => {
  const guard = await Guard.findById(id);
  if (!guard) {
    throw new AppError("Guard not found", 404);
  }

  // Unassign all inventory quantities when guard is deleted
  if (guard.assignedInventories && guard.assignedInventories.length > 0) {
    for (const assignedInventory of guard.assignedInventories) {
      try {
        await inventoryService.unassignInventoryQuantity(
          assignedInventory.inventoryId,
          assignedInventory.assignedQuantity,
        );
      } catch (error) {
        // Log error but don't fail the guard deletion
        console.error(
          `Failed to unassign inventory ${assignedInventory.inventoryId}:`,
          error,
        );
      }
    }
  }

  // Hard delete - completely remove from database
  await Guard.findByIdAndDelete(id);
  return guard as IGuard;
};
