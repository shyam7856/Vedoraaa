import React from 'react';
import { X, Bell, Check, Clock, Sparkles } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';

interface NotificationsModalProps {
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const { theme, isDark } = useTheme();

  const notifications = [
    {
      id: 1,
      title: 'Daily Reading Goal Met!',
      desc: 'You completed your daily reading target in your active PDF library.',
      time: '1 hour ago',
      icon: Sparkles,
      iconColor: '#F59E0B',
      bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
    },
    {
      id: 2,
      title: 'Highlights & Notes Saved',
      desc: 'Your annotations, bookmarks, and quotes are securely stored in your local reader.',
      time: '3 hours ago',
      icon: Check,
      iconColor: '#10B981',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
    },
    {
      id: 3,
      title: 'Reading Reminder',
      desc: 'Continue reading your open documents where you last left off.',
      time: 'Yesterday',
      icon: Clock,
      iconColor: isDark ? theme.mutedAccent : theme.brandPrimary,
      bgColor: isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border-t sm:border z-10 max-h-[85vh] overflow-y-auto select-none"
        style={{
          backgroundColor: theme.bg,
          color: theme.textPrimary,
          borderColor: theme.cardBorder,
        }}
      >
        <div
          className="w-12 h-1 rounded-full mx-auto mb-4 sm:hidden"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }}
        />
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
            <h3 className="font-bold text-base" style={{ color: theme.textPrimary }}>Notifications</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: theme.textPrimary,
            }}
            aria-label="Close"
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
                className="p-3.5 rounded-2xl flex items-start gap-3 transition-colors border"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: n.bgColor,
                    color: n.iconColor,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{n.title}</h4>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: theme.textSecondary }}>{n.desc}</p>
                  <span className="text-[10px] mt-1 block" style={{ color: theme.textMuted }}>{n.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
