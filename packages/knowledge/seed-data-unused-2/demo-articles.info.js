// Demo articles group with cards view
export const articlesGroup = {
  id: 'group-demo-articles-001',
  slug: '/demo/articles',
  parentId: 'group-demo-001',
  type: 'group',
  title: 'Featured Articles',
  content: 'Long-form articles - displayed in cards view',
  view: 'cards',
  depiction: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&h=600&fit=crop',
  createdAt: '2024-02-01T12:00:00.000Z',
  updatedAt: '2024-02-01T12:00:00.000Z',
  permissions: ['public:view']
};

// Article posts
export const articlePost1 = {
  id: 'post-articles-001',
  slug: '/demo/articles/future-tech',
  parentId: 'group-demo-articles-001',
  type: 'post',
  title: 'The Future of Technology',
  content: 'An in-depth exploration of emerging technologies and their potential impact on society. This article examines artificial intelligence, quantum computing, and biotechnology advances that will shape our future.',
  depiction: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
  createdAt: '2024-02-02T12:00:00.000Z',
  updatedAt: '2024-02-02T12:00:00.000Z'
};

export const articlePost2 = {
  id: 'post-articles-002',
  slug: '/demo/articles/climate-change',
  parentId: 'group-demo-articles-001',
  type: 'post',
  title: 'Climate Change: A Global Challenge',
  content: 'Understanding the science behind climate change and exploring solutions for a sustainable future. This comprehensive article covers the latest research, policy developments, and individual actions we can take.',
  depiction: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=600&fit=crop',
  createdAt: '2024-02-03T12:00:00.000Z',
  updatedAt: '2024-02-03T12:00:00.000Z'
};

export const articlePost3 = {
  id: 'post-articles-003',
  slug: '/demo/articles/remote-work',
  parentId: 'group-demo-articles-001',
  type: 'post',
  title: 'The Evolution of Remote Work',
  content: 'How the global shift to remote work is reshaping our professional lives, cities, and social structures. We explore the benefits, challenges, and long-term implications of this workplace revolution.',
  depiction: 'https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=800&h=600&fit=crop',
  createdAt: '2024-02-04T12:00:00.000Z',
  updatedAt: '2024-02-04T12:00:00.000Z'
};

