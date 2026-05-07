import { Request, Response } from "express";
import { InventoryService } from "../services/inventory.service";
import ResponseHandler from "../utils/responseHandler";
import { AppError } from "../utils/AppError";

const inventoryService = new InventoryService();

export const createInventory = async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.createInventory(req.body);
    ResponseHandler.created(res, inventory, "Inventory created successfully");
  } catch (error) {
    if (error instanceof AppError) {
      ResponseHandler.error(res, error.message, error.statusCode);
    } else {
      ResponseHandler.internalError(res, "Internal server error");
    }
  }
};

export const getAllInventories = async (req: Request, res: Response) => {
  try {
    const inventories = await inventoryService.getAllInventories();
    ResponseHandler.success(
      res,
      inventories,
      "Inventories retrieved successfully"
    );
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const getActiveInventories = async (req: Request, res: Response) => {
  try {
    const inventories = await inventoryService.getActiveInventories();
    ResponseHandler.success(
      res,
      inventories,
      "Active inventories retrieved successfully"
    );
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return ResponseHandler.badRequest(res, "Inventory ID is required");
    }

    const inventory = await inventoryService.getInventoryById(id);

    if (!inventory) {
      return ResponseHandler.notFound(res, "Inventory not found");
    }

    ResponseHandler.success(res, inventory, "Inventory retrieved successfully");
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const updateInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return ResponseHandler.badRequest(res, "Inventory ID is required");
    }

    const inventory = await inventoryService.updateInventory(id, req.body);

    if (!inventory) {
      return ResponseHandler.notFound(res, "Inventory not found");
    }

    ResponseHandler.success(res, inventory, "Inventory updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      ResponseHandler.error(res, error.message, error.statusCode);
    } else {
      ResponseHandler.internalError(res, "Internal server error");
    }
  }
};

export const deleteInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return ResponseHandler.badRequest(res, "Inventory ID is required");
    }

    const inventory = await inventoryService.deleteInventory(id);

    if (!inventory) {
      return ResponseHandler.notFound(res, "Inventory not found");
    }

    ResponseHandler.success(res, inventory, "Inventory deleted successfully");
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const syncInventoryQuantities = async (req: Request, res: Response) => {
  try {
    await inventoryService.syncInventoryQuantities();
    ResponseHandler.success(
      res,
      null,
      "Inventory quantities synchronized successfully"
    );
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const checkInventoryAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return ResponseHandler.badRequest(res, "Inventory ID is required");
    }

    const isAssigned = await inventoryService.isInventoryAssignedToGuards(id);
    const guards = await inventoryService.getGuardsAssignedToInventory(id);

    ResponseHandler.success(
      res,
      {
        isAssigned,
        assignedGuards: guards.map((guard) => ({
          id: guard._id,
          name: `${guard.firstName} ${guard.lastName}`,
          assignedQuantity:
            guard.assignedInventories.find((inv: any) => inv.inventoryId === id)
              ?.assignedQuantity || 0,
        })),
      },
      "Inventory assignment status retrieved successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      ResponseHandler.error(res, error.message, error.statusCode);
    } else {
      ResponseHandler.internalError(res, "Internal server error");
    }
  }
};
