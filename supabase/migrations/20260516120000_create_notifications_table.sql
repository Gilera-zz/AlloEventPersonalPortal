-- Create notifications table for the internal inbox system
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  message text not null,
  type text not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Users can read their own notifications
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Authenticated users can insert notifications (admin actions, system triggers)
create policy "Authenticated users can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

-- Index for fast lookup by user
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id) where is_read = false;
