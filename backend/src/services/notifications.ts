import { query } from '../database/connection';

export interface CreateNotificationParams {
  userId?: string;
  restaurantId?: string;
  type: 'order' | 'delivery' | 'system';
  title: string;
  message: string;
  metadata?: any;
}

/**
 * Create a notification for a user or restaurant
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await query(
      `INSERT INTO notifications (user_id, restaurant_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.userId || null,
        params.restaurantId || null,
        params.type,
        params.title,
        params.message,
        params.metadata ? JSON.stringify(params.metadata) : null
      ]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notifications are not critical
  }
}

/**
 * Create notification for new order
 */
export async function notifyNewOrder(order: any, restaurantId: string): Promise<void> {
  await createNotification({
    restaurantId,
    type: 'order',
    title: 'New Order Received',
    message: `Order #${order.order_number || order.id.substring(0, 8)} has been received from ${order.customer_name || 'Customer'}`,
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name
    }
  });
}

/**
 * Create notification for order status change
 */
export async function notifyOrderStatusChange(
  order: any,
  oldStatus: string,
  newStatus: string,
  restaurantId: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    confirmed: 'has been confirmed',
    preparing: 'is being prepared',
    ready: 'is ready for pickup',
    assigned: 'has been assigned to a rider',
    picked_up: 'has been picked up',
    in_transit: 'is in transit',
    delivered: 'has been delivered',
    cancelled: 'has been cancelled'
  };

  const message = statusMessages[newStatus] || `status changed to ${newStatus}`;
  
  await createNotification({
    restaurantId,
    type: 'order',
    title: 'Order Status Updated',
    message: `Order #${order.order_number || order.id.substring(0, 8)} ${message}`,
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
      old_status: oldStatus,
      new_status: newStatus
    }
  });
}

/**
 * Create notification for delivery status change
 */
export async function notifyDeliveryStatusChange(
  delivery: any,
  oldStatus: string,
  newStatus: string,
  restaurantId: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    assigned: 'has been assigned to a rider',
    picked_up: 'has been picked up',
    in_transit: 'is in transit',
    delivered: 'has been delivered',
    cancelled: 'has been cancelled'
  };

  const message = statusMessages[newStatus] || `status changed to ${newStatus}`;
  
  await createNotification({
    restaurantId,
    type: 'delivery',
    title: 'Delivery Status Updated',
    message: `Delivery ${message}`,
    metadata: {
      delivery_id: delivery.id,
      order_id: delivery.order_id,
      old_status: oldStatus,
      new_status: newStatus
    }
  });
}
