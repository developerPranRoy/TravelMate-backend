import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function sendSuccess<T>(res: Response, data: T, message = 'Request completed', statusCode = 200) {
  const response: SuccessResponse<T> = { success: true, data, message };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message = 'Resource created') {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Request completed'
) {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(200).json(response);
}

export function sendError(res: Response, message: string, statusCode = 400, errors?: { field: string; message: string }[]) {
  const response: ErrorResponse = { success: false, message, errors };
  return res.status(statusCode).json(response);
}
