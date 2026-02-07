import React from 'react';
import { VisualStyle } from '../types';

interface StyleCardProps {
  styleOption: { value: VisualStyle; label: string; description: string };
  isSelected: boolean;
  onSelect: (style: VisualStyle) => void;
}

export const StyleCard: React.FC<StyleCardProps> = ({ styleOption, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(styleOption.value)}
      className={`cursor-pointer border rounded-lg p-4 transition-all duration-200 flex flex-col gap-2
        ${isSelected 
          ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
          : 'bg-gray-800 border-gray-700 hover:border-gray-500 hover:bg-gray-750'
        }`}
    >
      <div className="flex justify-between items-center">
        <span className="font-bold text-gray-100">{styleOption.label}</span>
        {isSelected && <div className="w-3 h-3 bg-amber-500 rounded-full"></div>}
      </div>
      <p className="text-xs text-gray-400">{styleOption.description}</p>
    </div>
  );
};