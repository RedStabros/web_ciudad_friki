import { useState, useEffect } from 'react';
import { EventService } from '../services/EventService';
import type { FrikiEvent } from '../services/EventService';

export type EventFeedType = 'upcoming' | 'past' | 'interests';

export function useEvents(userId?: string, filterType: EventFeedType = 'upcoming', userInterests: string[] = []) {
    const [events, setEvents] = useState<FrikiEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const result = await EventService.getFeedEvents(userId, 0, 20, filterType, userInterests);
            if (result.error) throw result.error;
            setEvents(result.events);
        } catch (err: any) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [userId, filterType, userInterests.length]);

    return { events, isLoading, error, refetch: fetchEvents };
}
