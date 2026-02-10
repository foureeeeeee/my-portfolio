import { Project, Experience, Award, TravelLocation, Hobby } from '../types';

export interface AppData {
  projects: Project[];
  experience: Experience[];
  awards: Award[];
  travels: TravelLocation[];
  hobbies: Hobby[];
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 1,
    title: "Easy Recycle",
    category: "UI/UX Design",
    year: "2024",
    client: "GreenTech Solutions",
    description: "A sustainable lifestyle application focusing on recycling habits and community engagement.",
    longDescription: "Easy Recycle addresses the confusion surrounding waste separation. By utilizing AI-powered image recognition, users can scan items to instantly receive disposal instructions. The app gamifies the experience with a leaderboard and community challenges, resulting in a 40% increase in recycling accuracy among beta testers.",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1200",
    link: "https://example.com",
    technologies: ["Figma", "React Native", "TensorFlow"],
    gallery: [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200",
      "https://images.unsplash.com/photo-1507208773393-40d9fc9f9777?q=80&w=1200"
    ]
  },
  {
    id: 2,
    title: "Yongling Band",
    category: "Branding",
    year: "2023",
    client: "Yongling Cultural Center",
    description: "Cultural heritage brand design for a traditional music ensemble with modern aesthetics.",
    longDescription: "The challenge was to modernize a 500-year-old musical tradition for a Gen-Z audience without losing its soul. The rebrand included a dynamic logo system based on sound wave visualization of traditional instruments, a website, and merchandise design.",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200",
    link: "https://example.com",
    technologies: ["Illustrator", "After Effects", "Cinema 4D"],
    gallery: [
      "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1200",
      "https://images.unsplash.com/photo-1501612780327-45045538702b?q=80&w=1200"
    ]
  },
  {
    id: 3,
    title: "Martial Arts",
    category: "Interactive",
    year: "2024",
    client: "Tencent Games",
    description: "An immersive HTML5 promotional campaign for a mobile game launch.",
    longDescription: "An interactive web experience allowing users to explore the game's lore through parallax scrolling and WebGL particle effects. Achieved 2M+ unique visitors in the first week of launch.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200",
    link: "https://example.com",
    technologies: ["Three.js", "GSAP", "Vue.js"],
    gallery: [
      "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=1200"
    ]
  },
  {
    id: 4,
    title: "Lugu Sauce",
    category: "Packaging",
    year: "2022",
    client: "Lugu Farms",
    description: "Premium packaging design for traditional agricultural products.",
    longDescription: "Packaging design that utilizes biodegradable materials and minimalist typography to convey organic purity. The design won the Silver Award at the National Packaging Competition.",
    image: "https://images.unsplash.com/photo-1597475149301-21c83d666d6c?q=80&w=1200",
    link: "",
    technologies: ["Photoshop", "Blender"],
    gallery: [
       "https://images.unsplash.com/photo-1627483297886-49710ae1fc28?q=80&w=1200"
    ]
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

const DEFAULT_HOBBIES: Hobby[] = [
  {
    id: 1,
    name: "Mechanical Keyboards",
    category: "Tech & Collection",
    coverImage: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1000",
    description: "Building custom keyboards, lubricating switches, and collecting rare artisan keycaps. It's the perfect blend of engineering and aesthetics.",
    news: "Just acquired a rare GMK set!",
    gallery: [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=1000",
      "https://images.unsplash.com/photo-1587829741301-dc798b91add1?q=80&w=1000"
    ]
  },
  {
    id: 2,
    name: "Analog Photography",
    category: "Art",
    coverImage: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?q=80&w=1000",
    description: "Capturing moments on 35mm film. The delay between shooting and developing teaches patience and intentionality.",
    news: "Developed 3 rolls from the Tokyo trip.",
    gallery: [
      "https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?q=80&w=1000",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000"
    ]
  },
  {
    id: 3,
    name: "Cycling",
    category: "Sport",
    coverImage: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=1000",
    description: "Road cycling on weekends. Chasing horizons and beating personal bests on Strava.",
    news: "Completed my first 100km ride this month.",
    gallery: [
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000"
    ]
  }
];

const STORAGE_KEY = 'zu_portfolio_data_v1';

// Default State in Code
const DEFAULT_DATA: AppData = {
    projects: DEFAULT_PROJECTS,
    experience: DEFAULT_EXPERIENCE,
    awards: DEFAULT_AWARDS,
    travels: DEFAULT_TRAVELS,
    hobbies: DEFAULT_HOBBIES
};

export const getPortfolioData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Robust Check: Ensure all sections exist, if not merge with defaults
      return {
          projects: data.projects || DEFAULT_DATA.projects,
          experience: data.experience || DEFAULT_DATA.experience,
          awards: data.awards || DEFAULT_DATA.awards,
          travels: data.travels || DEFAULT_DATA.travels,
          hobbies: data.hobbies || DEFAULT_DATA.hobbies
      };
    }
  } catch (e) {
    console.error("Failed to load portfolio data", e);
  }
  // Return a copy to avoid mutation reference issues
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
};

export const savePortfolioData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("Data saved to Local Storage:", STORAGE_KEY);
  } catch (e) {
    console.error("Failed to save portfolio data", e);
    throw e;
  }
};

export const resetPortfolioData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Local Storage cleared. Reverting to code defaults.");
    // Return a fresh copy of defaults
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  } catch (e) {
    console.error("Failed to reset data", e);
    return DEFAULT_DATA;
  }
};