import { Request, Response } from "express";
import { SiteService } from "../services/site.service";
import ResponseHandler from "../utils/responseHandler";
import { AppError } from "../utils/AppError";

const siteService = new SiteService();

export const createSite = async (req: Request, res: Response) => {
  try {
    const site = await siteService.createSite(req.body);
    ResponseHandler.created(res, site, "Site created successfully");
  } catch (error) {
    if (error instanceof AppError) {
      ResponseHandler.error(res, error.message, error.statusCode);
    } else {
      ResponseHandler.internalError(res, "Internal server error");
    }
  }
};

export const getAllSites = async (req: Request, res: Response) => {
  try {
    const sites = await siteService.getAllSites();
    ResponseHandler.success(res, sites, "Sites retrieved successfully");
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const getActiveSites = async (req: Request, res: Response) => {
  try {
    const sites = await siteService.getActiveSites();
    ResponseHandler.success(res, sites, "Active sites retrieved successfully");
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const getSiteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return ResponseHandler.badRequest(res, "Site ID is required");
    }

    const site = await siteService.getSiteById(id);

    if (!site) {
      return ResponseHandler.notFound(res, "Site not found");
    }

    ResponseHandler.success(res, site, "Site retrieved successfully");
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const updateSite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return ResponseHandler.badRequest(res, "Site ID is required");
    }

    const site = await siteService.updateSite(id, req.body);

    if (!site) {
      return ResponseHandler.notFound(res, "Site not found");
    }

    ResponseHandler.success(res, site, "Site updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      ResponseHandler.error(res, error.message, error.statusCode);
    } else {
      ResponseHandler.internalError(res, "Internal server error");
    }
  }
};

export const deleteSite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return ResponseHandler.badRequest(res, "Site ID is required");
    }

    const site = await siteService.deleteSite(id);

    if (!site) {
      return ResponseHandler.notFound(res, "Site not found");
    }

    ResponseHandler.success(res, site, "Site deleted successfully");
  } catch (error) {
    if (error instanceof AppError) {
      ResponseHandler.error(res, error.message, error.statusCode);
    } else {
      ResponseHandler.internalError(res, "Internal server error");
    }
  }
};

export const searchSites = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return ResponseHandler.badRequest(res, "Search query is required");
    }

    const sites = await siteService.searchSites(query as string);
    ResponseHandler.success(res, sites, "Sites search completed successfully");
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const filterSitesByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    if (!type) {
      return ResponseHandler.badRequest(res, "Site type is required");
    }

    const sites = await siteService.filterSitesByType(type as string);
    ResponseHandler.success(res, sites, "Sites filtered by type successfully");
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};

export const filterSitesByCity = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    if (!city) {
      return ResponseHandler.badRequest(res, "City is required");
    }

    const sites = await siteService.filterSitesByCity(city as string);
    ResponseHandler.success(res, sites, "Sites filtered by city successfully");
  } catch (error) {
    ResponseHandler.internalError(res, "Internal server error");
  }
};
