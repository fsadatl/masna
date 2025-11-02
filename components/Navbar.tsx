'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

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

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MS</span>
            </div>
            <span className="font-bold text-xl text-gray-900">
              ????
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/ideas" className="text-gray-700 hover:text-blue-600 transition-colors">
              ایده‌ها
            </Link>
            <Link href="/projects" className="text-gray-700 hover:text-blue-600 transition-colors">
              پروژه‌ها
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                  داشبورد
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600">
                    {user.full_name} ({getRoleText(user.role)})
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-outline text-sm"
                  >
                    خروج
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                  ورود
                </Link>
                <Link href="/register" className="btn-primary">
                  ثبت‌نام
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link href="/ideas" className="text-gray-700 hover:text-blue-600 transition-colors">
                ایده‌ها
              </Link>
              <Link href="/projects" className="text-gray-700 hover:text-blue-600 transition-colors">
                پروژه‌ها
              </Link>
              
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                    داشبورد
                  </Link>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">
                      {user.full_name} ({getRoleText(user.role)})
                    </div>
                    <button
                      onClick={handleLogout}
                      className="btn-outline w-full"
                    >
                      خروج
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                    ورود
                  </Link>
                  <Link href="/register" className="btn-primary w-full text-center">
                    ثبت‌نام
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
