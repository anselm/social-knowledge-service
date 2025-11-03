// Bali community group and content
export const baliGroup = {
  id: '/bali',
  slug: '/bali',
  parentId: '/',  
  type: 'group',
  title: 'Bali Community',
  content: 'Connect with people interested in Bali - travel, culture, and living',
  view: 'cards',
  depiction: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=600&fit=crop',
  tags: ['travel', 'indonesia', 'bali', 'culture', 'expat'],
  latitude: -8.4095,
  longitude: 115.1889,
  radius: 50000, // 50km radius covering most of Bali
  createdAt: '2024-01-20T08:00:00.000Z',
  updatedAt: '2024-01-20T08:00:00.000Z',
  metadata: {
    memberCount: 342,
    recentPosts: 28,
    isPublic: true
  }
};

// Bali posts
export const baliPost1 = {
  id: '/bali/canggu-cafes',
  slug: '/bali/canggu-cafes',
  parentId: '/bali',
  type: 'post',
  title: 'Best cafes in Canggu for digital nomads',
  content: 'Here are my top 5 cafes with good wifi and great coffee in Canggu area. Each offers a unique atmosphere and reliable internet for remote work.',
  depiction: 'https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800&h=600&fit=crop',
  sponsorId: 'admin-001',
  tags: ['canggu', 'cafe', 'digital-nomad', 'wifi'],
  latitude: -8.6478,
  longitude: 115.1385,
  radius: 2000,
  createdAt: '2024-03-05T11:30:00.000Z',
  updatedAt: '2024-03-05T11:30:00.000Z'
};

export const baliPost2 = {
  id: '/bali/visa-guide',
  slug: '/bali/visa-guide',
  parentId: '/bali',
  type: 'post',
  title: 'Complete Visa Guide for Bali 2024',
  content: 'Everything you need to know about visa options for Bali, including the new digital nomad visa, tourist visas, and business visas.',
  depiction: 'https://images.unsplash.com/photo-1558005530-a7958896ec60?w=800&h=600&fit=crop',
  tags: ['visa', 'immigration', 'digital-nomad', 'guide'],
  createdAt: '2024-03-06T09:00:00.000Z',
  updatedAt: '2024-03-06T09:00:00.000Z'
};

export const baliPost3 = {
  id: '/bali/temple-etiquette',
  slug: '/bali/temple-etiquette',
  parentId: '/bali',
  type: 'post',
  title: 'Temple Etiquette in Bali',
  content: 'Visiting Balinese temples? Here is what you need to know about proper dress code, behavior, and cultural sensitivity.',
  depiction: 'https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800&h=600&fit=crop',
  tags: ['temple', 'culture', 'etiquette', 'respect'],
  createdAt: '2024-03-07T15:00:00.000Z',
  updatedAt: '2024-03-07T15:00:00.000Z'
};

