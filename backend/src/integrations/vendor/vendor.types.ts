export interface VendorApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface VendorUserInfo {
  username: string;
  score: number;
  create_date: string;
}

export interface GetMobileParams {
  cuy?: string;
  pex?: string;
  pid: string;
  num: number;
  noblack: number;
  serial: number;
  secret_key?: string;
  vip?: string;
}

export type GetMobileResult = string | string[];

export interface GetMobileCodeParams {
  cuy?: string;
  pex?: string;
  pid: string;
  num: number;
  noblack: number;
  serial: number;
  secret_key?: string;
  vip?: string;
}

export type GetMobileCodeResult = string | string[];

export interface GetMsgParams {
  pid: string;
  pn: string;
  serial: number;
}

export type GetMsgResult = string;

export interface PassMobileParams {
  pid: string;
  pn: string;
  serial: number;
}

export interface AddBlackParams {
  pid: string;
  pn: string;
}

export interface GetStatusParams {
  pid: string;
  pn: string;
}

export interface GetCountryPhoneNumParams {
  pid?: string;
  vip?: string;
}

export type CountryStock = Record<string, number>;

export interface VendorNumber {
  phoneNumber: string;
  serial: number;
}

export interface VendorSmsMessage {
  rawMessage: string;
  otpCode: string;
}
