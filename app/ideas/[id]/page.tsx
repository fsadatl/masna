'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/api';
import Link from 'next/link';

interface IdeaResponse {
  id: number;
  title: string;
  description: string;
  tags?: string[];
  requirements?: string;
  status: string;
  creator_id: number;
  executor_id?: number;
  created_at: string;
  creator?: {
    id: number;
    full_name: string;
    avatar_url?: string;
  };
}

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [idea, setIdea] = useState<IdeaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    const fetchIdea = async () => {
      try {
        const res = await axios.get(`/ideas/${id}`);
        setIdea(res.data);
      } catch (e) {
        // If not found, go back to list
        router.push('/ideas');
      } finally {
        setLoading(false);
      }
    };
    fetchIdea();
  }, [params, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ایده یافت نشد</h2>
        <Link href="/ideas" className="btn-primary">بازگشت به فهرست ایده‌ها</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{idea.title}</h1>
        <div className="text-sm text-gray-500">تاریخ ثبت: {new Date(idea.created_at).toLocaleDateString('fa-IR')}</div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-3">توضیحات</h2>
        <p className="text-gray-700 whitespace-pre-line">{idea.description}</p>
      </div>

      {idea.requirements && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-3">نیازمندی‌ها</h2>
          <p className="text-gray-700 whitespace-pre-line">{idea.requirements}</p>
        </div>
      )}

      {idea.tags && idea.tags.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-3">برچسب‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {idea.tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">ایجادکننده</h2>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center ml-3">
            <span className="text-sm font-medium text-gray-600">{idea.creator?.full_name?.charAt(0) || '?'}</span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{idea.creator?.full_name || 'ناشناس'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

