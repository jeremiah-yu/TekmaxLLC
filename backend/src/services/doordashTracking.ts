import { query } from '../database/connection';
import { createDoorDashHeaders } from './doordashAuth';
import { AppError } from '../middleware/errorHandler';

/**
 * Get DoorDash delivery status
 */
export async function getDoorDashDeliveryStatus(
  deliveryId: string,
  developerId: string,
  keyId: string,
  signingSecret: string,
  sandbox: boolean = true
): Promise<any> {
  try {
    const apiUrl = sandbox 
      ? `https://openapi-sandbox.doordash.com/drive/v2/deliveries/${deliveryId}`
      : `https://openapi.doordash.com/drive/v2/deliveries/${deliveryId}`;

    const headers = createDoorDashHeaders(
      developerId,
      keyId,
      signingSecret,
      'GET',
      `/drive/v2/deliveries/${deliveryId}`,
      ''
    );

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DoorDash API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting DoorDash delivery status:', error);
    throw new AppError('Failed to get DoorDash delivery status', 500);
  }
}

/**
 * Update delivery status from DoorDash webhook
 */
export async function updateDeliveryFromDoorDash(
  doordashDeliveryId: string,
  status: string,
  trackingUrl?: string,
  estimatedPickupTime?: Date,
  estimatedDeliveryTime?: Date
): Promise<void> {
  try {
    // Find delivery by DoorDash delivery ID
    const deliveryResult = await query(
      `SELECT d.* FROM deliveries d
       WHERE d.doordash_delivery_id = $1 OR d.doordash_external_id = $1`,
      [doordashDeliveryId]
    );

    if (deliveryResult.rows.length === 0) {
      console.warn(`Delivery not found for DoorDash ID: ${doordashDeliveryId}`);
      return;
    }

    const delivery = deliveryResult.rows[0];

    // Map DoorDash status to our status
    let ourStatus = delivery.status;
    if (status === 'queued' || status === 'pending') {
      ourStatus = 'pending';
    } else if (status === 'accepted' || status === 'assigned') {
      ourStatus = 'assigned';
    } else if (status === 'picked_up') {
      ourStatus = 'picked_up';
    } else if (status === 'in_transit' || status === 'out_for_delivery') {
      ourStatus = 'in_transit';
    } else if (status === 'delivered' || status === 'completed') {
      ourStatus = 'delivered';
    } else if (status === 'cancelled' || status === 'failed') {
      ourStatus = 'cancelled';
    }

    // Update delivery
    const updates: string[] = [`status = $1`];
    const params: any[] = [ourStatus];
    let paramCount = 2;

    if (status === 'picked_up') {
      updates.push(`picked_up_at = CURRENT_TIMESTAMP`);
    }
    if (status === 'in_transit' || status === 'out_for_delivery') {
      updates.push(`started_at = CURRENT_TIMESTAMP`);
    }
    if (status === 'delivered' || status === 'completed') {
      updates.push(`delivered_at = CURRENT_TIMESTAMP, actual_delivery_time = CURRENT_TIMESTAMP`);
    }
    if (estimatedPickupTime) {
      updates.push(`estimated_pickup_time = $${paramCount++}`);
      params.push(estimatedPickupTime);
    }
    if (estimatedDeliveryTime) {
      updates.push(`estimated_delivery_time = $${paramCount++}`);
      params.push(estimatedDeliveryTime);
    }

    params.push(delivery.id);
    await query(
      `UPDATE deliveries SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    // Update order status
    await query(
      `UPDATE orders SET status = $1 WHERE id = $2`,
      [ourStatus, delivery.order_id]
    );

    console.log(`Updated delivery ${delivery.id} from DoorDash status: ${status} -> ${ourStatus}`);
  } catch (error) {
    console.error('Error updating delivery from DoorDash:', error);
    throw error;
  }
}

/**
 * Poll DoorDash for delivery updates (called periodically)
 */
export async function pollDoorDashDeliveryStatus(
  deliveryId: string,
  restaurantId: string
): Promise<void> {
  try {
    // Get DoorDash credentials and delivery info
    const settingsResult = await query(
      `SELECT rs.doordash_developer_id, rs.doordash_key_id, rs.doordash_signing_secret, 
              rs.doordash_merchant_id, rs.doordash_sandbox, d.doordash_delivery_id
       FROM restaurant_settings rs
       JOIN deliveries d ON d.restaurant_id = rs.restaurant_id
       WHERE d.id = $1 AND rs.restaurant_id = $2`,
      [deliveryId, restaurantId]
    );

    if (settingsResult.rows.length === 0 || !settingsResult.rows[0].doordash_developer_id) {
      return;
    }

    const settings = settingsResult.rows[0];
    const doordashDeliveryId = settings.doordash_delivery_id;

    if (!doordashDeliveryId) {
      return;
    }

    // Get status from DoorDash
    const statusData = await getDoorDashDeliveryStatus(
      doordashDeliveryId,
      settings.doordash_developer_id,
      settings.doordash_key_id,
      settings.doordash_signing_secret,
      settings.doordash_sandbox || false
    );

    // Update delivery
    await updateDeliveryFromDoorDash(
      doordashDeliveryId,
      statusData.status,
      statusData.tracking_url,
      statusData.estimated_pickup_time ? new Date(statusData.estimated_pickup_time) : undefined,
      statusData.estimated_delivery_time ? new Date(statusData.estimated_delivery_time) : undefined
    );
  } catch (error) {
    console.error('Error polling DoorDash delivery status:', error);
  }
}
