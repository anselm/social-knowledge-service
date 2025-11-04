// Demo news group with list view
export const newsGroup = {
  id: 'group-demo-news-001',
  slug: '/demo/news',
  parentId: 'group-demo-001',
  type: 'group',
  title: 'News & Updates',
  content: 'Latest news and updates - displayed in list view',
  view: 'list',
  depiction: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop',
  createdAt: '2024-02-01T10:00:00.000Z',
  updatedAt: '2024-02-01T10:00:00.000Z',
  permissions: ['public:view']
};

// News posts
export const newsPost1 = {
  id: 'post-news-001',
  slug: '/demo/news/update-1',
  parentId: 'group-demo-news-001',
  type: 'post',
  title: 'System Update Released',
  content: 'We have released a new system update with improved performance and bug fixes. This update includes several key improvements to the user interface and backend stability.',
  depiction: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop',
  createdAt: '2024-02-02T10:00:00.000Z',
  updatedAt: '2024-02-02T10:00:00.000Z'
};

export const newsPost2 = {
  id: 'post-news-002',
  slug: '/demo/news/announcement',
  parentId: 'group-demo-news-001',
  type: 'post',
  title: 'New Features Coming Soon',
  content: 'Exciting new features are in development and will be released next month. Stay tuned for updates on our roadmap.',
  createdAt: '2024-02-03T10:00:00.000Z',
  updatedAt: '2024-02-03T10:00:00.000Z'
};

export const newsPost3 = {
  id: 'post-news-003',
  slug: '/demo/news/community-update',
  parentId: 'group-demo-news-001',
  type: 'post',
  title: 'Community Growth Milestone',
  content: 'We are thrilled to announce that our community has reached 10,000 active members! Thank you for being part of this journey.',
  depiction: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
  createdAt: '2024-02-04T10:00:00.000Z',
  updatedAt: '2024-02-04T10:00:00.000Z'
};

