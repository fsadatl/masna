'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from '@/lib/api';
import toast from 'react-hot-toast';

type Props = {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

export default function ProposalModal({ projectId, isOpen, onClose, onSubmitted }: Props) {
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [reason, setReason] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setProposedPrice('');
    setProposedTimeline('');
    setReason('');
    setExperience('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const coverSections: string[] = [];
      if (reason.trim()) coverSections.push(`Ø¯Ù„ÛŒÙ„ Ø¹Ù„Ø§Ù‚Ù‡â€ŒÙ…Ù†Ø¯ÛŒ:\n${reason.trim()}`);
      if (experience.trim()) coverSections.push(`ØªØ¬Ø±Ø¨Ù‡ Ùˆ Ù†Ù…ÙˆÙ†Ù‡â€ŒÚ©Ø§Ø± Ù…Ø±ØªØ¨Ø·:\n${experience.trim()}`);
      const cover_letter = coverSections.join('\n\n');

      const payload: any = {
        project_id: projectId,
        cover_letter: cover_letter || undefined,
      };
      if (proposedPrice) payload.proposed_price = Number(proposedPrice);
      if (proposedTimeline) payload.proposed_timeline = proposedTimeline;

      await axios.post('/proposals', payload);
      toast.success('پیشنهاد شما با موفقیت ارسال شد');
      reset();
      onClose();
      onSubmitted?.();
    } catch (err: any) {
      const detail = err?.response?.data?.detail; let message = 'ارسال پیشنهاد ناموفق بود'; if (typeof detail === 'string') { if (detail.toLowerCase().includes('already') && detail.toLowerCase().includes('proposal')) { message = 'شما قبلاً برای این پروژه پیشنهاد ارسال کرده‌اید'; } else { message = detail; } } toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => !loading && onClose()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-right align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-bold text-gray-900 mb-1">Ø§Ø±Ø³Ø§Ù„ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ù‡Ù…Ú©Ø§Ø±ÛŒ</Dialog.Title>
                <p className="text-sm text-gray-600 mb-4">Ù„Ø·ÙØ§Ù‹ Ø¬Ø²Ø¦ÛŒØ§Øª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ Ø®ÙˆØ¯ Ø±Ø§ Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ† Ù¾Ø±ÙˆÚ˜Ù‡ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ù‚ÛŒÙ…ØªÛŒ (Ø§Ø®ØªÛŒØ§Ø±ÛŒ)</label>
                      <input type="number" className="input-field" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Ø²Ù…Ø§Ù†â€ŒØ¨Ù†Ø¯ÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ (Ø§Ø®ØªÛŒØ§Ø±ÛŒ)</label>
                      <input className="input-field" placeholder="Ù…Ø«Ù„Ø§Ù‹ Û³Û° Ø±ÙˆØ²" value={proposedTimeline} onChange={(e) => setProposedTimeline(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="label">Ú†Ø±Ø§ Ù…Ø§ÛŒÙ„ Ø¨Ù‡ Ø§Ù†Ø¬Ø§Ù… Ø§ÛŒÙ† Ù¾Ø±ÙˆÚ˜Ù‡ Ù‡Ø³ØªÛŒØ¯ØŸ</label>
                    <textarea className="input-field" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>

                  <div>
                    <label className="label">ØªØ¬Ø±Ø¨Ù‡â€ŒÙ‡Ø§ Ùˆ Ù†Ù…ÙˆÙ†Ù‡â€ŒÚ©Ø§Ø±Ù‡Ø§ÛŒ Ù…Ø±ØªØ¨Ø·</label>
                    <textarea className="input-field" rows={4} value={experience} onChange={(e) => setExperience(e.target.value)} />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" disabled={loading} onClick={onClose} className="btn-outline flex-1">Ø§Ù†ØµØ±Ø§Ù</button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Ø¯Ø± Ø­Ø§Ù„ Ø§Ø±Ø³Ø§Ù„...' : 'Ø§Ø±Ø³Ø§Ù„ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯'}</button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

