import { query } from '../database/connection';
import { callDoorDashForOrder } from './doordash';

/**
 * Process scheduled tasks (like DoorDash calls)
 * This should be called periodically (e.g., every minute via cron or setInterval)
 */
export async function processScheduledTasks(): Promise<void> {
  try {
    // Get all pending tasks that are due
    const tasksResult = await query(
      `SELECT * FROM scheduled_tasks 
       WHERE status = 'pending' 
       AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC
       LIMIT 10`,
      []
    );

    for (const task of tasksResult.rows) {
      try {
        // Mark task as processing
        await query(
          `UPDATE scheduled_tasks SET status = 'processing', started_at = NOW()
           WHERE id = $1`,
          [task.id]
        );

        // Process task based on type
        if (task.task_type === 'doordash_call') {
          await callDoorDashForOrder(task.order_id);
        } else {
          console.warn(`Unknown task type: ${task.task_type}`);
          await query(
            `UPDATE scheduled_tasks SET status = 'failed', error_message = $1
             WHERE id = $2`,
            ['Unknown task type', task.id]
          );
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        await query(
          `UPDATE scheduled_tasks SET status = 'failed', error_message = $1
           WHERE id = $2`,
          [error instanceof Error ? error.message : 'Unknown error', task.id]
        );
      }
    }
  } catch (error) {
    console.error('Error processing scheduled tasks:', error);
  }
}

/**
 * Start the task processor (runs every minute)
 */
export function startTaskProcessor(): void {
  // Process tasks immediately
  processScheduledTasks();

  // Then process every minute
  setInterval(() => {
    processScheduledTasks();
  }, 60 * 1000); // 1 minute

  console.log('Task processor started - will process scheduled tasks every minute');
}
