'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/lib/api';
import Link from 'next/link';

interface Project {
  id: number;
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  status: string;
  employer_id: number;
  executor_id?: number;
  created_at: string;
  employer?: {
    id: number;
    full_name: string;
    avatar_url?: string;
  };
  executor?: {
    id: number;
    full_name: string;
    avatar_url?: string;
  };
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    employer_id: '',
    search: '',
  });

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.employer_id) params.append('employer_id', filters.employer_id);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/projects?${params.toString()}`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'جدید';
      case 'in_progress':
        return 'در حال اجرا';
      case 'completed':
        return 'تکمیل‌شده';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApplyToProject = async (projectId: number) => {
    if (!user || user.role !== 'executor') {
      alert('فقط مجریان می‌توانند برای پروژه‌ها درخواست ارسال کنند');
      return;
    }

    try {
      // This would create a proposal for the project
      alert('درخواست شما ارسال شد!');
    } catch (error) {
      console.error('Error applying to project:', error);
      alert('خطا در ارسال درخواست');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">پروژه‌ها</h1>
        {user?.role === 'employer' && (
          <Link href="/projects/create" className="btn-primary">
            ایجاد پروژه جدید
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">فیلترها</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">وضعیت</label>
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">همه</option>
              <option value="new">جدید</option>
              <option value="in_progress">در حال اجرا</option>
              <option value="completed">تکمیل‌شده</option>
              <option value="cancelled">لغو شده</option>
            </select>
          </div>
          
          <div>
            <label className="label">کارفرما</label>
            <input
              type="text"
              className="input-field"
              placeholder="جستجو بر اساس نام..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', employer_id: '', search: '' })}
              className="btn-outline w-full"
            >
              پاک کردن فیلترها
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {project.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {getStatusText(project.status)}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {project.description}
            </p>
            
            <div className="space-y-2 mb-4">
              {project.budget && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 ml-2">بودجه:</span>
                  <span className="font-medium">{project.budget.toLocaleString()} تومان</span>
                </div>
              )}
              
              {project.deadline && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 ml-2">مهلت:</span>
                  <span className="font-medium">
                    {new Date(project.deadline).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                  <span className="text-sm font-medium text-gray-600">
                    {project.employer?.full_name?.charAt(0) || '?'}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {project.employer?.full_name || 'نامشخص'}
                </span>
              </div>
              
              <div className="text-xs text-gray-500">
                {new Date(project.created_at).toLocaleDateString('fa-IR')}
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="btn-outline flex-1 text-center text-sm"
                >
                  مشاهده جزئیات
                </Link>
                
                {user?.role === 'executor' && project.status === 'new' && (
                  <button
                    onClick={() => handleApplyToProject(project.id)}
                    className="btn-primary text-sm"
                  >
                    ارسال پیشنهاد
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            هیچ پروژه‌ای یافت نشد
          </h3>
          <p className="text-gray-600 mb-4">
            {filters.status || filters.search
              ? 'با فیلترهای انتخابی هیچ پروژه‌ای یافت نشد'
              : 'هنوز هیچ پروژه‌ای ثبت نشده است'}
          </p>
          {user?.role === 'employer' && (
            <Link href="/projects/create" className="btn-primary">
              اولین پروژه را ایجاد کنید
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
