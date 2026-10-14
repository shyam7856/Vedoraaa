import React from 'react';
import { X, Bell, Check, Clock, Sparkles } from 'lucide-react';

interface NotificationsModalProps {
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const notifications = [
    {
      id: 1,
      title: 'Daily Reading Goal Met!',
      desc: 'You completed 45 minutes of reading today in The Psychology of Money.',
      time: '1 hour ago',
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      id: 2,
      title: 'Highlights Synced',
      desc: '82 highlights and 18 personal notes backed up successfully.',
      time: '3 hours ago',
      icon: Check,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: 3,
      title: 'Reading Reminder',
      desc: 'Pick up where you left off on Page 132 of The Psychology of Money.',
      time: 'Yesterday',
      icon: Clock,
      color: 'text-teal-600 bg-teal-50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#FAF8F5] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border-t sm:border border-stone-200/80 z-10 max-h-[85vh] overflow-y-auto select-none">
        <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#154D43]" />
            <h3 className="font-bold text-stone-900 text-base">Notifications</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className="p-3.5 bg-[#F2EFE9] rounded-2xl flex items-start gap-3 hover:bg-stone-200/60 transition-colors"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-stone-900">{n.title}</h4>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">{n.desc}</p>
                  <span className="text-[10px] text-stone-400 mt-1 block">{n.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
