import { Project, Experience, Award } from '../types';

export interface AppData {
  projects: Project[];
  experience: Experience[];
  awards: Award[];
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 1,
    title: "Easy Recycle",
    category: "UI/UX Design",
    year: "2024",
    description: "A sustainable lifestyle application focusing on recycling habits and community engagement.",
    image: "https://picsum.photos/1200/800?random=1"
  },
  {
    id: 2,
    title: "Yongling Band",
    category: "Branding",
    year: "2023",
    description: "Cultural heritage brand design for a traditional music ensemble with modern aesthetics.",
    image: "https://picsum.photos/1200/800?random=2"
  },
  {
    id: 3,
    title: "Martial Arts",
    category: "Interactive",
    year: "2024",
    description: "An immersive HTML5 promotional campaign for a mobile game launch.",
    image: "https://picsum.photos/1200/800?random=3"
  },
  {
    id: 4,
    title: "Lugu Sauce",
    category: "Packaging",
    year: "2022",
    description: "Premium packaging design for traditional agricultural products.",
    image: "https://picsum.photos/1200/800?random=4"
  }
];

const DEFAULT_EXPERIENCE: Experience[] = [
  {
    id: 1,
    role: "Project Assistant",
    company: "National Social Science Fund",
    period: "2024.01 - 2024.02",
    description: "Assisted in data visualization and UI framework for cultural heritage research."
  },
  {
    id: 2,
    role: "UI Design Intern",
    company: "TechFlow Innovations",
    period: "2023.06 - 2023.12",
    description: "Led the redesign of the mobile component library and user dashboard."
  },
  {
    id: 3,
    role: "Visual Designer",
    company: "Creative Studio X",
    period: "2022.05 - 2023.01",
    description: "Produced marketing assets and brand identity systems for 10+ startups."
  }
];

const DEFAULT_AWARDS: Award[] = [
  { id: 1, title: "National Advertising Art Design Competition", rank: "First Prize", year: "2023" },
  { id: 2, title: "Blue Bridge Cup Design Contest", rank: "Second Prize", year: "2022" },
  { id: 3, title: "China Packaging Creative Design", rank: "Third Prize", year: "2022" }
];

const STORAGE_KEY = 'zu_portfolio_data_v1';

export const getPortfolioData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load portfolio data", e);
  }
  return {
    projects: DEFAULT_PROJECTS,
    experience: DEFAULT_EXPERIENCE,
    awards: DEFAULT_AWARDS
  };
};

export const savePortfolioData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save portfolio data", e);
  }
};

export const resetPortfolioData = () => {
  localStorage.removeItem(STORAGE_KEY);
  return {
    projects: DEFAULT_PROJECTS,
    experience: DEFAULT_EXPERIENCE,
    awards: DEFAULT_AWARDS
  };
};