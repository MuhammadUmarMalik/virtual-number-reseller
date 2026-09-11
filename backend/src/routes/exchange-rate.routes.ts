import { Router } from "express";
import { exchangeRateController } from "../controllers/exchange-rate.controller.js";

const router = Router();

router.get("/", exchangeRateController.getRates);

export default router;