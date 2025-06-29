import { useState, useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  rollbackMessage?: string;
}

export function useOptimisticUpdate<T, R = T>(
  updateFn: (data: T) => Promise<R>,
  options: OptimisticUpdateOptions<R> = {}
) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { showNotification } = useUIStore();

  const executeUpdate = useCallback(
    async (
      optimisticData: T,
      applyOptimistic: (data: T) => void,
      rollback: () => void
    ) => {
      // Apply optimistic update immediately
      applyOptimistic(optimisticData);
      setIsUpdating(true);

      try {
        // Execute the actual update
        const result = await updateFn(optimisticData);
        
        // Call success callback if provided
        options.onSuccess?.(result);
        
        return result;
      } catch (error) {
        // Rollback on error
        rollback();
        
        // Show error message
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: options.rollbackMessage || 'Changes have been reverted.',
        });
        
        // Call error callback if provided
        options.onError?.(error as Error);
        
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateFn, options, showNotification]
  );

  return {
    executeUpdate,
    isUpdating,
  };
}

// Helper hook for optimistic state updates
export function useOptimisticState<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const [previousValue, setPreviousValue] = useState(initialValue);

  const setOptimisticValue = useCallback((newValue: T) => {
    setPreviousValue(value);
    setValue(newValue);
  }, [value]);

  const rollback = useCallback(() => {
    setValue(previousValue);
  }, [previousValue]);

  const commit = useCallback((committedValue?: T) => {
    if (committedValue !== undefined) {
      setValue(committedValue);
    }
    setPreviousValue(value);
  }, [value]);

  return {
    value,
    setOptimisticValue,
    rollback,
    commit,
    setValue,
  };
} 