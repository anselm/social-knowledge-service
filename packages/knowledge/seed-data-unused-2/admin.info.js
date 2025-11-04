// Admin user entity
export default {
  id: 'admin-001',
  slug: '/admin',
  parentId: 'root-group',  
  type: 'party',
  title: 'System Administrator',
  content: 'The system administrator account with full permissions',
  depiction: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
  permissions: ['admin', 'create', 'read', 'update', 'delete'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};
