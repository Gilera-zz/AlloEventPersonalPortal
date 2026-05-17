import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return useQuery<Notification[]>({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Notification Fetch Error:", error);
        toast.error(`Notification Fetch Error: ${error.message}`);
        throw error;
      }

      return (data ?? []) as Notification[];
    },
    enabled: !!user?.id,
  });
}

export function useUnreadCount() {
  const { data: notifications } = useNotifications();
  return (notifications ?? []).filter((n) => !n.is_read).length;
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .eq("id", notificationId);

      if (error) {
        console.error("Mark As Read Error:", error);
        toast.error(`Mark As Read Error: ${error.message}`);
        throw error;
      }
    },
    onMutate: async (notificationId) => {
      await qc.cancelQueries({ queryKey: ["notifications", user?.id] });
      const prev = qc.getQueryData<Notification[]>(["notifications", user?.id]);
      qc.setQueryData<Notification[]>(["notifications", user?.id], (old) =>
        (old ?? []).map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
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
