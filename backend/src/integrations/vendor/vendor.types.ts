export interface VendorBalance {
  balance: string;
  currency: string;
}

export interface VendorService {
  code: string;
  name: string;
}

export interface VendorCountry {
  id: number;
  name: string;
  isoCode?: string;
}

export interface VendorAvailability {
  country: string;
  service: string;
  cost: string;
  count: number;
  providerId?: string;
}

export interface VendorPurchaseParams {
  service: string;
  country: string;
  maxPrice?: string;
  minPrice?: string;
  quantity: number;
  secretKey?: string;
  vip?: string;
  providerIds?: string;
}

export interface VendorActivation {
  vendorActivationId: string;
  phoneNumber: string;
  cost: string;
  countryCode: string;
  canGetAnotherSms: boolean | null;
  operator?: string | null;
  additionalData?: Record<string, unknown>;
}

export interface VendorActivationStatus {
  status: "WAITING" | "SMS_RECEIVED" | "CANCELLED" | "COMPLETED";
  otp?: string;
}

export interface VendorActionResult {
  success: boolean;
  message: string;
}

export interface SmsBowerWebhookPayload {
  activationId: number;
  service: string;
  text: string;
  code: string;
  country: number;
  receivedAt: string;
}
