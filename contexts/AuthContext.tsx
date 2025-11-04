'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'idea_creator' | 'executor' | 'employer' | 'admin';
  bio?: string;
  skills?: string[];
  portfolio_url?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/users/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('access_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = new URLSearchParams();
      data.append('username', email);
      data.append('password', password);

      const response = await axios.post('/auth/login', data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await fetchUser();
      toast.success('ورود با موفقیت انجام شد');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('خطا در ورود: ' + (error.response?.data?.detail || 'خطای ناشناخته'));
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      await axios.post('/auth/register', userData);
      toast.success('ثبت‌نام با موفقیت انجام شد');
      router.push('/login');
    } catch (error: any) {
      toast.error('خطا در ثبت‌نام: ' + (error.response?.data?.detail || 'خطای ناشناخته'));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    router.push('/');
    toast.success('خروج با موفقیت انجام شد');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

