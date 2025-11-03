
export const group = {
  id: '/nightcity',
  slug: '/nightcity',
  parentId: '/',  
  type: 'group',
  title: 'Nightcity',
  content: 'Connect with locals and visitors in the undercity',
  view: 'map',
  depiction: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&h=600&fit=crop',
  tags: ['city', 'community'],
  latitude: 37.8752,
  longitude: -122.2689,
  radius: 25000, // 25km radius covering pdx metro
  createdAt: '2024-01-25T08:00:00.000Z',
  updatedAt: '2024-01-25T08:00:00.000Z',
  metadata: {
    memberCount: 1523,
    recentPosts: 94,
    isPublic: true
  }
};


export const posts = [
    {
      "id": "/nightcity/welcome-post",
      "slug": "/nightcity/welcome-post",
      "parentId": "/nightcity",
      "title": "Welcome to Night City",
      "content": "This is the beginning of our journey into Night City. A place where stories unfold and mysteries await.",
      "type": "post",
      "tags": ["welcome", "introduction"],
      "latitude": 40.7128,
      "longitude": -74.0060,
      "radius": 1000,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "/nightcity/neon-district",
      "slug": "/nightcity/neon-district",
      "parentId": "/nightcity",
      "title": "The Neon District",
      "content": "The heart of Night City pulses with electric light. Here, the boundaries between reality and digital dreams blur.",
      "type": "zone",
      "tags": ["location", "neon", "district"],
      "latitude": 40.7128,
      "longitude": -74.0060,
      "radius": 800,
      "description": "A vibrant commercial and entertainment district known for its towering holographic advertisements and bustling nightlife.",
      "category": "commercial",
      "moderators": ["admin@nightcity.com"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "/nightcity/jack-chrome",
      "slug": "/nightcity/jack-chrome",
      "parentId": "/nightcity",
      "title": "Jack Chrome",
      "content": "A veteran netrunner who survived the corporate wars of the 2070s. Jack has seen the rise and fall of countless data fortresses and knows the dark web like the back of his cybernetic hand.",
      "type": "party",
      "tags": ["netrunner", "veteran", "hacker"],
      "bio": "Former Arasaka security specialist turned freelance netrunner.",
      "occupation": "Freelance Netrunner",
      "skills": ["ICE breaking", "data extraction", "neural hacking", "corporate espionage"],
      "latitude": 40.7200,
      "longitude": -74.0100,
      "radius": 200,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "/nightcity/corpo-plaza",
      "slug": "/nightcity/corpo-plaza",
      "parentId": "/nightcity",
      "title": "Corporate Plaza",
      "content": "The beating heart of corporate power in Night City. Towering skyscrapers house the regional headquarters of Arasaka, Militech, and other megacorps.",
      "type": "zone",
      "tags": ["corporate", "downtown", "business"],
      "description": "The central business district where corporate executives make decisions that affect millions.",
      "category": "corporate",
      "moderators": ["admin@nightcity.com"],
      "latitude": 40.7589,
      "longitude": -73.9851,
      "radius": 500,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "/nightcity/afterlife-bar",
      "slug": "/nightcity/afterlife-bar",
      "parentId": "/nightcity",
      "title": "Afterlife Bar",
      "content": "The most notorious bar in Night City, where mercenaries gather to drink, deal, and disappear. The neon-soaked interior pulses with the energy of a thousand deals gone wrong.",
      "type": "place",
      "tags": ["bar", "mercenary", "nightlife"],
      "address": "2077 Corpo Plaza, Night City",
      "hours": "18:00 - 04:00",
      "amenities": ["drinks", "private booths", "job board", "braindance"],
      "latitude": 40.7505,
      "longitude": -73.9934,
      "radius": 50,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "/nightcity/cyber-cat",
      "slug": "/nightcity/cyber-cat",
      "parentId": "/nightcity",
      "title": "Cyber Cat",
      "content": "A mysterious feline creature enhanced with cybernetic implants. These cats roam the streets of Night City, their glowing eyes scanning for data scraps and digital mice.",
      "type": "thing",
      "tags": ["cybernetic", "animal", "street"],
      "species": "Enhanced Feline",
      "behavior": "Curious and stealthy, often found near data terminals and electronic equipment.",
      "attributes": ["night vision", "data sensing", "stealth", "agile"],
      "latitude": 40.7614,
      "longitude": -73.9776,
      "radius": 100,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
]

