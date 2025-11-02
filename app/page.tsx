'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const features = [
    {
      title: 'ایده‌های نوآورانه',
      description: 'ایده‌های خود را ثبت کنید و با مجریان متخصص ارتباط برقرار کنید',
      icon: '💡',
    },
    {
      title: 'پروژه‌های متنوع',
      description: 'پروژه‌های مختلف را مشاهده کنید و پیشنهادات خود را ارسال کنید',
      icon: '🚀',
    },
    {
      title: 'همکاری مؤثر',
      description: 'با کارفرمایان و مجریان در یک پلتفرم یکپارچه همکاری کنید',
      icon: '🤝',
    },
  ];

  const roles = [
    {
      title: 'ایده‌دهنده',
      description: 'ایده‌های خلاقانه خود را به اشتراک بگذارید',
      features: ['ثبت ایده‌های نوآورانه', 'ارتباط با مجریان', 'تبدیل ایده به پروژه'],
    },
    {
      title: 'مجری',
      description: 'مهارت‌های خود را برای اجرای پروژه‌ها به کار بگیرید',
      features: ['مشاهده پروژه‌ها', 'ارسال پیشنهاد', 'اجرای پروژه‌ها'],
    },
    {
      title: 'کارفرما',
      description: 'پروژه‌های خود را تعریف کنید و مجریان مناسب را انتخاب کنید',
      features: ['ایجاد پروژه', 'انتخاب مجری', 'مدیریت پروژه'],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            ???? | ?????? ???? ?? ??????
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            جایی که ایده‌ها به پروژه‌های موفق تبدیل می‌شوند
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                ورود به داشبورد
              </button>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  شروع کنید
                </Link>
                <Link
                  href="/login"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  ورود
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ویژگی‌های پلتفرم
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            نقش‌های مختلف
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {roles.map((role, index) => (
              <div key={index} className="card">
                <h3 className="text-xl font-semibold mb-3">{role.title}</h3>
                <p className="text-gray-600 mb-4">{role.description}</p>
                <ul className="space-y-2">
                  {role.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                      <span className="w-2 h-2 bg-blue-600 rounded-full ml-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            آماده شروع هستید؟
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            همین حالا ثبت‌نام کنید و به جامعه ما بپیوندید
          </p>
          {!user && (
            <Link
              href="/register"
              className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200 inline-block"
            >
              ثبت‌نام رایگان
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
