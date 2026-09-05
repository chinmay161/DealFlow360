import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 60_000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  return {
    ...query,
    notifications: query.data?.items ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
  };
}
