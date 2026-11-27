import prisma from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';
import { generateSlug } from '../../utils/helpers';
import { getPaginationParams } from '../../utils/pagination';
import { CreatePackageInput, UpdatePackageInput, PackageQuery } from './package.schema';
import type { AuthUser } from '../../middleware/auth';
import { Prisma } from '@prisma/client';

export const packageSelect = {
  id: true, title: true, slug: true, description: true,
  price: true, durationDays: true, availableSeats: true,
  startDate: true, endDate: true, imageUrl: true, status: true,
  createdAt: true, updatedAt: true,
  agency: { select: { id: true, agencyName: true } },
  destination: { select: { id: true, name: true, country: true, slug: true } },
};

export async function getPackages(query: PackageQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const sortMap: Record<string, Prisma.TourPackageOrderByWithRelationInput> = {
    price_asc: { price: 'asc' },
    price_desc: { price: 'desc' },
    date_asc: { startDate: 'asc' },
    date_desc: { startDate: 'desc' },
  };
  const orderBy: Prisma.TourPackageOrderByWithRelationInput =
    query.sort ? sortMap[query.sort] : { startDate: 'asc' };

  const where: Prisma.TourPackageWhereInput = {
    status: 'ACTIVE',
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
    ...(query.destinationId && { destinationId: query.destinationId }),
    ...(query.minPrice !== undefined && { price: { gte: query.minPrice } }),
    ...(query.maxPrice !== undefined && { price: { lte: query.maxPrice } }),
    ...(query.startDate && { startDate: { gte: query.startDate } }),
  };

  const [packages, total] = await Promise.all([
    prisma.tourPackage.findMany({ where, skip, take: limit, orderBy, select: packageSelect }),
    prisma.tourPackage.count({ where }),
  ]);

  return { packages, total, page, limit };
}

export async function getPackageById(id: string, viewer?: AuthUser) {
  const pkg = await prisma.tourPackage.findUnique({ where: { id }, select: packageSelect });
  if (!pkg) throw new AppError('Package not found', 404);

  // Only ACTIVE packages are public. The owning agency (and admins) may still
  // open their own draft/inactive package to preview it.
  if (pkg.status !== 'ACTIVE' && !(await canManageAgencyPackage(pkg.agency.id, viewer))) {
    throw new AppError('Package not found', 404);
  }

  return pkg;
}

async function canManageAgencyPackage(agencyId: string, viewer?: AuthUser) {
  if (!viewer) return false;
  if (viewer.role === 'ADMIN') return true;
  if (viewer.role !== 'AGENCY') return false;

  const agency = await prisma.agency.findUnique({
    where: { userId: viewer.id },
    select: { id: true },
  });
  return agency?.id === agencyId;
}

export async function createPackage(agencyId: string, data: CreatePackageInput) {
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency || agency.status !== 'APPROVED') {
    throw new AppError('Your agency must be approved before creating packages', 403);
  }

  const slug = generateSlug(data.title);
  const existing = await prisma.tourPackage.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  return prisma.tourPackage.create({
    data: {
      ...data,
      slug: finalSlug,
      agencyId,
      price: new (require('@prisma/client').Prisma.Decimal)(data.price),
    },
    select: packageSelect,
  });
}

export async function updatePackage(id: string, agencyId: string, data: UpdatePackageInput, isAdmin: boolean) {
  const pkg = await prisma.tourPackage.findUnique({ where: { id } });
  if (!pkg) throw new AppError('Package not found', 404);
  if (!isAdmin && pkg.agencyId !== agencyId) throw new AppError('Not authorized to update this package', 403);

  const updateData: Record<string, unknown> = { ...data };
  if (data.price !== undefined) {
    updateData.price = new (require('@prisma/client').Prisma.Decimal)(data.price);
  }
  if (data.title && data.title !== pkg.title) {
    updateData.slug = generateSlug(data.title);
  }

  return prisma.tourPackage.update({ where: { id }, data: updateData, select: packageSelect });
}

export async function deactivatePackage(id: string, agencyId: string, isAdmin: boolean) {
  const pkg = await prisma.tourPackage.findUnique({ where: { id } });
  if (!pkg) throw new AppError('Package not found', 404);
  if (!isAdmin && pkg.agencyId !== agencyId) throw new AppError('Not authorized', 403);

  return prisma.tourPackage.update({ where: { id }, data: { status: 'INACTIVE' }, select: packageSelect });
}

export async function getAgencyPackages(agencyId: string, query: PackageQuery) {
  const { page, limit, skip } = getPaginationParams(query);
  const where: Prisma.TourPackageWhereInput = { agencyId };
  const [packages, total] = await Promise.all([
    prisma.tourPackage.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: packageSelect }),
    prisma.tourPackage.count({ where }),
  ]);
  return { packages, total, page, limit };
}
