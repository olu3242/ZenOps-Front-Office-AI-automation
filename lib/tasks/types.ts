export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'

export interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  assigned_to: string | null
  related_audit_id: string | null
  status: TaskStatus
  created_at: string
  updated_at: string
}

export interface TaskStatusHistoryEntry {
  id: string
  task_id: string
  old_status: TaskStatus | null
  new_status: TaskStatus
  changed_by: string | null
  changed_at: string
}
