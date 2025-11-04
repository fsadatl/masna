'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/api';
import Link from 'next/link';
import { fa } from '@/locales/fa';

interface Proposal {
  id: number;
  project_id: number;
  executor_id: number;
  proposed_price?: number;
  proposed_timeline?: string;
  cover_letter?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  executor?: { id: number; full_name: string };
}

export default function MyProposalsPage() {
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/proposals/me');
        setItems(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusText = (s: string) => {
    if (s === 'pending') return 'در انتظار بررسی';
    if (s === 'accepted') return 'پذیرفته‌شده';
    if (s === 'rejected') return 'رد شده';
    return s;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">پیشنهادات من</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😶</div>
          <p className="text-gray-600">پیشنهادی ثبت نکرده‌اید.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  <div className="font-semibold">وضعیت: {statusText(p.status)}</div>
                  {p.proposed_price && (
                    <div>قیمت پیشنهادی: {p.proposed_price.toLocaleString()} تومان</div>
                  )}
                  {p.proposed_timeline && <div>زمان‌بندی: {p.proposed_timeline}</div>}
                  {p.cover_letter && (
                    <div className="mt-1 whitespace-pre-line text-gray-600">{p.cover_letter}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">{new Date(p.created_at).toLocaleString('fa-IR')}</div>
                </div>
                <Link href={`/projects/${p.project_id}`} className="btn-outline text-sm">
                  {fa.common.details}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

