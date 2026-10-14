import React from 'react';
import { Home, Library, FileText, Users, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'library' as TabType,
      label: 'Library',
      icon: Library,
    },
    {
      id: 'notes' as TabType,
      label: 'Notes',
      icon: FileText,
    },
    {
      id: 'community' as TabType,
      label: 'Community',
      icon: Users,
    },
    {
      id: 'profile' as TabType,
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav className="w-full bg-[#FAF8F5]/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-2 flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
              isActive ? 'text-[#154D43]' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <div className="relative">
              <IconComponent
                className={`w-[22px] h-[22px] transition-transform ${
                  isActive ? 'stroke-[2.4] fill-[#154D43]/15 scale-105' : 'stroke-[1.8]'
                }`}
              />
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight transition-all ${
                isActive ? 'font-bold text-[#154D43]' : 'font-medium text-stone-500'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
