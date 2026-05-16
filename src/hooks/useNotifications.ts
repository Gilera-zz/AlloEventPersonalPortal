import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface Notification {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery<Notification[]>({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    enabled: !!user,
  });
}

export function useUnreadCount() {
  const { data: notifications } = useNotifications();
  return (notifications ?? []).filter((n) => !n.read).length;
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true } as any)
        .eq("id", notificationId);
      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      await qc.cancelQueries({ queryKey: ["notifications", user?.id] });
      const prev = qc.getQueryData<Notification[]>(["notifications", user?.id]);
      qc.setQueryData<Notification[]>(["notifications", user?.id], (old) =>
        (old ?? []).map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        qc.setQueryData(["notifications", user?.id], context.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}
