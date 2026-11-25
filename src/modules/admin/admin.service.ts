import prisma from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';
import { AgencyStatus, Prisma } from '@prisma/client';
import { AdminQueryInput } from './admin.schema';
import { getPaginationParams } from '../../utils/pagination';

/**
 * Get dashboard statistics for the admin overview.
 */
export async function getDashboard() {
  const [
    totalUsers,
    totalAgencies,
    totalPackages,
    totalBookings,
    pendingAgencies,
    activePackages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.agency.count(),
    prisma.tourPackage.count(),
    prisma.booking.count(),
    prisma.agency.count({ where: { status: 'PENDING' } }),
    prisma.tourPackage.count({ where: { status: 'ACTIVE' } }),
  ]);

  return {
    totalUsers,
    totalAgencies,
    totalPackages,
    totalBookings,
    pendingAgencies,
    activePackages,
  };
}

/**
 * Get a paginated list of users with optional search and role filter.
 * Excludes passwordHash from the results.
 */
export async function getUsers(query: AdminQueryInput) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.UserWhereInput = {};

  // Search by name or email
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  // Filter by role
  if (query.role) {
    where.role = query.role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        agency: {
          select: {
            id: true,
            agencyName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

/**
 * Update an agency's status (approve or suspend).
 */
export async function updateAgencyStatus(agencyId: string, status: AgencyStatus) {
  // Verify the agency exists
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { id: true, status: true, agencyName: true },
  });

  if (!agency) {
    throw new AppError('Agency not found', 404);
  }

  // Prevent setting the same status
  if (agency.status === status) {
    throw new AppError(`Agency is already ${status}`, 400);
  }

  const updatedAgency = await prisma.agency.update({
    where: { id: agencyId },
    data: { status },
    select: {
      id: true,
      agencyName: true,
      status: true,
      contactNumber: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedAgency;
}

/**
 * Get a paginated list of all bookings with customer and package info.
 * Optionally filter by booking status.
 */
export async function getBookings(query: AdminQueryInput) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.BookingWhereInput = {};

  // Filter by booking status
  if (query.status) {
    where.status = query.status;
  }

  // Search by booking reference or customer name/email
  if (query.search) {
    where.OR = [
      { bookingReference: { contains: query.search, mode: 'insensitive' } },
      { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      { customer: { email: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      select: {
        id: true,
        bookingReference: true,
        travelerCount: true,
        unitPrice: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tourPackage: {
          select: {
            id: true,
            title: true,
            slug: true,
            durationDays: true,
            startDate: true,
            endDate: true,
            agency: {
              select: {
                id: true,
                agencyName: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, limit };
}
