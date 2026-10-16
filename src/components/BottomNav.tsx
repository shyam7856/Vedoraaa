import React from 'react';
import { Home, Library, FileText, Users, User } from 'lucide-react';
import { TabType } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { theme, isDark } = useTheme();

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

  const activeColor = isDark ? theme.mutedAccent : theme.brandPrimary;
  const inactiveColor = isDark ? '#7E7A72' : '#8A857A';

  return (
    <nav
      className="w-full backdrop-blur-md border-t px-2 py-2 flex items-center justify-around select-none transition-colors duration-200"
      style={{
        backgroundColor: theme.navBg,
        borderColor: theme.navBorder,
      }}
    >
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl transition-all duration-150 active:scale-90 cursor-pointer"
            style={{
              color: isActive ? activeColor : inactiveColor,
            }}
          >
            <div className="relative">
              <IconComponent
                className="w-[22px] h-[22px] transition-transform"
                style={{
                  strokeWidth: isActive ? 2.4 : 1.8,
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  fill: isActive
                    ? isDark
                      ? `${theme.secondary}40`
                      : `${theme.brandPrimary}20`
                    : 'none',
                }}
              />
            </div>
            <span
              className="text-[11px] mt-1 tracking-tight transition-all"
              style={{
                fontWeight: isActive ? 700 : 500,
                color: isActive ? activeColor : inactiveColor,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
