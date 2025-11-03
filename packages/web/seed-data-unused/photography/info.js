// Photography club group and content
export const photographyGroup = {
  id: '/photography',
  slug: '/photography',
  parentId: '/',  
  type: 'group',
  title: 'Photography Club',
  content: 'Share your photos, get feedback, and learn photography techniques',
  view: 'grid',
  depiction: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&h=600&fit=crop',
  tags: ['photography', 'art', 'camera', 'creative'],
  createdAt: '2024-02-01T14:00:00.000Z',
  updatedAt: '2024-02-01T14:00:00.000Z',
  metadata: {
    memberCount: 89,
    recentPosts: 67,
    isPublic: true
  }
};

// Photography posts
export const photoPost1 = {
  id: '/photography/golden-hour-tips',
  slug: '/photography/golden-hour-tips',
  parentId: '/photography',
  type: 'post',
  title: 'Golden hour photography tips',
  content: 'The golden hour is the best time for photography. Here are some tips to make the most of it: use manual mode, shoot in RAW, and experiment with backlighting.',
  depiction: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800&h=600&fit=crop',
  sponsorId: 'admin-001',
  tags: ['golden-hour', 'tips', 'lighting'],
  createdAt: '2024-03-10T16:00:00.000Z',
  updatedAt: '2024-03-10T16:00:00.000Z'
};

export const photoPost2 = {
  id: '/photography/street-photography',
  slug: '/photography/street-photography',
  parentId: '/photography',
  type: 'post',
  title: 'Street Photography Essentials',
  content: 'Capturing life on the streets requires quick reflexes and an eye for moments. Learn about camera settings, composition, and the ethics of street photography.',
  depiction: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=800&h=600&fit=crop',
  tags: ['street-photography', 'urban', 'candid'],
  createdAt: '2024-03-11T10:00:00.000Z',
  updatedAt: '2024-03-11T10:00:00.000Z'
};

export const photoPost3 = {
  id: '/photography/editing-workflow',
  slug: '/photography/editing-workflow',
  parentId: '/photography',
  type: 'post',
  title: 'My Photo Editing Workflow',
  content: 'A step-by-step guide to my photo editing process using Lightroom and Photoshop. From RAW processing to final touches.',
  depiction: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop',
  tags: ['editing', 'lightroom', 'photoshop', 'workflow'],
  createdAt: '2024-03-12T14:00:00.000Z',
  updatedAt: '2024-03-12T14:00:00.000Z'
};

export const photoPost4 = {
  id: '/photography/portrait-lighting',
  slug: '/photography/portrait-lighting',
  parentId: '/photography',
  type: 'post',
  title: 'Portrait Lighting Techniques',
  content: 'Master the art of portrait lighting with these fundamental techniques: Rembrandt, butterfly, split, and loop lighting explained.',
  depiction: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
  tags: ['portrait', 'lighting', 'studio', 'techniques'],
  createdAt: '2024-03-13T11:00:00.000Z',
  updatedAt: '2024-03-13T11:00:00.000Z'
};

