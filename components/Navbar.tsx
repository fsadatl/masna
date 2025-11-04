'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fa } from '@/locales/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const getRoleText = (role: string) => (fa.navbar.role as any)[role] ?? role;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MS</span>
            </div>
            <span className="font-bold text-xl text-gray-900">{fa.appTitle}</span>
          </Link>

          {/* Center: Sections */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/ideas" className="px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-800 hover:bg-primary-100 transition-colors">
              {fa.navbar.ideas}
            </Link>
            <Link href="/projects" className="px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-800 hover:bg-primary-100 transition-colors">
              {fa.navbar.projects}
            </Link>
          </div>

          {/* Right: User pill / auth links */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
                  {fa.navbar.dashboard}
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.75 20.1a8.25 8.25 0 0116.5 0 .9.9 0 01-.9.9H4.65a.9.9 0 01-.9-.9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{user.full_name}</span>
                </div>
                <button onClick={handleLogout} className="btn-outline text-sm">{fa.navbar.logout}</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-primary-600 transition-colors">{fa.navbar.login}</Link>
                <Link href="/register" className="btn-primary">{fa.navbar.register}</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-primary-600 transition-colors">
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
              <div className="flex items-center gap-3">
                <Link href="/ideas" className="px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-800 hover:bg-primary-100 transition-colors">{fa.navbar.ideas}</Link>
                <Link href="/projects" className="px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-800 hover:bg-primary-100 transition-colors">{fa.navbar.projects}</Link>
              </div>
              
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {fa.navbar.dashboard}
                  </Link>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-800 w-max">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.75 20.1a8.25 8.25 0 0116.5 0 .9.9 0 01-.9.9H4.65a.9.9 0 01-.9-.9z" clipRule="evenodd" />
                      </svg>
                      <span>{user.full_name}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-outline w-full mt-3">
                      {fa.navbar.logout}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {fa.navbar.login}
                  </Link>
                  <Link href="/register" className="btn-primary w-full text-center">
                    {fa.navbar.register}
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
