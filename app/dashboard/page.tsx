'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  ideas_count: number;
  projects_count: number;
  proposals_count: number;
  completed_projects: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/dashboard/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          لطفاً وارد شوید
        </h2>
        <Link href="/login" className="btn-primary">
          ورود
        </Link>
      </div>
    );
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'idea_creator':
        return 'ایده‌دهنده';
      case 'executor':
        return 'مجری';
      case 'employer':
        return 'کارفرما';
      case 'admin':
        return 'مدیر سیستم';
      default:
        return role;
    }
  };

  const getQuickActions = () => {
    switch (user.role) {
      case 'idea_creator':
        return [
          { title: 'ایجاد ایده جدید', href: '/ideas/create', icon: '💡' },
          { title: 'مشاهده ایده‌های من', href: '/ideas?my=true', icon: '📝' },
        ];
      case 'executor':
        return [
          { title: 'مشاهده پروژه‌ها', href: '/projects', icon: '🚀' },
          { title: 'پیشنهادات من', href: '/proposals', icon: '📋' },
        ];
      case 'employer':
        return [
          { title: 'ایجاد پروژه جدید', href: '/projects/create', icon: '➕' },
          { title: 'پروژه‌های من', href: '/projects?my=true', icon: '📊' },
        ];
      case 'admin':
        return [
          { title: 'مدیریت کاربران', href: '/admin/users', icon: '👥' },
          { title: 'مدیریت پروژه‌ها', href: '/admin/projects', icon: '⚙️' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          خوش آمدید، {user.full_name}
        </h1>
        <p className="text-gray-600">
          نقش شما: {getRoleText(user.role)}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💡</div>
              <div>
                <p className="text-sm font-medium text-gray-600">ایده‌ها</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ideas_count}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🚀</div>
              <div>
                <p className="text-sm font-medium text-gray-600">پروژه‌ها</p>
                <p className="text-2xl font-bold text-gray-900">{stats.projects_count}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📋</div>
              <div>
                <p className="text-sm font-medium text-gray-600">پیشنهادات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.proposals_count}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="text-2xl mr-3">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">پروژه‌های تکمیل‌شده</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed_projects}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">دسترسی سریع</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getQuickActions().map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="text-2xl mr-3">{action.icon}</div>
              <span className="font-medium">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">فعالیت‌های اخیر</h2>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg mr-3">📝</div>
            <div>
              <p className="font-medium">ایده جدیدی ایجاد کردید</p>
              <p className="text-sm text-gray-600">2 ساعت پیش</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg mr-3">💬</div>
            <div>
              <p className="font-medium">پیام جدیدی دریافت کردید</p>
              <p className="text-sm text-gray-600">5 ساعت پیش</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg mr-3">✅</div>
            <div>
              <p className="font-medium">پروژه تکمیل شد</p>
              <p className="text-sm text-gray-600">1 روز پیش</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
