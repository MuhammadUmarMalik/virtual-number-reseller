import { Router } from "express";
import { productController } from "../controllers/product.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export const productRoutes = Router();

productRoutes.use(authenticate);

productRoutes.get("/filters", productController.getDistinctValues);
productRoutes.get("/", productController.list);
productRoutes.get("/:productId", productController.getById);

export default productRoutes;
