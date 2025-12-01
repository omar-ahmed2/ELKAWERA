import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Team } from '../types';
import { loginUser, registerUser, registerCaptain, updateUser } from '../utils/db';
import { isAdminAccount, getAdminName } from '../utils/adminAccounts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, age?: number, height?: number, weight?: number, strongFoot?: 'Left' | 'Right', position?: string, role?: UserRole) => Promise<User>;
  signUpCaptain: (name: string, email: string, password: string, age: number, teamName: string, teamAbbr: string, teamLogo?: string) => Promise<{ user: User; team: Team }>;
  updateProfile: (name: string, profileImageUrl?: string, role?: UserRole) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('elkawera_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Ensure role is set (for backward compatibility)
      if (!parsedUser.role) {
        parsedUser.role = 'player';
      }
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Check if this is an admin account
      if (isAdminAccount(email, password)) {
        const adminName = getAdminName(email);
        const adminUser: User = {
          id: `admin-${email}`,
          email,
          name: adminName || 'Admin',
          passwordHash: password,
          role: 'admin',
          country: 'EG', // Egypt by default for admins
          createdAt: Date.now()
        };
        setUser(adminUser);
        localStorage.setItem('elkawera_user', JSON.stringify(adminUser));
        return;
      }

      // Regular user login
      const loggedInUser = await loginUser(email, password);
      setUser(loggedInUser);
      localStorage.setItem('elkawera_user', JSON.stringify(loggedInUser));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    age?: number,
    height?: number,
    weight?: number,
    strongFoot?: 'Left' | 'Right',
    position?: string,
    role: UserRole = 'player'
  ) => {
    setLoading(true);
    try {
      const newUser = await registerUser(name, email, password, age, height, weight, strongFoot, position, role);
      setUser(newUser);
      localStorage.setItem('elkawera_user', JSON.stringify(newUser));
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const signUpCaptain = async (
    name: string,
    email: string,
    password: string,
    age: number,
    teamName: string,
    teamAbbr: string,
    teamLogo?: string
  ) => {
    setLoading(true);
    try {
      const { user: newCaptain, team } = await registerCaptain(name, email, password, age, teamName, teamAbbr, teamLogo);
      setUser(newCaptain);
      localStorage.setItem('elkawera_user', JSON.stringify(newCaptain));
      return { user: newCaptain, team };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (name: string, profileImageUrl?: string, role?: UserRole) => {
    if (!user) return;
    setLoading(true);
    try {
      // If profileImageUrl is provided, use it. If it's explicitly null (cleared), use undefined. 
      // If it's undefined (not passed), keep the existing one.
      const newImage = profileImageUrl !== undefined ? profileImageUrl : user.profileImageUrl;
      const newRole = role !== undefined ? role : user.role;

      const updatedUser: User = {
        ...user,
        name,
        profileImageUrl: newImage,
        role: newRole
      };

      await updateUser(updatedUser);
      setUser(updatedUser);
      localStorage.setItem('elkawera_user', JSON.stringify(updatedUser));
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('elkawera_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signUpCaptain, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
