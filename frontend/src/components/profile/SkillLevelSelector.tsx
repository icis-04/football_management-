import React from 'react';
import { Star } from 'lucide-react';

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

interface SkillLevelSelectorProps {
  value?: SkillLevel;
  onChange: (level: SkillLevel) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const skillDescriptions: Record<SkillLevel, string> = {
  1: 'Beginner - Just starting out',
  2: 'Novice - Some experience',
  3: 'Intermediate - Regular player',
  4: 'Advanced - Very experienced',
  5: 'Expert - Professional level'
};

export const SkillLevelSelector: React.FC<SkillLevelSelectorProps> = ({
  value = 3,
  onChange,
  readonly = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const handleClick = (level: SkillLevel) => {
    if (!readonly) {
      onChange(level);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => handleClick(level as SkillLevel)}
            disabled={readonly}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            aria-label={`Skill level ${level}`}
          >
            <Star
              className={`${sizeClasses[size]} transition-colors ${
                level <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-300 dark:fill-gray-700 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
      {!readonly && value && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {skillDescriptions[value]}
        </p>
      )}
    </div>
  );
}; 