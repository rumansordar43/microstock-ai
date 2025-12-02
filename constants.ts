import { TrendItem, KeywordItem } from './types';

export const MOCK_TRENDS: TrendItem[] = [
  {
    id: 't1',
    title: 'Cyberpunk Solarpunk City',
    description: 'Futuristic eco-friendly cities with neon aesthetics. High demand in technology and sustainability sectors.',
    competition: 'Low',
    searchVolume: '45K',
    category: 'Concept Art',
    keywords: ['solarpunk', 'futuristic city', 'green energy', 'neon lights', 'sustainable architecture', 'utopia'],
    concepts: [
      'Wide angle aerial shot of a city with vertical gardens and neon signs',
      'Close up of a solar panel integrated into a futuristic glass building',
      'People using holographic interfaces in a park full of glowing plants',
      'Cyberpunk street food vendor serving organic food in biodegradable neon containers'
    ]
  },
  {
    id: 't2',
    title: 'Diverse Senior Lifestyle',
    description: 'Active seniors from diverse backgrounds using technology and exercising. Evergreen high commercial value.',
    competition: 'Medium',
    searchVolume: '120K',
    category: 'Lifestyle',
    keywords: ['active seniors', 'elderly technology', 'retirement joy', 'diverse group', 'healthy aging', 'fitness'],
    concepts: [
      'Group of diverse seniors laughing while looking at a tablet in a park',
      'Senior woman practicing yoga in a bright, modern living room',
      'Elderly man using a VR headset with a look of wonder',
      'Intergenerational family cooking dinner together in a modern kitchen'
    ]
  },
  {
    id: 't3',
    title: 'Minimalist 3D Geometric Abstract',
    description: 'Soft pastel colored 3D shapes for web backgrounds. Very popular for SaaS landing pages.',
    competition: 'Low',
    searchVolume: '32K',
    category: 'Backgrounds',
    keywords: ['3d render', 'abstract shapes', 'pastel colors', 'minimalist background', 'soft lighting', 'geometric'],
    concepts: [
      'Floating spheres and cubes in soft coral and teal gradient lighting',
      'Abstract glass refraction patterns on a white background',
      'Matte finish geometric shapes arranged in a satisfying grid',
      'Liquid metal shapes flowing against a matte pastel background'
    ]
  },
  {
    id: 't4',
    title: 'AI Robotics in Agriculture',
    description: 'Robots and drones helping in farming. Tech + Nature intersection.',
    competition: 'Low',
    searchVolume: '18K',
    category: 'Technology',
    keywords: ['agritech', 'farming drone', 'robot farmer', 'smart agriculture', 'future farming', 'automation'],
    concepts: [
      'Drone spraying water over a vibrant green corn field at sunrise',
      'Robotic arm harvesting ripe tomatoes in a high-tech greenhouse',
      'Farmer holding a tablet controlling autonomous tractors in the distance',
      'Close up of a robotic sensor examining soil quality'
    ]
  },
  {
    id: 't5',
    title: 'Mental Health & Mindfulness',
    description: 'Conceptual illustrations representing peace, balance, and mental wellbeing.',
    competition: 'High',
    searchVolume: '200K',
    category: 'Healthcare',
    keywords: ['mental health', 'meditation', 'brain balance', 'peaceful mind', 'therapy', 'wellness'],
    concepts: [
      'Silhouette of a head with flowers blooming from the top against a calm sky',
      'Person sitting in lotus position levitating over a chaotic city',
      'Two hands gently holding a glowing heart shape',
      'Abstract representation of anxiety untangling into smooth lines'
    ]
  },
  {
    id: 't6',
    title: 'Electric Vehicle Charging Stations',
    description: 'Modern EV charging infrastructure in urban and nature settings.',
    competition: 'Medium',
    searchVolume: '60K',
    category: 'Transport',
    keywords: ['ev charger', 'electric car', 'green transport', 'charging station', 'eco friendly', 'infrastructure'],
    concepts: [
      'Luxury electric car plugged into a sleek charger in a modern garage',
      'Row of charging stations in a parking lot with solar panels overhead',
      'Woman paying for EV charging using a smartphone app',
      'Electric truck charging at a station with wind turbines in background'
    ]
  }
];

export const LOW_COMP_KEYWORDS: KeywordItem[] = [
  { 
    id: 'k1', 
    keyword: 'Sustainable Bioplastic Packaging', 
    difficulty: 25, 
    volume: '12K', 
    trend: 'up', 
    suggestedPrompt: 'Close up shot of biodegradable food packaging made from leaves, bright studio lighting',
    concepts: [
      'Detailed texture shot of packaging made from banana leaves',
      'Cosmetic bottles made from recycled bioplastic on a wooden podium',
      'Zero waste supermarket isle with bioplastic containers'
    ]
  },
  { 
    id: 'k2', 
    keyword: 'Remote Work with Pets', 
    difficulty: 35, 
    volume: '45K', 
    trend: 'up', 
    suggestedPrompt: 'Candid shot of a woman working on laptop with a cat sleeping on the desk, cozy home office',
    concepts: [
      'Golden retriever looking at laptop screen while owner types',
      'Man on video call with a parrot on his shoulder',
      'Cat walking across a mechanical keyboard close up'
    ]
  },
  { 
    id: 'k3', 
    keyword: 'Vertical Farming Indoors', 
    difficulty: 28, 
    volume: '18K', 
    trend: 'up', 
    suggestedPrompt: 'Modern hydroponic vertical farm with purple LED grow lights, futuristic agriculture',
    concepts: [
      'Scientist examining lettuce in a vertical farm lab',
      'Wide shot of a restaurant with a vertical herb garden wall',
      'Macro shot of water droplets on hydroponic roots'
    ]
  },
  { 
    id: 'k4', 
    keyword: 'Inclusive Prosthetic Limbs', 
    difficulty: 42, 
    volume: '22K', 
    trend: 'stable', 
    suggestedPrompt: 'Portrait of a confident athlete with a carbon fiber prosthetic leg running on track',
    concepts: [
      'Close up of a customized artistic prosthetic arm holding a coffee cup',
      'Child with a colorful prosthetic leg playing soccer',
      'Fashion model showing off a bionic leg on a runway'
    ]
  },
  { 
    id: 'k5', 
    keyword: 'Digital Detox Camping', 
    difficulty: 30, 
    volume: '15K', 
    trend: 'up', 
    suggestedPrompt: 'Group of friends camping in forest without phones, enjoying campfire, authentic emotion',
    concepts: [
      'Friends reading paper books in a hammock by a lake',
      'Couple looking at a map instead of a GPS phone',
      'Hands warming up by a campfire, no technology visible'
    ]
  },
  { 
    id: 'k6', 
    keyword: 'Recycled Ocean Plastic Art', 
    difficulty: 20, 
    volume: '8K', 
    trend: 'stable', 
    suggestedPrompt: 'Colorful abstract sculpture made from recycled ocean plastic debris on clean sand',
    concepts: [
      'Artist sorting colorful plastic pieces on a workbench',
      'A giant whale sculpture made of plastic bottles on a beach',
      'Texture background of melted recycled plastic caps'
    ]
  },
];