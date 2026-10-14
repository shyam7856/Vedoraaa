import React from 'react';
import { X, Target, BarChart2, Cloud, Settings, HelpCircle, Info, ChevronRight } from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#FAF8F5] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border-t sm:border border-stone-200/80 z-10 max-h-[90vh] overflow-y-auto select-none">
        <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-4 sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3.5 mt-2">
          <div className="w-14 h-14 rounded-full bg-[#154D43] text-white flex items-center justify-center text-xl font-bold shadow-sm">
            S
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-lg leading-snug">Shyam</h3>
            <p className="text-stone-500 text-xs">Keep reading, keep growing.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-6 p-3 bg-[#F2EFE9] rounded-2xl text-center">
          <div>
            <span className="block text-lg font-bold text-stone-900 tabular-nums">12</span>
            <span className="text-[10px] text-stone-500 font-medium">Books</span>
          </div>
          <div className="border-x border-stone-300/60">
            <span className="block text-lg font-bold text-stone-900 tabular-nums">48 hrs</span>
            <span className="text-[10px] text-stone-500 font-medium">Reading time</span>
          </div>
          <div>
            <span className="block text-lg font-bold text-stone-900 tabular-nums">82</span>
            <span className="text-[10px] text-stone-500 font-medium">Highlights</span>
          </div>
        </div>

        <div className="mt-5 space-y-1">
          {[
            { label: 'Reading goals', icon: Target },
            { label: 'Reading insights', icon: BarChart2 },
            { label: 'Cloud backup', icon: Cloud, badge: 'Coming soon!' },
            { label: 'App settings', icon: Settings },
            { label: 'Help & feedback', icon: HelpCircle },
            { label: 'About VEDORA', icon: Info },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-200/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-stone-700" />
                  <span className="text-sm font-medium text-stone-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="text-[10px] font-semibold bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
