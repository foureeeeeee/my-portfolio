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
    "id": 1,
    "title": "UKM Eat",
    "category": "UI/UX Design",
    "year": "2024",
    "description": "a camp based school ordering system with completed CRUD functionality.",
    "image": "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2019.58.18.png?raw=true",
    "client": "netlify",
    "link": "https://monumental-pavlova-18b7f7.netlify.app",
    "longDescription": "Skip the queue and enjoy your favorite campus meals delivered straight to your faculty or dorm room. Fresh, fast, and student-friendly.",
    "gallery": [
      "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2019.58.52.png?raw=true"
    ]
  },
  {
    "id": 2,
    "title": "QUAN Merch",
    "category": "Branding",
    "year": "2023",
    "description": "Demure design deliver to  a e business logistic website, ensemble with modern aesthetics.",
    "image": "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2020.08.42.png?raw=true",
    "client": "wordpress(cloudflare)",
    "link": "https://www.quanmerch3.win/shop/",
    "longDescription": "QUAN Merch is a campus-focused delivery platform designed to move documents and parcels efficiently, securely, and transparently across university environments.\n\n\n",
    "gallery": [
      "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2020.09.36.png?raw=true"
    ]
  },
  {
    "id": 3,
    "title": "MY VINYL COLLECTION",
    "category": "Interactive",
    "year": "2025",
    "description": "An immersive vinyl collection system building with react. \nSmooth animation with all you want",
    "image": "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2020.13.52.png?raw=true",
    "client": "Google",
    "link": "https://groovevault-141753811866.us-west1.run.app",
    "longDescription": "Starting from midnight, \nIt's just a first step for my collection.",
    "gallery": [
      "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2020.14.24.png?raw=true",
      "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2020.19.03.png?raw=true"
    ]
  },
  {
    "id": 4,
    "title": "Rate My Professor Project",
    "category": "FYP",
    "year": "2022",
    "description": "know your professor in advance.",
    "image": "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2020.30.58.png?raw=true",
    "client": "Google",
    "link": "https://ai.studio/apps/drive/1ASvjHOEC3r_PrBuuKaSxPMW-FZc0Aoct?fullscreenApplet=true",
    "longDescription": "The Rate My Professor System is a web-based platform designed to help students share and access feedback about university instructors. The system allows students to rate professors based on various criteria such as teaching effectiveness, clarity of explanation, course difficulty, responsiveness, and overall satisfaction. Users can also write detailed reviews describing their learning experiences, strengths of the instructor, and suggestions for improvement.\n",
    "gallery": [
      "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2020.31.26.png?raw=true",
      "https://github.com/foureeeeeee/picutestorage/blob/main/Screenshot%202026-02-10%20at%2020.31.55.png?raw=true"
    ]
  }
];

const DEFAULT_EXPERIENCE: Experience[] = [
  {
    "id": 1,
    "role": "Project Assistant",
    "company": "National Social Science Fund",
    "period": "2024.01 - 2024.02",
    "description": "Assisted in data visualization and UI framework for cultural heritage research."
  },
  {
    "id": 2,
    "role": "UI Design Intern",
    "company": "TechFlow Innovations",
    "period": "2023.06 - 2023.12",
    "description": "Led the redesign of the mobile component library and user dashboard."
  },
  {
    "id": 3,
    "role": "Visual Designer",
    "company": "Creative Studio X",
    "period": "2022.05 - 2023.01",
    "description": "Produced marketing assets and brand identity systems for 10+ startups."
  }
];

const DEFAULT_AWARDS: Award[] = [
  {
    "id": 1,
    "title": "National Advertising Art Design Competition",
    "rank": "First Prize",
    "year": "2023"
  },
  {
    "id": 2,
    "title": "Blue Bridge Cup Design Contest",
    "rank": "Second Prize",
    "year": "2022"
  },
  {
    "id": 3,
    "title": "China Packaging Creative Design",
    "rank": "Third Prize",
    "year": "2022"
  }
];

const DEFAULT_TRAVELS: TravelLocation[] = [
  {
    "id": 1769720249326,
    "name": "macao",
    "date": "2024",
    "lat": 0,
    "lng": 0,
    "x": 50,
    "y": 50,
    "images": [
      "https://picsum.photos/800/600"
    ],
    "description": "New travel entry."
  },
  {
    "id": 1769720228811,
    "name": "Hong Kong ",
    "date": "2024",
    "lat": 22.3492155,
    "lng": 114.1857978,
    "x": 81.71827716666667,
    "y": 37.58376916666667,
    "images": [
      "https://picsum.photos/800/600"
    ],
    "description": "New travel entry."
  },
  {
    "id": 1769720202293,
    "name": "Vietnam ",
    "date": "2025",
    "lat": 15.9266657,
    "lng": 107.9650855,
    "x": 79.99030152777777,
    "y": 41.15185238888889,
    "images": [
      "https://picsum.photos/800/600"
    ],
    "description": "New travel entry."
  },
  {
    "id": 1769720186110,
    "name": "China",
    "date": "2004",
    "lat": 0,
    "lng": 0,
    "x": 50,
    "y": 50,
    "images": [
      "https://picsum.photos/800/600"
    ],
    "description": "New travel entry."
  },
  {
    "id": 1769720155643,
    "name": "Philippine",
    "date": "2026",
    "lat": 51.2812037,
    "lng": 3.7580032,
    "x": 51.04388977777777,
    "y": 21.51044238888889,
    "images": [
      "https://picsum.photos/800/600"
    ],
    "description": "New travel entry."
  },
  {
    "id": 1769720122228,
    "name": "Malaysia",
    "date": "2023",
    "lat": 4.5693754,
    "lng": 102.2656823,
    "x": 78.40713397222223,
    "y": 47.461458111111114,
    "images": [
      "https://picsum.photos/800/600"
    ],
    "description": "New travel entry."
  },
  {
    "id": 1769720053612,
    "name": "Indonesia",
    "date": "2025",
    "lat": -2.4833826,
    "lng": 117.8902853,
    "x": 82.74730147222222,
    "y": 51.379657,
    "images": [
      "https://picsum.photos/800/600"
    ],
    "description": "New travel entry."
  },
  {
    "id": 1,
    "name": "Japan",
    "date": "2024",
    "lat": 35.6762,
    "lng": 139.6503,
    "description": "Exploring the neon streets of Shinjuku and traditional temples.",
    "images": [
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000",
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000",
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=1000"
    ]
  },
  {
    "id": 2,
    "name": "Thailand",
    "date": "2024",
    "lat": 13.7524938,
    "lng": 100.4935089,
    "description": "Chasing the Northern Lights and walking on black sand beaches.",
    "images": [
      "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=1000",
      "https://images.unsplash.com/photo-1521651201144-634ffa7f6bf2?q=80&w=1000"
    ],
    "x": 77.91486358333333,
    "y": 42.35972566666667
  },
  {
    "id": 3,
    "name": "Taiwan ",
    "date": "2025",
    "lat": 23.9739374,
    "lng": 120.9820179,
    "description": "Art, history, and coffee in the City of Light.",
    "images": [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000",
      "https://images.unsplash.com/photo-1499856871940-a09627c6d7db?q=80&w=1000"
    ],
    "x": 83.60611608333333,
    "y": 36.68114588888889
  },
  {
    "id": 4,
    "name": "Maldive ",
    "date": "2012",
    "lat": 3.7203503,
    "lng": 73.2244152,
    "description": "The city that never sleeps. Urban photography tour.",
    "images": [
      "https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?q=80&w=1000"
    ],
    "x": 70.34011533333333,
    "y": 47.93313872222222
  }
];

const DEFAULT_HOBBIES: Hobby[] = [
  {
    "id": 1770050596320,
    "name": "LEGO Block",
    "category": "General",
    "coverImage": "https://advertising.walmart.com/thunder/assets/media-service/wcnp-prod/images/1c97c84f-031d-4bed-918e-129bd0656541/ff82aad5-a9bb-450e-9487-37e24dc7383e.jpeg?odnHeight=318&odnWidth=568&odnBg=&odnDynImageQuality=70",
    "description": "Describe your hobby...",
    "news": "",
    "gallery": [
      "https://advertising.walmart.com/thunder/assets/media-service/wcnp-prod/images/1c97c84f-031d-4bed-918e-129bd0656541/ff82aad5-a9bb-450e-9487-37e24dc7383e.jpeg?odnHeight=318&odnWidth=568&odnBg=&odnDynImageQuality=70"
    ]
  },
  {
    "id": 1769942112414,
    "name": "Cat",
    "category": "General",
    "coverImage": "https://cdn.britannica.com/34/235834-050-C5843610/two-different-breeds-of-cats-side-by-side-outdoors-in-the-garden.jpg",
    "description": "Describe your hobby...",
    "news": "",
    "gallery": [
      "https://www.purina.com.au/dw/image/v2/BKFD_PRD/on/demandware.static/-/Library-Sites-purina-shared-library/default/dwe15488ab/images/About-us/Our-brands/PurinaOne/purina-one-cat/articles/appetite/cat-appetite-mobile.jpg"
    ]
  },
  {
    "id": 1769941734010,
    "name": "Solo Travel",
    "category": "General",
    "coverImage": "https://t3.ftcdn.net/jpg/03/01/84/54/360_F_301845445_Aj4iICMuzOfFkKW0U43l4aFAo05HZxIZ.jpg",
    "description": "Describe your hobby...",
    "news": "",
    "gallery": [
      "https://adventure.com/wp-content/uploads/2020/02/Hero-Solo-travel-perspective-Table-Mountain-with-Kellie-Photo-credit-Kellie-Paxian-1920x1080.jpg"
    ]
  },
  {
    "id": 1769941643976,
    "name": "Max verstappen ",
    "category": "General",
    "coverImage": "https://hips.hearstapps.com/hmg-prod/images/max-verstappen-of-the-netherlands-and-oracle-red-bull-news-photo-1726935684.jpg?crop=0.669xw:1.00xh;0,0&resize=1200:*",
    "description": "Describe your hobby...",
    "news": "",
    "gallery": [
      "https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000000/trackside-images/2025/F1_Grand_Prix_of_Brazil/2245875435.webp"
    ]
  },
  {
    "id": 1769941314800,
    "name": "Taylor Swift",
    "category": "General",
    "coverImage": "https://variety.com/wp-content/uploads/2025/09/GettyImages-2166934862.jpg?w=1000&h=667&crop=1https://picsum.photos/200",
    "description": "Describe your hobby...",
    "news": "",
    "gallery": [
      "https://hips.hearstapps.com/hmg-prod/images/460021010-64a7423feecba.jpg?crop=0.957xw:1.00xh;0.0433xw,0&resize=768:*"
    ]
  },
  {
    "id": 1769941207460,
    "name": "F1",
    "category": "General",
    "coverImage": "https://admin.cnnbrasil.com.br/wp-content/uploads/sites/12/2022/03/GettyImages-1387887464-e1734964859897.jpg?w=1200&h=900&crop=1",
    "description": "Describe your hobby...",
    "news": "",
    "gallery": [
      "https://img.redbull.com/images/c_limit,w_1500,h_1000/f_auto,q_auto/redbullcom/2024/11/24/nrqoxx9as35r5ry8ashm/max-verstapen-2024-f1-world-champion-four"
    ]
  },
  {
    "id": 1769941127076,
    "name": "DJ(techno&house)",
    "category": "General",
    "coverImage": "https://cdn-images.dzcdn.net/images/artist/f49a21212bfea7814ecb21096ccb0007/1900x1900-000000-81-0-0.jpg",
    "description": "Describe your hobby...",
    "news": "",
    "gallery": [
      "https://www.fredagain.com/sites/g/files/g2000020836/files/2025-09/MAIN%20LEAD%20IMAGE%20USB%20FA_LEAD.jpg"
    ]
  },
  {
    "id": 1,
    "name": "HIFI&VINYL",
    "category": "Tech & Collection",
    "coverImage": "https://media.gettyimages.com/id/1174207130/photo/wall-of-retro-vintage-style-music-sound-speakers.jpg?s=612x612&w=gi&k=20&c=ZURZRscJsigzd5CmG0RJD4vFh4iWy8DcAhnExd_N29Y=",
    "description": "Building custom keyboards, lubricating switches, and collecting rare artisan keycaps. It's the perfect blend of engineering and aesthetics.",
    "news": "Just acquired a rare GMK set!",
    "gallery": [
      "https://media.gettyimages.com/id/1174207130/photo/wall-of-retro-vintage-style-music-sound-speakers.jpg?s=612x612&w=gi&k=20&c=ZURZRscJsigzd5CmG0RJD4vFh4iWy8DcAhnExd_N29Y="
    ]
  },
  {
    "id": 2,
    "name": "Photography",
    "category": "Art",
    "coverImage": "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?q=80&w=1000",
    "description": "Capturing moments on 35mm film. The delay between shooting and developing teaches patience and intentionality.",
    "news": "Developed 3 rolls from the Tokyo trip.",
    "gallery": [
      "https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?q=80&w=1000",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000"
    ]
  },
  {
    "id": 3,
    "name": "golf",
    "category": "Sport",
    "coverImage": "data:image/jpeg;base64,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",
    "description": "Road cycling on weekends. Chasing horizons and beating personal bests on Strava.",
    "news": "Completed my first 100km ride this month.",
    "gallery": [
      "https://ichef.bbci.co.uk/ace/standard/3840/cpsprodpb/66f2/live/875d4f80-4258-11f0-a4fc-3b20898a3013.jpg"
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
