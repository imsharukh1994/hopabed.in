export type Property = {
  id: string;
  name: string;
  location: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  type: string;
  image: string;
  badge?: string;
  description: string;
};

export const properties: Property[] = [
  {
    id: "mumbai-riverfront-stay",
    name: "Mumbai Riverfront Stay",
    location: "Navi Mumbai, Maharashtra",
    city: "Mumbai",
    state: "Maharashtra",
    rating: 4.7,
    reviewCount: 142,
    pricePerNight: 3899,
    type: "apartments",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    badge: "Popular in Mumbai",
    description:
      "A well-located apartment stay near Navi Mumbai for quick getaways and business trips.",
  },
  {
    id: "lake-view-resort",
    name: "The Lake View Resort",
    location: "Udaipur, Rajasthan",
    city: "Udaipur",
    state: "Rajasthan",
    rating: 4.6,
    reviewCount: 120,
    pricePerNight: 3499,
    type: "resorts",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    badge: "Demo listing",
    description:
      "A lakeside resort stay with mountain views, designed as a demo listing for Hopebed search and booking flows.",
  },
  {
    id: "blue-roof-villa",
    name: "The Blue Roof Villa",
    location: "Lonavala, Maharashtra",
    city: "Lonavala",
    state: "Maharashtra",
    rating: 4.8,
    reviewCount: 98,
    pricePerNight: 6999,
    type: "villas",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    badge: "Demo listing",
    description:
      "A private villa with outdoor space for families and groups. Demo property for Hopebed.",
  },
  {
    id: "himalayan-stay-cottage",
    name: "Himalayan Stay Cottage",
    location: "Manali, Himachal Pradesh",
    city: "Manali",
    state: "Himachal Pradesh",
    rating: 4.7,
    reviewCount: 86,
    pricePerNight: 2999,
    type: "homestays",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    badge: "Demo listing",
    description:
      "A mountain cottage stay for travellers heading to Manali. Demo property for Hopebed.",
  },
  {
    id: "urban-casa",
    name: "Urban Casa",
    location: "Bangalore, Karnataka",
    city: "Bangalore",
    state: "Karnataka",
    rating: 4.5,
    reviewCount: 64,
    pricePerNight: 2199,
    type: "apartments",
    image:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
    badge: "Demo listing",
    description:
      "A modern city apartment for work trips and long stays. Demo property for Hopebed.",
  },
  {
    id: "fort-heritage-hotel",
    name: "Fort Heritage Hotel",
    location: "Jaipur, Rajasthan",
    city: "Jaipur",
    state: "Rajasthan",
    rating: 4.4,
    reviewCount: 72,
    pricePerNight: 4299,
    type: "hotels",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    badge: "Demo listing",
    description: "A heritage-style hotel stay in Jaipur. Demo property for Hopebed.",
  },
  {
    id: "backwater-homestay",
    name: "Backwater Homestay",
    location: "Alleppey, Kerala",
    city: "Alleppey",
    state: "Kerala",
    rating: 4.9,
    reviewCount: 54,
    pricePerNight: 2599,
    type: "homestays",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    badge: "Demo listing",
    description: "A quiet homestay near Kerala backwaters. Demo property for Hopebed.",
  },
];

export function getPropertyById(id: string) {
  return properties.find((property) => property.id === id);
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
