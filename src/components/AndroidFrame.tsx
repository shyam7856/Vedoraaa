import React, { useState } from 'react';
import { Wifi, Battery, Signal, Smartphone, Maximize2 } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  currentTime?: string;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  currentTime = '9:41',
}) => {
  const [deviceMode, setDeviceMode] = useState<'phone' | 'fluid'>('phone');

  return (
    <div className="min-h-screen bg-[#E5E2DC] flex flex-col items-center justify-start sm:py-6 sm:px-4">
      {/* Top toolbar for desktop previewers */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-3 px-2 text-stone-600 text-xs select-none">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-[#154D43]" />
          <span>VEDORA Mobile Preview</span>
        </div>
        <div className="flex items-center bg-stone-300/60 p-0.5 rounded-lg border border-stone-300">
          <button
            type="button"
            onClick={() => setDeviceMode('phone')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all text-[11px] font-medium cursor-pointer ${
              deviceMode === 'phone'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Frame</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('fluid')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all text-[11px] font-medium cursor-pointer ${
              deviceMode === 'fluid'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Responsive</span>
          </button>
        </div>
      </div>

      {/* Main Container: Android Device Shell on desktop or clean edge-to-edge mobile app */}
      <div
        className={`w-full h-screen sm:h-[860px] transition-all duration-300 ${
          deviceMode === 'phone'
            ? 'sm:max-w-[412px] sm:rounded-[44px] sm:ring-[10px] sm:ring-stone-900 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)]'
            : 'sm:max-w-[500px] sm:rounded-3xl sm:shadow-xl'
        } bg-[#FAF8F5] relative flex flex-col overflow-hidden`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Android Punch Hole Camera (only on desktop phone simulation mode) */}
        {deviceMode === 'phone' && (
          <div className="hidden sm:block absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-40 pointer-events-none ring-1 ring-stone-800" />
        )}

        {/* Realistic Status Bar: ONLY shown on desktop phone preview mode */}
        {deviceMode === 'phone' && (
          <div className="hidden sm:flex w-full pt-2.5 pb-1 px-6 items-center justify-between text-stone-800 text-[13px] font-semibold tracking-tight select-none z-30 shrink-0">
            <span className="font-sans tabular-nums pl-0.5">{currentTime}</span>
            <div className="flex items-center gap-2">
              <Signal className="w-3.5 h-3.5 stroke-[2.2]" />
              <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold">84%</span>
                <Battery className="w-4 h-4 stroke-[2.2] fill-stone-800" />
              </div>
            </div>
          </div>
        )}

        {/* Screen Area: Non-scrolling flex container where children manage their scrollable bodies and fixed nav */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {children}
        </div>

        {/* Android Navigation Bar Pill Indicator: ONLY shown on desktop phone preview */}
        {deviceMode === 'phone' && (
          <div className="hidden sm:flex w-full pb-1 pt-0.5 justify-center bg-[#FAF8F5] shrink-0 select-none">
            <div className="w-32 h-1 bg-stone-300 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
