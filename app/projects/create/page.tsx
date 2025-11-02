'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaIdParam = searchParams?.get('idea_id');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    requirements: '',
    idea_id: ideaIdParam ? Number(ideaIdParam) : undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">برای ایجاد پروژه وارد شوید</h2>
        <button className="btn-primary" onClick={() => router.push('/login')}>ورود</button>
      </div>
    );
  }

  if (user.role !== 'employer' && user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">دسترسی مجاز نیست</h2>
        <p className="text-gray-600 mb-4">ایجاد پروژه فقط توسط کارفرما یا ادمین امکان‌پذیر است.</p>
        <button className="btn-primary" onClick={() => router.push('/projects')}>بازگشت به پروژه‌ها</button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements || undefined,
      };
      if (formData.budget) payload.budget = Number(formData.budget);
      if (formData.deadline) payload.deadline = new Date(formData.deadline).toISOString();
      if (formData.idea_id) payload.idea_id = formData.idea_id;

      const res = await axios.post('/projects', payload);
      toast.success('پروژه با موفقیت ایجاد شد');
      router.push(`/projects/${res.data.id}`);
    } catch (error: any) {
      toast.error('خطا در ایجاد پروژه: ' + (error.response?.data?.detail || 'مشکلی پیش آمد'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ایجاد پروژه جدید</h1>
        <p className="text-gray-600">مشخصات پروژه را تکمیل کنید.</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="label">عنوان پروژه *</label>
            <input id="title" name="title" required className="input-field" value={formData.title} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="description" className="label">توضیحات *</label>
            <textarea id="description" name="description" rows={6} required className="input-field" value={formData.description} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget" className="label">بودجه (اختیاری)</label>
              <input id="budget" name="budget" type="number" className="input-field" value={formData.budget} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="deadline" className="label">موعد (اختیاری)</label>
              <input id="deadline" name="deadline" type="date" className="input-field" value={formData.deadline} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label htmlFor="requirements" className="label">نیازمندی‌ها (اختیاری)</label>
            <textarea id="requirements" name="requirements" rows={4} className="input-field" value={formData.requirements} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="idea_id" className="label">شناسه ایده (در صورت ایجاد از ایده)</label>
            <input id="idea_id" name="idea_id" type="number" className="input-field" value={formData.idea_id || ''} onChange={(e) => setFormData({ ...formData, idea_id: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button type="button" onClick={() => router.back()} className="btn-outline flex-1">انصراف</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'در حال ایجاد...' : 'ایجاد پروژه'}</button>
        </div>
      </form>
    </div>
  );
}
