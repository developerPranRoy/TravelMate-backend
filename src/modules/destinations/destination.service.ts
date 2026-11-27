import prisma from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';
import { generateSlug } from '../../utils/helpers';
import { getPaginationParams } from '../../utils/pagination';
import { packageSelect } from '../packages/package.service';
import type { CreateDestinationInput, UpdateDestinationInput, DestinationQuery } from './destination.schema';

export async function getDestinations(query: DestinationQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Record<string, unknown> = { isActive: true };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { country: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [destinations, total] = await Promise.all([
    prisma.destination.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.destination.count({ where }),
  ]);

  return { destinations, total, page, limit };
}

export async function getDestinationById(id: string) {
  const destination = await prisma.destination.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          packages: {
            where: { status: 'ACTIVE' },
          },
        },
      },
      packages: {
        where: { status: 'ACTIVE' },
        orderBy: { startDate: 'asc' },
        select: packageSelect,
      },
    },
  });

  if (!destination) {
    throw new AppError('Destination not found', 404);
  }

  if (!destination.isActive) {
    throw new AppError('Destination not found', 404);
  }

  return destination;
}

export async function createDestination(data: CreateDestinationInput) {
  const slug = generateSlug(data.name);

  // Ensure slug uniqueness
  const existingSlug = await prisma.destination.findUnique({ where: { slug } });
  if (existingSlug) {
    throw new AppError('A destination with a similar name already exists', 409);
  }

  const destination = await prisma.destination.create({
    data: {
      name: data.name,
      country: data.country,
      description: data.description,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      slug,
    },
  });

  return destination;
}

export async function updateDestination(id: string, data: UpdateDestinationInput) {
  const existing = await prisma.destination.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Destination not found', 404);
  }

  const updateData: Record<string, unknown> = { ...data };

  // Regenerate slug if name changes
  if (data.name && data.name !== existing.name) {
    const newSlug = generateSlug(data.name);

    const slugConflict = await prisma.destination.findFirst({
      where: { slug: newSlug, id: { not: id } },
    });
    if (slugConflict) {
      throw new AppError('A destination with a similar name already exists', 409);
    }

    updateData.slug = newSlug;
  }

  const destination = await prisma.destination.update({
    where: { id },
    data: updateData,
  });

  return destination;
}

export async function deleteDestination(id: string) {
  const existing = await prisma.destination.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Destination not found', 404);
  }

  // Check if destination has any associated packages
  const packageCount = await prisma.tourPackage.count({
    where: { destinationId: id },
  });

  if (packageCount > 0) {
    // Soft delete — set isActive to false
    await prisma.destination.update({
      where: { id },
      data: { isActive: false },
    });
    return { softDeleted: true, message: 'Destination deactivated (has associated packages)' };
  }

  // Hard delete — no packages reference this destination
  await prisma.destination.delete({ where: { id } });
  return { softDeleted: false, message: 'Destination permanently deleted' };
}
