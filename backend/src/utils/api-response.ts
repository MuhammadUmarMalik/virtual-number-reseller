export interface SuccessResponse<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: unknown[];
}

export function successResponse<T = undefined>(
  message: string,
  data?: T
): SuccessResponse<T> {
  return { success: true, message, data: data as T };
}

export function errorResponse(message: string, errors?: unknown[]): ErrorResponse {
  return { success: false, message, ...(errors ? { errors } : {}) };
}
