'use client';\nimport { fa } from '@/locales/fa';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Idea {
  id: number;
  title: string;
  description: string;
  tags?: string[];
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

export default function IdeasPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    creator_id: '',
    search: '',
  });

  useEffect(() => {
    // If opened with ?my=true, show only current user's ideas
    const my = searchParams?.get('my');
    if (my === 'true' && user?.id) {
      setFilters((prev) => ({ ...prev, creator_id: String(user.id) }));
    }
  }, [searchParams, user]);

  useEffect(() => {
    const my = searchParams?.get('my');
    if (my === 'true' && user?.id && filters.creator_id !== String(user.id)) {
      // Wait until creator_id filter is applied to avoid fetching all ideas briefly
      return;
    }
    fetchIdeas();
  }, [filters, searchParams, user]);

  const fetchIdeas = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.creator_id) params.append('creator_id', filters.creator_id);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/ideas?${params.toString()}`);
      setIdeas(response.data);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'Ø¯Ø± Ø­Ø§Ù„ Ø¨Ø±Ø±Ø³ÛŒ';
      case 'in_project':
        return 'Ø¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡';
      case 'rejected':
        return 'Ø±Ø¯ Ø´Ø¯Ù‡';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_project':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApplyToIdea = async (ideaId: number) => {
    if (!user || user.role !== 'executor') {
      alert('ÙÙ‚Ø· Ù…Ø¬Ø±ÛŒØ§Ù† Ù…ÛŒâ€ŒØªÙˆØ§Ù†Ù†Ø¯ Ø¨Ø±Ø§ÛŒ Ø§ÛŒØ¯Ù‡â€ŒÙ‡Ø§ Ø¯Ø±Ø®ÙˆØ§Ø³Øª Ø§Ø±Ø³Ø§Ù„ Ú©Ù†Ù†Ø¯');
      return;
    }

    try {
      // This would create a proposal or interest in the idea
      alert('Ø¯Ø±Ø®ÙˆØ§Ø³Øª Ø´Ù…Ø§ Ø§Ø±Ø³Ø§Ù„ Ø´Ø¯!');
    } catch (error) {
      console.error('Error applying to idea:', error);
      alert('Ø®Ø·Ø§ Ø¯Ø± Ø§Ø±Ø³Ø§Ù„ Ø¯Ø±Ø®ÙˆØ§Ø³Øª');
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
        <h1 className="text-3xl font-bold text-gray-900">Ø§ÛŒØ¯Ù‡â€ŒÙ‡Ø§</h1>
        {user?.role === 'idea_creator' && (
          <Link href="/ideas/create" className="btn-primary">
            Ø§ÛŒØ¬Ø§Ø¯ Ø§ÛŒØ¯Ù‡ Ø¬Ø¯ÛŒØ¯
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">ÙÛŒÙ„ØªØ±Ù‡Ø§</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">ÙˆØ¶Ø¹ÛŒØª</label>
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Ù‡Ù…Ù‡</option>
              <option value="under_review">Ø¯Ø± Ø­Ø§Ù„ Ø¨Ø±Ø±Ø³ÛŒ</option>
              <option value="in_project">Ø¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡</option>
              <option value="rejected">Ø±Ø¯ Ø´Ø¯Ù‡</option>
            </select>
          </div>
          
          <div>
            <label className="label">Ø§ÛŒØ¯Ù‡â€ŒØ¯Ù‡Ù†Ø¯Ù‡</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ø¬Ø³ØªØ¬Ùˆ Ø¨Ø± Ø§Ø³Ø§Ø³ Ù†Ø§Ù…..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', creator_id: '', search: '' })}
              className="btn-outline w-full"
            >
              Ù¾Ø§Ú© Ú©Ø±Ø¯Ù† ÙÛŒÙ„ØªØ±Ù‡Ø§
            </button>
          </div>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea) => (
          <div key={idea.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {idea.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(idea.status)}`}>
                {getStatusText(idea.status)}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {idea.description}
            </p>
            
            {idea.tags && idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {idea.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                  <span className="text-sm font-medium text-gray-600">
                    {idea.creator?.full_name?.charAt(0) || '?'}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {idea.creator?.full_name || 'Ù†Ø§Ù…Ø´Ø®Øµ'}
                </span>
              </div>
              
              <div className="text-xs text-gray-500">
                {new Date(idea.created_at).toLocaleDateString('fa-IR')}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Link
                  href={`/ideas/${idea.id}`}
                  className="btn-outline flex-1 text-center text-sm"
                >
                  Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ø¬Ø²Ø¦ÛŒØ§Øª
                </Link>
                
                {user?.role === 'executor' && idea.status === 'under_review' && (
                  <button
                    onClick={() => handleApplyToIdea(idea.id)}
                    className="btn-primary text-sm"
                  >
                    Ù…Ù† ØªÙˆØ§Ù†Ø§ÛŒÛŒ Ø§Ø¬Ø±Ø§ÛŒ Ø§ÛŒÙ† Ø§ÛŒØ¯Ù‡ Ø±Ø§ Ø¯Ø§Ø±Ù…
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {ideas.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">ðŸ’¡</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ù‡ÛŒÚ† Ø§ÛŒØ¯Ù‡â€ŒØ§ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯
          </h3>
          <p className="text-gray-600 mb-4">
            {filters.status || filters.search
              ? 'Ø¨Ø§ ÙÛŒÙ„ØªØ±Ù‡Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ÛŒ Ù‡ÛŒÚ† Ø§ÛŒØ¯Ù‡â€ŒØ§ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯'
              : 'Ù‡Ù†ÙˆØ² Ù‡ÛŒÚ† Ø§ÛŒØ¯Ù‡â€ŒØ§ÛŒ Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª'}
          </p>
          {user?.role === 'idea_creator' && (
            <Link href="/ideas/create" className="btn-primary">
              Ø§ÙˆÙ„ÛŒÙ† Ø§ÛŒØ¯Ù‡ Ø±Ø§ Ø§ÛŒØ¬Ø§Ø¯ Ú©Ù†ÛŒØ¯
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

