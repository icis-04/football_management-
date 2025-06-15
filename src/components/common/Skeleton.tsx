import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };
  
  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Skeleton group for loading multiple items
interface SkeletonGroupProps {
  count: number;
  className?: string;
  children: React.ReactNode;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count,
  className = '',
  children,
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{children}</div>
      ))}
    </div>
  );
}; 