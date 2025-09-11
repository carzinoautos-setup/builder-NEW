import React from "react";
import { ChevronDown } from "lucide-react";

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
  isCollapsed,
  onToggle,
}) => {
  return (
    <div className="border-b border-gray-200 pb-2 mb-2">
      <button
        type="button"
        className="w-full flex items-center justify-between cursor-pointer py-1.5 hover:bg-gray-50 px-1 -mx-1 rounded"
        onClick={onToggle}
      >
        <h3 className="carzino-filter-title">{title}</h3>
        <ChevronDown
          className={`w-4 h-4 lg:w-4 lg:h-4 md:w-5 md:h-5 text-red-600 transition-transform mobile-chevron ${
            !isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>
      {!isCollapsed && <div className="mt-2">{children}</div>}
    </div>
  );
};
