import { User } from '@/types';

// Fixed admin accounts - only these 4 can be admins
export const ADMIN_ACCOUNTS: Array<{ email: string; password: string; name: string }> = [
  { email: 'fino@gmail.com', password: 'fino@elkawera', name: 'Fino' },
  { email: 'youssef@gmail.com', password: 'youssef@elkawera', name: 'Youssef' },
  { email: 'falaky@gmail.com', password: 'falaky@elkawera', name: 'Falaky' },
  { email: 'omar@gmail.com', password: 'omar@elkawera', name: 'Omar' },
  { email: 'mohamed@gmail.com', password: 'mohamed@elkawera', name: 'Mohamed' },
];

export const isAdminAccount = (email: string, password: string): boolean => {
  return ADMIN_ACCOUNTS.some(admin => admin.email === email && admin.password === password);
};

export const getAdminName = (email: string): string | undefined => {
  const admin = ADMIN_ACCOUNTS.find(a => a.email === email);
  return admin?.name;
};


