import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

/**
 * Shared hook for the inbox unread-message count.
 * Uses the same query key ['unreadCount'] that the tab bar uses so all
 * consumers share a single cached result with no duplicate network fetches.
 */
export function useUnreadCount(): number {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery<number>({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      try {
        const res = await api.get('/messages/threads');
        const threads = Array.isArray(res.data?.data) ? res.data.data : [];
        return threads.reduce(
          (sum: number, t: Record<string, unknown>) =>
            sum + ((t.unread_count as number) ?? 0),
          0,
        );
      } catch {
        return 0;
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 20000,
  });
  return data ?? 0;
}
