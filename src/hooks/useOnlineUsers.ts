import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from './useProfile';

export function useOnlineUsers() {
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);
    const [onlineUsersCount, setOnlineUsersCount] = useState<number>(1);
    const [onlineUsersList, setOnlineUsersList] = useState<any[]>([]);
    const [totalInteractions, setTotalInteractions] = useState<number>(0);
    const [tavernInteractions, setTavernInteractions] = useState<number>(0);

    useEffect(() => {
        const fetchInteractions = async () => {
            try {
                const [users, events, duels, threads, replies] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('events').select('*', { count: 'exact', head: true }),
                    supabase.from('trivia_duels').select('*', { count: 'exact', head: true }),
                    supabase.from('tavern_threads').select('*', { count: 'exact', head: true }),
                    supabase.from('tavern_replies').select('*', { count: 'exact', head: true }),
                ]);

                const sum = (users.count || 0) + (events.count || 0) + (duels.count || 0) + (threads.count || 0);
                const tSum = (threads.count || 0) + (replies.count || 0);

                setTotalInteractions(sum > 0 ? sum : 0);
                setTavernInteractions(tSum > 0 ? tSum : 0);
            } catch (error) {
                console.error('Error fetching interactions:', error);
            }
        };

        fetchInteractions();
    }, []);

    useEffect(() => {
        // If no user/profile, just listen passively or don't join. But we can still track presence.
        // Actually, you can only track if you have a valid user id.
        const userId = user?.id || 'anonymous_' + Math.random().toString(36).substr(2, 9);
        const username = profile?.username || 'Guest';
        const avatarUrl = profile?.avatar_url || null;

        const presenceChannel = supabase.channel('online_users', {
            config: { presence: { key: userId } },
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                setOnlineUsersCount(Object.keys(state).length);

                const list: any[] = [];
                Object.keys(state).forEach(key => {
                    const presences = state[key] as any[];
                    if (presences && presences.length > 0) {
                        list.push({
                            id: key,
                            ...presences[0]
                        });
                    }
                });
                setOnlineUsersList(list);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && user) {
                    await presenceChannel.track({
                        online_at: new Date().toISOString(),
                        username: username,
                        avatar_url: avatarUrl,
                    });
                }
            });

        return () => {
            supabase.removeChannel(presenceChannel);
        };
    }, [user, profile]);

    return { onlineUsersCount, onlineUsersList, totalInteractions, tavernInteractions };
}
