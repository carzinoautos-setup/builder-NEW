import React from 'react';
import { Heart } from 'lucide-react';

type Props = {
  count: number;
  active: boolean; // viewing favorites
  hasAny: boolean; // any favorites saved
  onToggle: () => void;
  className?: string;
};

export default function FavoriteToggle({ count, active, hasAny, onToggle, className }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${className || ''}`}
      aria-pressed={active}
    >
      <span className="relative inline-block">
        <span className="pointer-events-none">Favorites</span>
        {hasAny && (
          <span className="md:hidden absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </span>

      <div className="relative">
        <div className={`w-12 h-6 rounded-full ${active ? 'bg-red-600' : 'bg-gray-300'} transition-colors`}>
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
              active ? 'translate-x-6' : 'translate-x-0.5'
            } ${active ? 'bg-white' : hasAny ? 'bg-red-600 md:bg-white' : 'bg-white'}`}
          />
        </div>
      </div>

      {/* Heart icon for larger screens */}
      <div className="hidden md:flex relative items-center">
        <Heart className={`${hasAny ? 'text-red-600 fill-red-600' : 'text-red-600' } w-5 h-5`} />
        {hasAny && (
          <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </div>
    </button>
  );
}
