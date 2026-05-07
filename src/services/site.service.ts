import Site from "../models/site.model";
import { ISite } from "../interfaces/site.interface";
import { AppError } from "../utils/AppError";

export class SiteService {
  async createSite(siteData: Partial<ISite>): Promise<ISite> {
    // Check for duplicate name
    const existingSite = await Site.findOne({
      name: siteData.name?.toLowerCase(),
    });

    if (existingSite) {
      throw new AppError("Site with this name already exists", 400);
    }

    const site = new Site({
      ...siteData,
      name: siteData.name?.toLowerCase(),
    });
    return (await site.save()) as ISite;
  }

  async getAllSites(): Promise<ISite[]> {
    return (await Site.find({}).sort({ name: 1 })) as ISite[];
  }

  async getActiveSites(): Promise<ISite[]> {
    return (await Site.find({}).sort({ name: 1 })) as ISite[];
  }

  async getSiteById(id: string): Promise<ISite | null> {
    return await Site.findById(id);
  }

  async updateSite(
    id: string,
    updateData: Partial<ISite>
  ): Promise<ISite | null> {
    const existingSite = await Site.findById(id);
    if (!existingSite) {
      throw new AppError("Site not found", 404);
    }

    // Check for duplicate name if name is being updated
    if (updateData.name) {
      const duplicateSite = await Site.findOne({
        name: updateData.name.toLowerCase(),
        _id: { $ne: id },
      });

      if (duplicateSite) {
        throw new AppError("Site with this name already exists", 400);
      }

      updateData.name = updateData.name.toLowerCase();
    }

    return await Site.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteSite(id: string): Promise<ISite | null> {
    const site = await Site.findById(id);
    if (!site) {
      throw new AppError("Site not found", 404);
    }

    // Hard delete - completely remove from database
    await Site.findByIdAndDelete(id);
    return site as ISite;
  }

  async getSiteByName(name: string): Promise<ISite | null> {
    return await Site.findOne({
      name: name.toLowerCase(),
    });
  }

  async searchSites(query: string): Promise<ISite[]> {
    const searchRegex = new RegExp(query, "i");
    return (await Site.find({
      $or: [
        { name: searchRegex },
        { city: searchRegex },
        { siteType: searchRegex },
        { address: searchRegex },
      ],
    }).sort({ name: 1 })) as ISite[];
  }

  async filterSitesByType(siteType: string): Promise<ISite[]> {
    return (await Site.find({ siteType }).sort({
      name: 1,
    })) as ISite[];
  }

  async filterSitesByCity(city: string): Promise<ISite[]> {
    return (await Site.find({
      city: new RegExp(city, "i"),
    }).sort({ name: 1 })) as ISite[];
  }
}
