import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Host } from '../models/Host.js';
import { Property } from '../models/Property.js';

const naviMumbaiLocations = [
  { city: 'Navi Mumbai', locality: 'Vashi', state: 'Maharashtra', country: 'India' },
  { city: 'Navi Mumbai', locality: 'Kharghar', state: 'Maharashtra', country: 'India' },
  { city: 'Navi Mumbai', locality: 'Panvel', state: 'Maharashtra', country: 'India' },
  { city: 'Navi Mumbai', locality: 'Belapur', state: 'Maharashtra', country: 'India' },
  { city: 'Navi Mumbai', locality: 'CBD Belapur', state: 'Maharashtra', country: 'India' },
];

const seedData = async (): Promise<void> => {
  await connectDatabase();

  const existingCount = await Property.countDocuments();
  if (existingCount > 0) {
    console.log('Seed skipped: properties already exist.');
    await mongoose.disconnect();
    return;
  }

  const adminUser = await User.findOneAndUpdate(
    { email: 'admin@hopebed.in' },
    {
      name: 'Hopebed Admin',
      email: 'admin@hopebed.in',
      role: 'admin',
      isEmailVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const hostUser = await User.findOneAndUpdate(
    { email: 'host@hopebed.in' },
    {
      name: 'Navi Mumbai Host',
      email: 'host@hopebed.in',
      role: 'host',
      isEmailVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const host = await Host.findOneAndUpdate(
    { user: hostUser._id },
    {
      user: hostUser._id,
      businessName: 'Hopebed Stay Network',
      verificationStatus: 'verified',
      kycStatus: 'verified',
      isActive: true,
      propertyCount: naviMumbaiLocations.length,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const propertyEntries = naviMumbaiLocations.map((location, index) => ({
    host: host._id,
    title: `${location.locality} Verified Stay`,
    slug: `${location.locality.toLowerCase().replace(/\s+/g, '-')}-verified-stay-${index + 1}`,
    propertyType: index % 2 === 0 ? 'apartment' : 'studio',
    category: 'stay',
    city: location.city,
    locality: location.locality,
    state: location.state,
    country: location.country,
    address: `${location.locality}, ${location.city}, ${location.state}`,
    bedrooms: index === 0 ? 2 : 1,
    bathrooms: index === 0 ? 2 : 1,
    maxGuests: index === 0 ? 4 : 2,
    pricePerNight: 1800 + index * 500,
    currency: 'INR',
    description: `Comfortable verified accommodation in ${location.locality}, Navi Mumbai for short stays and family travel.`,
    amenities: ['Wi-Fi', 'Parking', 'Housekeeping', 'Air Conditioning'],
    isVerified: true,
    isPublished: true,
    isFeatured: index < 3,
    primaryImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
  }));

  await Property.insertMany(propertyEntries);

  console.log(`Seeded ${propertyEntries.length} Navi Mumbai properties.`);
  console.log(`Admin user: ${adminUser.email}`);
  console.log(`Host user: ${hostUser.email}`);

  await mongoose.disconnect();
};

seedData().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
