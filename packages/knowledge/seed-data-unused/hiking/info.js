// Hiking enthusiasts group and content
export const hikingGroup = {
  id: '/hiking',
  slug: '/hiking',
  parentId: '/',  
  type: 'group',
  title: 'Hiking Enthusiasts',
  content: 'A community for people who love hiking and outdoor adventures',
  view: 'list',
  depiction: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=600&fit=crop',
  tags: ['outdoors', 'hiking', 'nature', 'fitness'],
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
  metadata: {
    memberCount: 156,
    recentPosts: 42,
    isPublic: true
  }
};

// Hiking posts
export const hikingPost1 = {
  id: '/hiking/weekend-tamalpais',
  slug: '/hiking/weekend-tamalpais',
  parentId: '/hiking',
  type: 'post',
  title: 'Weekend hike to Mount Tamalpais',
  content: 'Planning a group hike this Saturday morning. Who wants to join? We will meet at the Pantoll parking lot at 8 AM and take the Steep Ravine trail.',
  depiction: 'https://images.unsplash.com/photo-1533692328991-08159ff19fca?w=800&h=600&fit=crop',
  sponsorId: 'admin-001',
  tags: ['hike', 'weekend', 'mount-tamalpais'],
  latitude: 37.9235,
  longitude: -122.5965,
  radius: 5000,
  createdAt: '2024-03-01T09:00:00.000Z',
  updatedAt: '2024-03-01T09:00:00.000Z'
};

export const hikingPost2 = {
  id: '/hiking/gear-recommendations',
  slug: '/hiking/gear-recommendations',
  parentId: '/hiking',
  type: 'post',
  title: 'Essential Hiking Gear for Beginners',
  content: 'Starting your hiking journey? Here is a comprehensive list of essential gear you will need for safe and enjoyable hikes.',
  depiction: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&h=600&fit=crop',
  tags: ['gear', 'beginners', 'equipment'],
  createdAt: '2024-03-02T14:00:00.000Z',
  updatedAt: '2024-03-02T14:00:00.000Z'
};

export const hikingPost3 = {
  id: '/hiking/trail-conditions',
  slug: '/hiking/trail-conditions',
  parentId: '/hiking',
  type: 'post',
  title: 'Trail Conditions Update - Bay Area',
  content: 'Recent rain has made some trails muddy and slippery. Please be careful and wear appropriate footwear. Avoid steep trails until they dry out.',
  depiction: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&h=600&fit=crop',
  tags: ['trail-conditions', 'safety', 'bay-area'],
  createdAt: '2024-03-03T08:00:00.000Z',
  updatedAt: '2024-03-03T08:00:00.000Z'
};

