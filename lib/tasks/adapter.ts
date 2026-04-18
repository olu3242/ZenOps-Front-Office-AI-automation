import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus, TaskStatusHistoryEntry } from './types'

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)
  return (data ?? []) as Task[]
}

/**
 * Concurrency-safe status update — matches the audit pattern exactly.
 * Throws 'CONCURRENCY_CONFLICT' if updated_at no longer matches.
 */
export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  updatedAt: string,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .eq('updated_at', updatedAt)
    .select()

  if (error) throw new Error(`Failed to update task status: ${error.message}`)
  if (!data || data.length === 0) throw new Error('CONCURRENCY_CONFLICT')

  return data[0] as Task
}

export async function updateTask(
  id: string,
  payload: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Task> {
  const { data, error } = await supabase.from('tasks').update(payload).eq('id', id).select().single()
  if (error) throw new Error(`Failed to update task: ${error.message}`)
  return data as Task
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete task: ${error.message}`)
}

export async function createTask(
  payload: Omit<Task, 'id' | 'created_at' | 'updated_at'>,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(`Failed to create task: ${error.message}`)
  return data as Task
}

export async function fetchTaskStatusHistory(
  taskId: string,
): Promise<TaskStatusHistoryEntry[]> {
  const { data, error } = await supabase
    .from('task_status_history')
    .select('*')
    .eq('task_id', taskId)
    .order('changed_at', { ascending: false })
  if (error) throw new Error(`Failed to fetch task history: ${error.message}`)
  return (data ?? []) as TaskStatusHistoryEntry[]
}
