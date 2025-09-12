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
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span className={`pointer-events-none text-sm ${active ? 'text-black' : 'text-black'}`}>
        {active ? 'View Autos' : 'Favorites'}
      </span>

      <button
        onClick={onToggle}
        aria-pressed={active}
        className={`relative w-9 h-9 rounded-md flex items-center justify-center border ${active ? 'border-red-600' : 'border-gray-300'} bg-white`}
      >
        <Heart className={`${active || hasAny ? 'text-red-600 fill-red-600' : 'text-gray-500'} w-4 h-4`} />

        {hasAny && (
          <span className={`absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${active ? 'bg-red-600' : 'bg-black'}`}>
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
