import { query } from '../database/connection';
import { pollDoorDashDeliveryStatus } from './doordashTracking';

/**
 * Poll all active DoorDash deliveries for status updates
 * This should be called periodically (e.g., every 30 seconds)
 */
export async function pollAllActiveDeliveries(): Promise<void> {
  try {
    // Get all active deliveries with DoorDash
    const deliveries = await query(
      `SELECT d.id, d.restaurant_id, d.doordash_delivery_id
       FROM deliveries d
       JOIN restaurant_settings rs ON d.restaurant_id = rs.restaurant_id
       WHERE d.status IN ('pending', 'assigned', 'picked_up', 'in_transit')
       AND d.doordash_delivery_id IS NOT NULL
       AND rs.is_doordash_connected = true
       AND rs.doordash_developer_id IS NOT NULL
       LIMIT 50`
    );

    // Poll each delivery
    for (const delivery of deliveries.rows) {
      try {
        await pollDoorDashDeliveryStatus(delivery.id, delivery.restaurant_id);
      } catch (error) {
        console.error(`Error polling delivery ${delivery.id}:`, error);
        // Continue with next delivery
      }
    }

    console.log(`Polled ${deliveries.rows.length} active DoorDash deliveries`);
  } catch (error) {
    console.error('Error polling active deliveries:', error);
  }
}

/**
 * Start periodic polling of DoorDash deliveries
 */
export function startDeliveryPolling(intervalSeconds: number = 30): NodeJS.Timeout {
  console.log(`Starting delivery polling every ${intervalSeconds} seconds`);
  
  // Poll immediately
  pollAllActiveDeliveries();
  
  // Then poll periodically
  return setInterval(() => {
    pollAllActiveDeliveries();
  }, intervalSeconds * 1000);
}
