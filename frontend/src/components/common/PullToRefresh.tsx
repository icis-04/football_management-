import React from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const { containerRef, isPulling, pullDistance, isRefreshing, pullProgress } = usePullToRefresh({
    onRefresh
  });

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull indicator */}
      <div
        className={`absolute top-0 left-0 right-0 flex justify-center transition-all ${
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translateY(${isPulling ? pullDistance - 40 : isRefreshing ? 0 : -40}px)`,
          height: '40px'
        }}
      >
        <div className="flex items-center justify-center">
          <RefreshCw
            className={`h-6 w-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${pullProgress * 180}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.2s'
            }}
          />
        </div>
      </div>
      
      {/* Content */}
      <div
        style={{
          transform: `translateY(${isPulling ? pullDistance : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s'
        }}
      >
        {children}
      </div>
    </div>
  );
}; 