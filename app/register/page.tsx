'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UserRole = 'idea_creator' | 'executor' | 'employer';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'idea_creator' as UserRole,
    bio: '',
    skills: '',
    portfolio_url: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('رمزهای عبور مطابقت ندارند');
      return;
    }

    setLoading(true);
    
    try {
      const { confirmPassword, ...userData } = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
      };
      
      await register(userData);
    } catch (error) {
      // Error is handled in the AuthContext
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'idea_creator', label: 'ایده‌دهنده' },
    { value: 'executor', label: 'مجری' },
    { value: 'employer', label: 'کارفرما' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ایجاد حساب کاربری
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            یا{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              وارد حساب موجود شوید
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="label">
                نام کامل
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="input-field"
                placeholder="نام و نام خانوادگی"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="label">
                ایمیل
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field"
                placeholder="آدرس ایمیل"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="role" className="label">
                نقش
              </label>
              <select
                id="role"
                name="role"
                required
                className="input-field"
                value={formData.role}
                onChange={handleChange}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                رمز عبور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field"
                placeholder="رمز عبور"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="label">
                تأیید رمز عبور
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input-field"
                placeholder="تأیید رمز عبور"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="bio" className="label">
                بیوگرافی (اختیاری)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                className="input-field"
                placeholder="توضیح مختصری درباره خود"
                value={formData.bio}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="skills" className="label">
                مهارت‌ها (اختیاری)
              </label>
              <input
                id="skills"
                name="skills"
                type="text"
                className="input-field"
                placeholder="مهارت‌ها را با کاما جدا کنید"
                value={formData.skills}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="portfolio_url" className="label">
                لینک نمونه‌کار (اختیاری)
              </label>
              <input
                id="portfolio_url"
                name="portfolio_url"
                type="url"
                className="input-field"
                placeholder="https://example.com"
                value={formData.portfolio_url}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
