'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateIdeaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    requirements: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.role !== 'idea_creator') {
      toast.error('فقط ایده‌دهندگان می‌توانند ایده ایجاد کنند');
      return;
    }

    setLoading(true);
    
    try {
      const ideaData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      };
      
      await axios.post('/ideas', ideaData);
      toast.success('ایده با موفقیت ایجاد شد!');
      router.push('/ideas');
    } catch (error: any) {
      toast.error('خطا در ایجاد ایده: ' + (error.response?.data?.detail || 'خطای نامشخص'));
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
        <p className="text-gray-600 mb-4">
          برای ایجاد ایده باید وارد حساب کاربری خود شوید
        </p>
        <button
          onClick={() => router.push('/login')}
          className="btn-primary"
        >
          ورود
        </button>
      </div>
    );
  }

  if (user.role !== 'idea_creator') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          دسترسی محدود
        </h2>
        <p className="text-gray-600 mb-4">
          فقط ایده‌دهندگان می‌توانند ایده ایجاد کنند
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-primary"
        >
          بازگشت به داشبورد
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ایجاد ایده جدید
        </h1>
        <p className="text-gray-600">
          ایده خلاقانه خود را به اشتراک بگذارید
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="label">
              عنوان ایده *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="input-field"
              placeholder="عنوان جذاب و خلاصه برای ایده خود"
              value={formData.title}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="description" className="label">
              توضیحات ایده *
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              required
              className="input-field"
              placeholder="توضیح کامل و جامع درباره ایده خود، شامل اهداف، مزایا و کاربردها"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="tags" className="label">
              برچسب‌ها (اختیاری)
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              className="input-field"
              placeholder="برچسب‌ها را با کاما جدا کنید (مثال: فناوری، نوآوری، کسب‌وکار)"
              value={formData.tags}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500 mt-1">
              برچسب‌ها به دیگران کمک می‌کنند تا ایده شما را راحت‌تر پیدا کنند
            </p>
          </div>
          
          <div>
            <label htmlFor="requirements" className="label">
              نیازمندی‌های اجرایی (اختیاری)
            </label>
            <textarea
              id="requirements"
              name="requirements"
              rows={4}
              className="input-field"
              placeholder="مهارت‌ها، تکنولوژی‌ها یا منابع مورد نیاز برای اجرای این ایده"
              value={formData.requirements}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500 mt-1">
              این اطلاعات به مجریان کمک می‌کند تا بفهمند آیا می‌توانند این ایده را اجرا کنند
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-outline flex-1"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'در حال ایجاد...' : 'ایجاد ایده'}
          </button>
        </div>
      </form>
    </div>
  );
}
