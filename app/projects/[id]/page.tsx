'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface UserLite { id: number; full_name: string; avatar_url?: string }
interface Project {
  id: number;
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  requirements?: string;
  status: string;
  employer_id: number;
  executor_id?: number;
  created_at: string;
  employer?: UserLite;
  executor?: UserLite;
}
interface Proposal {
  id: number;
  project_id: number;
  executor_id: number;
  proposed_price?: number;
  proposed_timeline?: string;
  cover_letter?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  executor?: UserLite;
}
interface FileUpload {
  id: number;
  project_id: number;
  uploaded_by: number;
  filename: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  is_final_delivery: boolean;
  created_at: string;
}

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [files, setFiles] = useState<FileUpload[]>([]);

  // Proposal form state (for executors)
  const [proposalForm, setProposalForm] = useState({
    proposed_price: '',
    proposed_timeline: '',
    cover_letter: '',
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Upload state (for employer/executor)
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFinalDelivery, setIsFinalDelivery] = useState(false);

  const id = useMemo(() => (params?.id ? Number(params.id as string) : undefined), [params]);

  const canViewProposals = useMemo(() => {
    if (!user || !project) return false;
    return user.role === 'admin' || user.id === project.employer_id;
  }, [user, project]);

  const canUploadFiles = useMemo(() => {
    if (!user || !project) return false;
    return user.role === 'admin' || user.id === project.employer_id || user.id === project.executor_id;
  }, [user, project]);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const [pRes] = await Promise.all([
          axios.get(`/projects/${id}`),
        ]);
        setProject(pRes.data);
        // Proposals for employer/admin
        if (user && (user.role === 'admin' || user.id === pRes.data.employer_id)) {
          fetchProposals(id);
        }
        // Files for involved users
        if (user && (user.role === 'admin' || user.id === pRes.data.employer_id || user.id === pRes.data.executor_id)) {
          fetchFiles(id);
        }
      } catch (e) {
        router.push('/projects');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchProposals = async (projectId: number) => {
    try {
      const res = await axios.get(`/projects/${projectId}/proposals`);
      setProposals(res.data);
    } catch (e) {
      // ignore if unauthorized
    }
  };

  const fetchFiles = async (projectId: number) => {
    try {
      const res = await axios.get(`/projects/${projectId}/files`);
      setFiles(res.data);
    } catch (e) {
      // ignore if unauthorized
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingProposal(true);
    try {
      const payload: any = {
        project_id: id,
        cover_letter: proposalForm.cover_letter || undefined,
      };
      if (proposalForm.proposed_price) payload.proposed_price = Number(proposalForm.proposed_price);
      if (proposalForm.proposed_timeline) payload.proposed_timeline = proposalForm.proposed_timeline;

      await axios.post('/proposals', payload);
      toast.success('پیشنهاد شما ثبت شد');
      setProposalForm({ proposed_price: '', proposed_timeline: '', cover_letter: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'ثبت پیشنهاد ناموفق بود');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleProposalDecision = async (proposalId: number, status: 'accepted' | 'rejected') => {
    if (!id) return;
    try {
      await axios.put(`/proposals/${proposalId}`, { status });
      toast.success(status === 'accepted' ? 'پیشنهاد پذیرفته شد' : 'پیشنهاد رد شد');
      await fetchProposals(id);
      // Refresh project to reflect executor/status
      const p = await axios.get(`/projects/${id}`);
      setProject(p.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'عملیات ناموفق بود');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('is_final_delivery', String(isFinalDelivery));
      await axios.post(`/projects/${id}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('فایل با موفقیت بارگذاری شد');
      setSelectedFile(null);
      setIsFinalDelivery(false);
      await fetchFiles(id);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'بارگذاری ناموفق بود');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">پروژه یافت نشد</h2>
        <button className="btn-primary" onClick={() => router.push('/projects')}>بازگشت</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
        <div className="text-sm text-gray-500">تاریخ ثبت: {new Date(project.created_at).toLocaleDateString('fa-IR')}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">توضیحات</h2>
            <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
          </div>

          {project.requirements && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">نیازمندی‌ها</h2>
              <p className="text-gray-700 whitespace-pre-line">{project.requirements}</p>
            </div>
          )}

          {canUploadFiles && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">فایل‌های پروژه</h2>
              <form onSubmit={handleUpload} className="mb-4 flex flex-col md:flex-row gap-3 items-start">
                <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="" />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={isFinalDelivery} onChange={(e) => setIsFinalDelivery(e.target.checked)} />
                  تحویل نهایی
                </label>
                <button type="submit" disabled={uploading || !selectedFile} className="btn-primary text-sm">{uploading ? 'در حال بارگذاری...' : 'بارگذاری فایل'}</button>
              </form>

              <div className="space-y-2">
                {files.length === 0 && <div className="text-sm text-gray-500">فایلی ثبت نشده است.</div>}
                {files.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                    <div className="text-sm">
                      <div className="font-medium">{f.filename}{f.is_final_delivery ? ' (تحویل نهایی)' : ''}</div>
                      <div className="text-gray-500">{new Date(f.created_at).toLocaleString('fa-IR')}</div>
                    </div>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${f.file_url}`} target="_blank" rel="noreferrer" className="btn-outline text-xs">دانلود</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-3">اطلاعات</h3>
            <div className="space-y-2 text-sm">
              {project.budget && (
                <div className="flex items-center"><span className="text-gray-500 ml-2">بودجه:</span> <span className="font-medium">{project.budget.toLocaleString()} تومان</span></div>
              )}
              {project.deadline && (
                <div className="flex items-center"><span className="text-gray-500 ml-2">موعد:</span> <span className="font-medium">{new Date(project.deadline).toLocaleDateString('fa-IR')}</span></div>
              )}
              <div className="flex items-center"><span className="text-gray-500 ml-2">وضعیت:</span> <span className="font-medium">{project.status}</span></div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">کارفرما</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center ml-3">
                <span className="text-sm font-medium text-gray-600">{project.employer?.full_name?.charAt(0) || '?'}</span>
              </div>
              <div className="font-medium">{project.employer?.full_name || 'ناشناس'}</div>
            </div>
          </div>

          {project.executor && (
            <div className="card">
              <h3 className="font-semibold mb-3">مجری</h3>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center ml-3">
                  <span className="text-sm font-medium text-gray-600">{project.executor?.full_name?.charAt(0) || '?'}</span>
                </div>
                <div className="font-medium">{project.executor?.full_name}</div>
              </div>
            </div>
          )}

          {user && user.role === 'executor' && project.status === 'new' && (
            <div className="card">
              <h3 className="font-semibold mb-3">ارسال پیشنهاد</h3>
              <form onSubmit={handleSubmitProposal} className="space-y-3">
                <div>
                  <label className="label">مبلغ پیشنهادی</label>
                  <input className="input-field" type="number" value={proposalForm.proposed_price} onChange={(e) => setProposalForm({ ...proposalForm, proposed_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">زمان‌بندی پیشنهادی</label>
                  <input className="input-field" placeholder="مثلاً ۳۰ روز" value={proposalForm.proposed_timeline} onChange={(e) => setProposalForm({ ...proposalForm, proposed_timeline: e.target.value })} />
                </div>
                <div>
                  <label className="label">نامه پوششی</label>
                  <textarea className="input-field" rows={4} value={proposalForm.cover_letter} onChange={(e) => setProposalForm({ ...proposalForm, cover_letter: e.target.value })} />
                </div>
                <button type="submit" disabled={submittingProposal} className="btn-primary w-full">{submittingProposal ? 'در حال ارسال...' : 'ارسال پیشنهاد'}</button>
              </form>
            </div>
          )}

          {canViewProposals && (
            <div className="card">
              <h3 className="font-semibold mb-4">پیشنهادها</h3>
              <div className="space-y-3">
                {proposals.length === 0 && <div className="text-sm text-gray-500">پیشنهادی ثبت نشده است.</div>}
                {proposals.map(p => (
                  <div key={p.id} className="border border-gray-200 rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.executor?.full_name || `مجری #${p.executor_id}`}</div>
                        <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString('fa-IR')} • وضعیت: {p.status}</div>
                      </div>
                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <button className="btn-primary text-sm" onClick={() => handleProposalDecision(p.id, 'accepted')}>پذیرش</button>
                          <button className="btn-outline text-sm" onClick={() => handleProposalDecision(p.id, 'rejected')}>رد</button>
                        </div>
                      )}
                    </div>
                    {p.proposed_price && (
                      <div className="text-sm mt-2"><span className="text-gray-500 ml-1">مبلغ پیشنهادی:</span>{p.proposed_price.toLocaleString()} تومان</div>
                    )}
                    {p.proposed_timeline && (
                      <div className="text-sm"><span className="text-gray-500 ml-1">زمان‌بندی:</span>{p.proposed_timeline}</div>
                    )}
                    {p.cover_letter && (
                      <div className="text-sm mt-1 whitespace-pre-line"><span className="text-gray-500 ml-1">نامه:</span>{p.cover_letter}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
