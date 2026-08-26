export type StayType = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
};

export const stayTypes: StayType[] = [
  {
    id: "hotels",
    title: "Hotels",
    description: "Comfortable stays for every budget",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    href: "/stays?type=hotels",
  },
  {
    id: "villas",
    title: "Villas",
    description: "Private villas for family & groups",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80",
    href: "/stays?type=villas",
  },
  {
    id: "apartments",
    title: "Apartments",
    description: "Home-like stays for long trips",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
    href: "/stays?type=apartments",
  },
  {
    id: "resorts",
    title: "Resorts",
    description: "Relax & rejuvenate in nature",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
    href: "/stays?type=resorts",
  },
  {
    id: "homestays",
    title: "Homestays",
    description: "Experience local hospitality",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
    href: "/stays?type=homestays",
  },
];
