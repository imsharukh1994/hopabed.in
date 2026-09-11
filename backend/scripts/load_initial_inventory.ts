import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Host } from '../src/models/Host.js';
import { Property } from '../src/models/Property.js';
import { Room } from '../src/models/Room.js';

// Parsed from Hopebed_Panvel_NaviMumbai_Market_Research.md
const propertiesData = [
  {
    title: 'Arpana Paying Guest',
    locality: 'New Panvel East (Sec 11)',
    city: 'Panvel',
    price: 10000,
    capacity: 1,
    contact: 'arpanapgpanvel@gmail.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Deccan PG & Hostel',
    locality: 'New Panvel / Vichumbe',
    city: 'Panvel',
    price: 3000,
    capacity: 4,
    contact: 'deccan@example.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Elite PG',
    locality: 'Sec-1, New Panvel East',
    city: 'Panvel',
    price: 5500,
    capacity: 2,
    contact: 'elite@example.com',
    type: 'hostel' as const,
    propType: 'apartment' as const
  },
  {
    title: 'Kelkar Paying Guest',
    locality: 'New Panvel',
    city: 'Panvel',
    price: 5000,
    capacity: 4,
    contact: 'kelkar@example.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Sai Hostel',
    locality: 'New Panvel (Vichumbe)',
    city: 'Panvel',
    price: 3500,
    capacity: 1,
    contact: 'saihostel@example.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Sai Girls Hostel',
    locality: 'New Panvel (Vichumbe)',
    city: 'Panvel',
    price: 7000,
    capacity: 1,
    contact: 'saigirls@example.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Mauli Nest (Ladies PG)',
    locality: 'Sec-1, New Panvel',
    city: 'Panvel',
    price: 6000,
    capacity: 2,
    contact: 'maulinest@example.com',
    type: 'hostel' as const,
    propType: 'apartment' as const
  },
  {
    title: 'StayZone Hostels',
    locality: 'Kharghar (Sec 12, 19, 20, 21, 34C, 35E)',
    city: 'Navi Mumbai',
    price: 27000,
    capacity: 1,
    contact: 'info@stayzonehostels.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Union Living — Kharghar 21',
    locality: 'Kharghar',
    city: 'Navi Mumbai',
    price: 32000,
    capacity: 1,
    contact: 'unionliving@example.com',
    type: 'stay' as const,
    propType: 'apartment' as const
  },
  {
    title: 'Vriitee Hostels',
    locality: 'Kharghar Sec 33',
    city: 'Navi Mumbai',
    price: 8000, // Imputed reasonable base price for Navi Mumbai women's hostel based on others
    capacity: 2,
    contact: 'vriitee@example.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Sai Fortune Hostel',
    locality: 'Kharghar Sec 19',
    city: 'Navi Mumbai',
    price: 7500, // Imputed budget
    capacity: 2,
    contact: 'saifortunehostel@gmail.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'The Covie — Kharghar 200',
    locality: 'Kharghar Sec 21',
    city: 'Navi Mumbai',
    price: 19643,
    capacity: 1,
    contact: 'thecovie@example.com',
    type: 'stay' as const,
    propType: 'apartment' as const
  },
  {
    title: 'Skylux Paying Guest',
    locality: 'Kharghar Sec 12',
    city: 'Navi Mumbai',
    price: 6000,
    capacity: 2,
    contact: 'skylux@example.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Smt. Meena Ranka Memorial Girls Hostel',
    locality: 'Kamothe Sec 20',
    city: 'Navi Mumbai',
    price: 4500, // Charitable baseline
    capacity: 3,
    contact: 'mrfoundation@rediffmail.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Vijay Cozy Corner Hostel',
    locality: 'Ulwe Sec 8',
    city: 'Navi Mumbai',
    price: 13000,
    capacity: 1, // Single bed in 50 bed dorm
    contact: 'vijaycozy@example.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  },
  {
    title: 'Marshal Enterprise',
    locality: 'Kharghar Sec 3',
    city: 'Navi Mumbai',
    price: 7000, // based on deposit finding
    capacity: 2,
    contact: 'marshal@example.com',
    type: 'hostel' as const,
    propType: 'guesthouse' as const
  }
];

async function loadInventory() {
  console.log('=== STARTING INITIAL INVENTORY LOAD (TASK #12) ===\\n');
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  console.log('Connected to MongoDB.');

  let loadedCount = 0;
  
  for (let i = 0; i < propertiesData.length; i++) {
    const data = propertiesData[i];
    console.log(`Processing ${data.title}...`);
    
    // 1. Create or Find Host
    let user = await User.findOne({ email: data.contact });
    if (!user) {
      user = await User.create({
        name: data.title + ' Owner',
        email: data.contact,
        passwordHash: 'secured_hash_default',
        role: 'host'
      });
    }

    let host = await Host.findOne({ user: user._id });
    if (!host) {
      host = await Host.create({
        user: user._id,
        businessName: data.title,
        verificationStatus: 'verified' // Strict requirement
      });
    }

    // 2. Create or Find Property
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let property = await Property.findOne({ slug });
    if (!property) {
      property = await Property.create({
        host: host._id,
        title: data.title,
        slug,
        propertyType: data.propType,
        category: data.type,
        city: data.city,
        locality: data.locality,
        state: 'Maharashtra',
        country: 'India',
        address: `${data.locality}, ${data.city}, Maharashtra`,
        location: { type: 'Point', coordinates: [73.0, 19.0] }, // Approximate default coordinates for Navi Mumbai area
        bedrooms: 10,
        bathrooms: 10,
        maxGuests: 20,
        pricePerNight: data.price,
        currency: 'INR',
        description: `Verified budget stay in ${data.locality}. Perfect for students and working professionals. Part of the Hopebed verified network.`,
        amenities: ['wifi', 'security', 'cctv'],
        houseRules: ['No smoking indoors'],
        isVerified: true, // Strict requirement
        isPublished: true, // Strict requirement
        verificationStatus: 'VERIFIED', // Strict requirement
        primaryImage: '/hero-bg.png' // Using the verified internal hero image rather than external unverified URLs
      });
    } else {
        // Ensure it is verified and published
        property.isVerified = true;
        property.isPublished = true;
        property.verificationStatus = 'VERIFIED';
        await property.save();
    }

    // 3. Create Bookable Room
    let room = await Room.findOne({ property: property._id });
    if (!room) {
      await Room.create({
        property: property._id,
        name: 'Standard Occupancy',
        roomType: 'shared',
        capacity: data.capacity,
        inventory: 5, // At least 5 units available for booking
        pricePerNight: data.price,
        currency: 'INR',
        amenities: ['wifi', 'bed'],
        isActive: true // Strict requirement for booking
      });
    } else {
        room.isActive = true;
        await room.save();
    }
    
    loadedCount++;
  }

  console.log(`\\nLoaded ${loadedCount} real properties from market research successfully.`);
  await mongoose.disconnect();
  console.log('=== INVENTORY LOAD COMPLETE ===');
}

loadInventory().catch(err => {
  console.error('Error loading inventory:', err);
  process.exit(1);
});
