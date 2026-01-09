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
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  images: string[];
}