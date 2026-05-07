import { Request, Response, NextFunction } from "express";
import { AnySchema } from "yup";
import ResponseHandler from "../utils/responseHandler";

export const validate =
  (schema: AnySchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Flatten body, params and query so schemas can define fields at the top level
      const validationData = {
        ...req.body,
        ...req.params,
        ...req.query,
      };

      await schema.validate(validationData);
      return next();
    } catch (error: any) {
      //console.log(error);
      return ResponseHandler.badRequest(res, error.message);
    }
  };
