import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Star, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentToolName?: string | null;
}

const CATEGORIES = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'Improvement Suggestion',
] as const;

type FeedbackCategory = typeof CATEGORIES[number];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentToolName,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>('General Feedback');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen && status === 'success') {
      setName('');
      setEmail('');
      setRating(5);
      setCategory('General Feedback');
      setMessage('');
      setStatus('idle');
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && status !== 'loading') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, status, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validation
    if (!message.trim() || message.trim().length < 3) {
      setErrorMsg('Please enter a feedback message (at least 3 characters).');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address or leave it blank.');
      return;
    }

    setStatus('loading');

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const templateParams = {
      to_email: 'resumeforgecoai@gmail.com',
      rating: `${rating} / 5 Stars`,
      category: category,
      name: name.trim() || 'Anonymous User',
      email: email.trim() || 'Not Provided',
      message: message.trim(),
      page_url: window.location.href,
      browser_info: navigator.userAgent,
      date_time: new Date().toLocaleString(),
      tool_context: currentToolName || 'Homepage',
    };

    try {
      if (serviceId && templateId && publicKey) {
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
      } else {
        // Fallback for developers or testers testing before environment variables are plugged in
        console.log('--- EmailJS Configuration Notice ---');
        console.log('VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, or VITE_EMAILJS_PUBLIC_KEY not detected.');
        console.log('Simulating delivery to resumeforgecoai@gmail.com with payload:', templateParams);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      setStatus('success');

      // Automatically close modal after displaying success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('EmailJS Error:', err);
      setStatus('error');
      setErrorMsg('Failed to send feedback. Please check your internet connection or try again later.');
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={status !== 'loading' ? onClose : undefined}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        onClick={handleModalClick}
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col justify-between overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Send Feedback
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Help us improve ToolKit directly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={status === 'loading'}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Views */}
        {status === 'success' ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Thank You!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm max-w-sm leading-relaxed mb-6">
              Your feedback has been sent directly to our team at <span className="font-semibold text-gray-900 dark:text-white">resumeforgecoai@gmail.com</span>.
            </p>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Closing window in a moment...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Display */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Rating (1-5 stars) */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Overall Experience Rating
              </label>
              <div className="flex items-center gap-1 sm:gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      disabled={status === 'loading'}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-transform active:scale-95 group"
                      aria-label={`Rate ${star} out of 5 stars`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors duration-150 ${
                          isActive
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-gray-300 dark:text-gray-700 group-hover:text-gray-400'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="ml-2 text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                  {hoverRating || rating} / 5
                </span>
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Feedback Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      disabled={status === 'loading'}
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all text-left truncate flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-500 shadow-xs'
                          : 'bg-gray-50/70 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span>{cat}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message (Required) */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Feedback Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={status === 'loading'}
                placeholder="Tell us what you think, report a bug, or suggest a new improvement..."
                rows={4}
                required
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Name and Email (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={status === 'loading'}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  placeholder="you@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={status === 'loading'}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-semibold transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
