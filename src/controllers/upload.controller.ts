import { Request, Response, NextFunction } from "express";
import cloudinary from "../utils/cloudinary";
import ResponseHandler from "../utils/responseHandler";
import { AppError } from "../utils/AppError";

// Accepts JSON body: { dataUrl: string, folder?: string }
export const uploadSingleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dataUrl, folder } = req.body as {
      dataUrl?: string;
      folder?: string;
    };
    if (!dataUrl) {
      return next(new AppError("No dataUrl provided", 400));
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: folder || "guard-crm",
    });

    return ResponseHandler.created(
      res,
      { url: result.secure_url, publicId: result.public_id },
      "File uploaded"
    );
  } catch (error) {
    next(error);
  }
};

export const deleteUploadHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { publicId } = req.body as { publicId?: string };
    if (!publicId) return next(new AppError("publicId is required", 400));

    // Normalize: accept either a raw publicId (e.g. "guard-crm/abc123")
    // or a full Cloudinary URL; also strip file extensions if present
    let normalizedId = publicId.trim();
    if (/^https?:\/\//i.test(normalizedId)) {
      // Extract the path after '/upload/' and drop version and extension
      const match = normalizedId.match(
        /\/upload\/(?:v\d+\/)?([^\.]+)(?:\.[a-zA-Z0-9]+)?$/
      );
      if (match && match[1]) normalizedId = match[1];
    }
    // Remove extension if included in id
    normalizedId = normalizedId.replace(/\.[a-zA-Z0-9]+$/, "");

    const result = await cloudinary.uploader.destroy(normalizedId, {
      resource_type: "image",
      invalidate: true, // purge CDN cached versions
    });

    // Cloudinary returns { result: 'ok' } on success, 'not found' if missing
    if (result.result !== "ok") {
      return next(
        new AppError(`Cloudinary delete failed: ${result.result}`, 404)
      );
    }

    return ResponseHandler.success(
      res,
      { deleted: true, cloudinary: result, publicId: normalizedId },
      "File deleted"
    );
  } catch (error) {
    next(error);
  }
};
