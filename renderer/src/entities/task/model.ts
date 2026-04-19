export type Priority = 0 | 1 | 2 | 3;
export type Recurrence = 'daily' | 'weekly' | 'monthly' | null;

export interface Task {
  id: number;
  title: string;
  description: string;
  is_done: boolean;
  created_at: string;
  completed_at: string | null;
  updated_at: string | null;
  priority: Priority;
  category_id: number | null;
  remind_at: string | null;
  remind_shown: boolean;
  deadline_at: string | null;
  deadline_notified: number;
  is_pinned: boolean;
  recurrence: Recurrence;
  tags: string;
  sort_order: number;
  is_archived: boolean;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_done: boolean;
  sort_order: number;
}
