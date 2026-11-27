import { Request, Response, NextFunction } from 'express';
import {
  getPackages, getPackageById, createPackage,
  updatePackage, deactivatePackage, getAgencyPackages,
} from './package.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { packageQuerySchema, createPackageSchema, updatePackageSchema } from './package.schema';
import prisma from '../../utils/prisma';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = packageQuerySchema.parse(req.query);
    const { packages, total, page, limit } = await getPackages(query);
    sendPaginated(res, packages, total, page, limit);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const pkg = await getPackageById(String(req.params.id), req.user);
    sendSuccess(res, pkg);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const data = createPackageSchema.parse(req.body);
    const agency = await prisma.agency.findUnique({ where: { userId: req.user.id } });
    if (!agency) throw new AppError('Agency profile not found', 404);
    const pkg = await createPackage(agency.id, data);
    sendCreated(res, pkg, 'Package created');
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const data = updatePackageSchema.parse(req.body);
    const isAdmin = req.user.role === 'ADMIN';
    let agencyId = '';
    if (!isAdmin) {
      const agency = await prisma.agency.findUnique({ where: { userId: req.user.id } });
      if (!agency) throw new AppError('Agency not found', 404);
      agencyId = agency.id;
    }
    const pkg = await updatePackage(String(req.params.id), agencyId, data, isAdmin);
    sendSuccess(res, pkg, 'Package updated');
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const isAdmin = req.user.role === 'ADMIN';
    let agencyId = '';
    if (!isAdmin) {
      const agency = await prisma.agency.findUnique({ where: { userId: req.user.id } });
      if (!agency) throw new AppError('Agency not found', 404);
      agencyId = agency.id;
    }
    await deactivatePackage(String(req.params.id), agencyId, isAdmin);
    sendSuccess(res, null, 'Package deactivated');
  } catch (err) { next(err); }
}

export async function listAgencyPackages(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const agency = await prisma.agency.findUnique({ where: { userId: req.user.id } });
    if (!agency) throw new AppError('Agency not found', 404);
    const query = packageQuerySchema.parse(req.query);
    const { packages, total, page, limit } = await getAgencyPackages(agency.id, query);
    sendPaginated(res, packages, total, page, limit);
  } catch (err) { next(err); }
}
