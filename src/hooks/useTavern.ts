import { useState, useEffect, useCallback } from 'react';
import { TavernService } from '../services/TavernService';
import type { TavernThread, ThreadCategory } from '../types/tavern';

export function useTavernThreads(category: ThreadCategory = 'Todas', sortBy: 'HOT' | 'NEW' = 'NEW') {
    const [threads, setThreads] = useState<TavernThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const fetchThreads = useCallback(async (isInitial = false) => {
        if (isInitial) {
            setIsLoading(true);
            setPage(0);
        }

        const currentPage = isInitial ? 0 : page;

        try {
            const { threads: fetchedThreads, nextPage, error: fetchError } =
                await TavernService.getThreads(category, sortBy, currentPage);

            if (fetchError) throw fetchError;

            if (isInitial) {
                setThreads(fetchedThreads);
            } else {
                setThreads(prev => [...prev, ...fetchedThreads]);
            }

            setHasMore(nextPage !== null);
            if (nextPage !== null) setPage(nextPage);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [category, sortBy, page]);

    useEffect(() => {
        fetchThreads(true);
    }, [category, sortBy]);

    const loadMore = () => {
        if (!isLoading && hasMore) {
            fetchThreads(false);
        }
    };

    return {
        threads,
        isLoading,
        error,
        hasMore,
        loadMore,
        refetch: () => fetchThreads(true)
    };
}
