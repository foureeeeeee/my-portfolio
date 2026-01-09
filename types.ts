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