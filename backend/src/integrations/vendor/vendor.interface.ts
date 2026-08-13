import type {
  VendorActivation,
  VendorActivationStatus,
  VendorAvailability,
  VendorBalance,
  VendorCountry,
  VendorPurchaseParams,
  VendorActionResult,
  VendorService,
} from "./vendor.types.js";

export interface NumberVendor {
  readonly name: string;

  getBalance(): Promise<VendorBalance>;

  getServices(): Promise<VendorService[]>;

  getCountries(): Promise<VendorCountry[]>;

  getAvailability(params: {
    country: string;
    service: string;
    providerId?: string;
  }): Promise<VendorAvailability[]>;

  purchaseNumber(params: VendorPurchaseParams): Promise<VendorActivation>;

  getActivationStatus(
    activation: VendorActivation
  ): Promise<VendorActivationStatus>;

  cancelActivation(
    activation: VendorActivation
  ): Promise<VendorActionResult>;

  requestAnotherSms(
    activation: VendorActivation
  ): Promise<VendorActionResult>;

  completeActivation(
    activation: VendorActivation
  ): Promise<VendorActionResult>;
}
