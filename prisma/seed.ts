import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@travelmate.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@travelmate.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Agency user
  const agencyHash = await bcrypt.hash('agency123', 12);
  const agencyUser = await prisma.user.upsert({
    where: { email: 'agency@travelmate.com' },
    update: {},
    create: {
      name: 'Sunrise Travels',
      email: 'agency@travelmate.com',
      passwordHash: agencyHash,
      role: 'AGENCY',
      agency: {
        create: {
          agencyName: 'Sunrise Travels',
          description: 'Leading travel agency in Bangladesh specializing in domestic and international tours.',
          contactNumber: '+8801711000000',
          status: 'APPROVED',
        },
      },
    },
  });
  console.log('✅ Agency user created:', agencyUser.email);

  // Customer user
  const customerHash = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@travelmate.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'customer@travelmate.com',
      passwordHash: customerHash,
      role: 'CUSTOMER',
    },
  });
  console.log('✅ Customer created:', customer.email);

  // Destinations
  const destinations = [
    {
      name: "Cox's Bazar",
      country: 'Bangladesh',
      slug: 'coxs-bazar',
      description: "World's longest natural sea beach stretching 120 km along the Bay of Bengal. A paradise for beach lovers with stunning sunsets and fresh seafood.",
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      isActive: true,
    },
    {
      name: 'Sundarbans',
      country: 'Bangladesh',
      slug: 'sundarbans',
      description: 'The world\'s largest mangrove forest, home to the Royal Bengal Tiger. A UNESCO World Heritage Site offering unique eco-tourism experiences.',
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      isActive: true,
    },
    {
      name: "Bandarban",
      country: 'Bangladesh',
      slug: 'bandarban',
      description: 'Breathtaking hill district with lush green mountains, waterfalls, tribal culture, and the highest peaks in Bangladesh.',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      isActive: true,
    },
    {
      name: 'Sylhet',
      country: 'Bangladesh',
      slug: 'sylhet',
      description: 'Tea garden capital of Bangladesh with rolling green hills, crystal clear rivers, and ancient shrines. Known for its natural beauty.',
      imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
      isActive: true,
    },
    {
      name: 'Rangamati',
      country: 'Bangladesh',
      slug: 'rangamati',
      description: 'Lake district in the Chittagong Hill Tracts with stunning Kaptai Lake, tribal crafts, and boat rides through scenic waterways.',
      imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
      isActive: true,
    },
  ];

  for (const dest of destinations) {
    await prisma.destination.upsert({
      where: { slug: dest.slug },
      update: {},
      create: dest,
    });
  }
  console.log('✅ Destinations seeded');

  // Get agency and destinations
  const agency = await prisma.agency.findUnique({ where: { userId: agencyUser.id } });
  if (!agency) throw new Error('Agency not found');

  const coxsBazar = await prisma.destination.findUnique({ where: { slug: 'coxs-bazar' } });
  const sundarbans = await prisma.destination.findUnique({ where: { slug: 'sundarbans' } });
  const bandarban = await prisma.destination.findUnique({ where: { slug: 'bandarban' } });
  const sylhet = await prisma.destination.findUnique({ where: { slug: 'sylhet' } });
  const rangamati = await prisma.destination.findUnique({ where: { slug: 'rangamati' } });

  if (!coxsBazar || !sundarbans || !bandarban || !sylhet || !rangamati) {
    throw new Error('Destinations not found');
  }

  const now = new Date();
  const future = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // Tour Packages
  const packages = [
    {
      agencyId: agency.id,
      destinationId: coxsBazar.id,
      title: "Cox's Bazar Beach Paradise - 3 Days",
      slug: 'coxs-bazar-beach-paradise-3days',
      description: 'Enjoy 3 days of sun, sand and sea at the world\'s longest natural beach. Includes hotel stay, meals, and guided tours to Himchori, Inani Beach, and Aggmeda Khyang.',
      price: 8500,
      durationDays: 3,
      availableSeats: 20,
      startDate: future(15),
      endDate: future(18),
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      status: 'ACTIVE' as const,
    },
    {
      agencyId: agency.id,
      destinationId: sundarbans.id,
      title: 'Sundarbans Tiger Reserve Safari - 4 Days',
      slug: 'sundarbans-tiger-safari-4days',
      description: 'An unforgettable journey into the world\'s largest mangrove delta. Expert guides, boat tours, wildlife spotting, and a chance to see the Royal Bengal Tiger.',
      price: 15000,
      durationDays: 4,
      availableSeats: 12,
      startDate: future(20),
      endDate: future(24),
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      status: 'ACTIVE' as const,
    },
    {
      agencyId: agency.id,
      destinationId: bandarban.id,
      title: 'Bandarban Hill Trek Adventure - 5 Days',
      slug: 'bandarban-hill-trek-5days',
      description: 'Trek through the scenic Chittagong Hill Tracts, visit tribal villages, Boga Lake, Nilgiri peak, and experience authentic hill culture and cuisine.',
      price: 12000,
      durationDays: 5,
      availableSeats: 15,
      startDate: future(25),
      endDate: future(30),
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      status: 'ACTIVE' as const,
    },
    {
      agencyId: agency.id,
      destinationId: sylhet.id,
      title: 'Sylhet Tea Garden & Waterfalls - 3 Days',
      slug: 'sylhet-tea-garden-waterfalls-3days',
      description: 'Explore the lush tea gardens of Srimangal, visit Madhabkunda waterfall, boat ride on Ratargul Swamp Forest, and enjoy local cuisine.',
      price: 7500,
      durationDays: 3,
      availableSeats: 25,
      startDate: future(10),
      endDate: future(13),
      imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
      status: 'ACTIVE' as const,
    },
    {
      agencyId: agency.id,
      destinationId: rangamati.id,
      title: 'Rangamati Lake & Tribal Culture Tour - 2 Days',
      slug: 'rangamati-lake-tribal-2days',
      description: 'Boat ride on the stunning Kaptai Lake, visit tribal villages, explore local crafts and food, and enjoy the serene hill tracts landscape.',
      price: 5500,
      durationDays: 2,
      availableSeats: 30,
      startDate: future(8),
      endDate: future(10),
      imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
      status: 'ACTIVE' as const,
    },
  ];

  for (const pkg of packages) {
    await prisma.tourPackage.upsert({
      where: { slug: pkg.slug },
      update: {},
      create: pkg,
    });
  }
  console.log('✅ Tour packages seeded');

  console.log('\n🎉 Seed complete! Demo accounts:');
  console.log('  Admin:    admin@travelmate.com    / admin123');
  console.log('  Agency:   agency@travelmate.com   / agency123');
  console.log('  Customer: customer@travelmate.com / customer123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
