import { Project, Experience, Award, TravelLocation } from '../types';

export interface AppData {
  projects: Project[];
  experience: Experience[];
  awards: Award[];
  travels: TravelLocation[];
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

const DEFAULT_TRAVELS: TravelLocation[] = [
  {
    id: 1,
    name: "Tokyo, Japan",
    date: "2023",
    lat: 35.6762,
    lng: 139.6503,
    description: "Exploring the neon streets of Shinjuku and traditional temples.",
    images: [
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000",
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000",
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=1000"
    ]
  },
  {
    id: 2,
    name: "Reykjavik, Iceland",
    date: "2022",
    lat: 64.1466,
    lng: -21.9426,
    description: "Chasing the Northern Lights and walking on black sand beaches.",
    images: [
      "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=1000",
      "https://images.unsplash.com/photo-1521651201144-634ffa7f6bf2?q=80&w=1000"
    ]
  },
  {
    id: 3,
    name: "Paris, France",
    date: "2021",
    lat: 48.8566,
    lng: 2.3522,
    description: "Art, history, and coffee in the City of Light.",
    images: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000",
      "https://images.unsplash.com/photo-1499856871940-a09627c6d7db?q=80&w=1000"
    ]
  },
  {
    id: 4,
    name: "New York, USA",
    date: "2020",
    lat: 40.7128,
    lng: -74.0060,
    description: "The city that never sleeps. Urban photography tour.",
    images: [
      "https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?q=80&w=1000"
    ]
  }
];

const STORAGE_KEY = 'zu_portfolio_data_v1';

export const getPortfolioData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Data migration/normalization for older saves
      if (!data.travels) data.travels = DEFAULT_TRAVELS;
      data.travels = data.travels.map((t: any) => {
         // Fix NaN issues: Ensure lat/lng are numbers
         let lat = t.lat;
         let lng = t.lng;

         // Legacy migration
         if (lat === undefined && t.x !== undefined) {
             lng = (t.x / 100) * 360 - 180;
             lat = 90 - (t.y / 100) * 180;
         }

         // Fallback to 0,0 if invalid
         if (typeof lat !== 'number' || isNaN(lat)) lat = 0;
         if (typeof lng !== 'number' || isNaN(lng)) lng = 0;

         return {
             ...t,
             lat,
             lng
         };
      });

      return data;
    }
  } catch (e) {
    console.error("Failed to load portfolio data", e);
  }
  return {
    projects: DEFAULT_PROJECTS,
    experience: DEFAULT_EXPERIENCE,
    awards: DEFAULT_AWARDS,
    travels: DEFAULT_TRAVELS
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
    awards: DEFAULT_AWARDS,
    travels: DEFAULT_TRAVELS
  };
};