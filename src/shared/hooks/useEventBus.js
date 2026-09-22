import { useEffect, useRef } from 'react';
import { eventBus } from '../services/eventBus';

/**
 * Hook to subscribe to event bus events with automatic cleanup.
 * @param {string} event - Event name
 * @param {Function} callback - Event handler
 */
export function useEventBus(event, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data) => callbackRef.current(data);
    const unsubscribe = eventBus.subscribe(event, handler);
    return unsubscribe;
  }, [event]);
}

/**
 * Hook to publish events to the event bus.
 * @returns {Function} publish function
 */
export function useEventPublisher() {
  return eventBus.publish.bind(eventBus);
}
