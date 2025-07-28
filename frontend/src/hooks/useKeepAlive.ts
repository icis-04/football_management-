import { useEffect, useRef } from 'react';

/**
 * Custom hook to keep the backend alive by pinging it periodically
 * This prevents Render free tier from spinning down after 15 minutes
 */
export const useKeepAlive = () => {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const pingBackend = async () => {
      try {
        // Use a lightweight endpoint that doesn't require authentication
        // Note: The health endpoint is at the root, not under /api/v1
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://football-management.onrender.com';
        await fetch(`${baseUrl}/health`);
        console.log('Keep-alive ping sent successfully');
      } catch {
        // Silently fail - the backend might be starting up
        console.log('Keep-alive ping failed (backend might be starting up)');
      }
    };

    // Initial ping
    pingBackend();

    // Set up interval for every 10 minutes (600,000 ms)
    intervalRef.current = setInterval(pingBackend, 10 * 60 * 1000);

    // Also ping when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pingBackend();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}; 