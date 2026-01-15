export interface Project {
  id: number;
  title: string;
  category: string;
  image: string;
  year: string;
  description: string;
}

export interface Experience {
  id: number;
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface Award {
  id: number;
  title: string;
  rank: string;
  year: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface TravelLocation {
  id: number;
  name: string;
  date: string;
  lat: number; // Latitude -90 to 90
  lng: number; // Longitude -180 to 180
  x?: number; // Keep for backward compatibility if needed
  y?: number; // Keep for backward compatibility if needed
  images: string[];
  description?: string;
}