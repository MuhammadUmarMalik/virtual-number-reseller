import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import { smsbowerCatalogController } from "../controllers/smsbower-catalog.controller.js";

export const smsbowerCatalogRoutes = Router();

smsbowerCatalogRoutes.use(authenticate, requireAdmin);

smsbowerCatalogRoutes.get("/services", smsbowerCatalogController.getServices);
smsbowerCatalogRoutes.get("/countries", smsbowerCatalogController.getCountries);
smsbowerCatalogRoutes.get("/top-countries", smsbowerCatalogController.getTopCountries);
smsbowerCatalogRoutes.get("/stock", smsbowerCatalogController.getStock);
smsbowerCatalogRoutes.get("/balance", smsbowerCatalogController.getBalance);
