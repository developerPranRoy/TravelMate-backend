import prisma from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';
import { generateBookingReference } from '../../utils/helpers';
import { getPaginationParams } from '../../utils/pagination';
import { CreateBookingInput, BookingQuery, UpdateBookingStatusInput } from './booking.schema';
import { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';

const bookingInclude = {
  tourPackage: {
    select: {
      id: true, title: true, startDate: true, endDate: true, imageUrl: true,
      agency: { select: { id: true, agencyName: true } },
    },
  },
  payment: { select: { id: true, amount: true, status: true } },
};

export async function createBooking(customerId: string, data: CreateBookingInput) {
  return prisma.$transaction(async (tx) => {
    const pkg = await tx.tourPackage.findUnique({ where: { id: data.packageId } });
    if (!pkg) throw new AppError('Package not found', 404);
    if (pkg.status !== 'ACTIVE') throw new AppError('Package is not available for booking', 409);

    const now = new Date();
    if (pkg.startDate <= now) throw new AppError('Package departure date has passed', 409);
    if (pkg.availableSeats < data.travelerCount)
      throw new AppError(`Only ${pkg.availableSeats} seat(s) available`, 409);

    const agency = await tx.agency.findUnique({ where: { id: pkg.agencyId } });
    if (!agency || agency.status !== 'APPROVED')
      throw new AppError('Agency is not approved', 409);

    const totalPrice = new Prisma.Decimal(pkg.price).mul(data.travelerCount);

    await tx.tourPackage.update({
      where: { id: pkg.id },
      data: { availableSeats: { decrement: data.travelerCount } },
    });

    const booking = await tx.booking.create({
      data: {
        bookingReference: generateBookingReference(),
        customerId,
        packageId: pkg.id,
        travelerCount: data.travelerCount,
        unitPrice: pkg.price,
        totalPrice,
        status: 'PENDING',
        payment: { create: { amount: totalPrice, status: 'UNPAID' } },
      },
      include: bookingInclude,
    });

    return booking;
  });
}

export async function getCustomerBookings(customerId: string, query: BookingQuery) {
  const { page, limit, skip } = getPaginationParams(query);
  const where: Prisma.BookingWhereInput = {
    customerId,
    ...(query.status && { status: query.status }),
  };
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: bookingInclude }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, total, page, limit };
}

export async function getBookingById(id: string, userId: string, role: Role) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!booking) throw new AppError('Booking not found', 404);

  if (role === 'ADMIN') return booking;
  if (role === 'CUSTOMER' && booking.customerId !== userId)
    throw new AppError('Booking not found', 404);
  if (role === 'AGENCY') {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) throw new AppError('Booking not found', 404);
    const pkg = await prisma.tourPackage.findFirst({ where: { id: booking.packageId, agencyId: agency.id } });
    if (!pkg) throw new AppError('Booking not found', 404);
  }

  return booking;
}

export async function cancelBooking(id: string, customerId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id } });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.customerId !== customerId) throw new AppError('Not authorized', 403);
    if (booking.status !== 'PENDING') throw new AppError('Only pending bookings can be cancelled', 409);

    await tx.tourPackage.update({
      where: { id: booking.packageId },
      data: { availableSeats: { increment: booking.travelerCount } },
    });

    return tx.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: bookingInclude,
    });
  });
}

export async function getAgencyBookings(agencyId: string, query: BookingQuery) {
  const { page, limit, skip } = getPaginationParams(query);
  const where: Prisma.BookingWhereInput = {
    tourPackage: { agencyId },
    ...(query.status && { status: query.status }),
  };
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: bookingInclude }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, total, page, limit };
}

export async function updateBookingStatus(id: string, agencyId: string, data: UpdateBookingStatusInput) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: { tourPackage: true } });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.tourPackage.agencyId !== agencyId) throw new AppError('Not authorized', 403);
  if (booking.status === 'CANCELLED') throw new AppError('Cannot update a cancelled booking', 409);

  return prisma.booking.update({ where: { id }, data: { status: data.status }, include: bookingInclude });
}
