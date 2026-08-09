import { Router } from "express";
import { walletController } from "../controllers/wallet.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", walletController.getWallet);
router.get("/transactions", walletController.listTransactions);

export default router;
