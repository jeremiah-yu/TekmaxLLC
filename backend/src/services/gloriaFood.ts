import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

export interface GloriaFoodOrder {
  order_id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    special_instructions?: string;
  }>;
  subtotal: number;
  tax?: number;
  delivery_fee?: number;
  tip?: number;
  total_amount: number;
  estimated_prep_time?: number;
  order_time: string;
}

/**
 * Process order from Gloria Food webhook
 */
export async function processGloriaFoodOrder(
  gloriaOrder: any,
  restaurantId: string
): Promise<any> {
  try {
    // Handle different Gloria Food webhook formats
    // Format 1: Direct order object
    // Format 2: Nested in order property
    // Format 3: Standard webhook format
    const orderPayload = gloriaOrder.order || gloriaOrder.data || gloriaOrder;
    
    // Map Gloria Food order format to our order format
    const orderData: GloriaFoodOrder = {
      order_id: orderPayload.order_id || orderPayload.id || orderPayload.orderNumber || String(Date.now()),
      restaurant_id: restaurantId,
      customer_name: orderPayload.customer?.name || orderPayload.customer_name || orderPayload.customerName || 'Customer',
      customer_phone: orderPayload.customer?.phone || orderPayload.customer_phone || orderPayload.customerPhone || '',
      customer_email: orderPayload.customer?.email || orderPayload.customer_email || orderPayload.customerEmail,
      delivery_address: {
        line1: orderPayload.delivery_address?.address || orderPayload.delivery_address?.address_line1 || 
               orderPayload.delivery_address_line1 || orderPayload.deliveryAddress?.line1 || 
               orderPayload.address || 'Address not provided',
        line2: orderPayload.delivery_address?.address2 || orderPayload.delivery_address?.address_line2 || 
               orderPayload.delivery_address_line2 || orderPayload.deliveryAddress?.line2,
        city: orderPayload.delivery_address?.city || orderPayload.delivery_city || 
              orderPayload.deliveryAddress?.city || orderPayload.city || '',
        state: orderPayload.delivery_address?.state || orderPayload.delivery_state || 
               orderPayload.deliveryAddress?.state || orderPayload.state,
        postal_code: orderPayload.delivery_address?.zip || orderPayload.delivery_address?.postal_code || 
                     orderPayload.delivery_postal_code || orderPayload.deliveryAddress?.postalCode || 
                     orderPayload.zip || orderPayload.postalCode,
        country: orderPayload.delivery_address?.country || orderPayload.delivery_country || 
                 orderPayload.deliveryAddress?.country || orderPayload.country || 'US',
      },
      items: (orderPayload.items || orderPayload.orderItems || []).map((item: any) => ({
        name: item.name || item.title || item.item_name || 'Item',
        quantity: item.quantity || item.qty || 1,
        unit_price: item.price || item.unit_price || item.unitPrice || 0,
        subtotal: (item.price || item.unit_price || item.unitPrice || 0) * (item.quantity || item.qty || 1),
        special_instructions: item.notes || item.special_instructions || item.instructions || item.comments,
      })),
      subtotal: orderPayload.subtotal || orderPayload.sub_total || 
                (orderPayload.total || orderPayload.total_amount || 0) - 
                (orderPayload.tax || 0) - (orderPayload.delivery_fee || orderPayload.deliveryFee || 0),
      tax: orderPayload.tax || orderPayload.tax_amount || 0,
      delivery_fee: orderPayload.delivery_fee || orderPayload.deliveryFee || orderPayload.shipping || 0,
      tip: orderPayload.tip || orderPayload.tip_amount || 0,
      total_amount: orderPayload.total || orderPayload.total_amount || orderPayload.amount || 0,
      estimated_prep_time: orderPayload.estimated_prep_time || orderPayload.prep_time || 
                           orderPayload.estimatedPrepTime || orderPayload.preparationTime,
      order_time: orderPayload.order_time || orderPayload.created_at || orderPayload.createdAt || 
                  orderPayload.timestamp || new Date().toISOString(),
    };

    // Generate order number
    const orderNumber = `GF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in database
    const orderResult = await query(
      `INSERT INTO orders (
        restaurant_id, order_number, customer_name, customer_phone, customer_email,
        delivery_address_line1, delivery_address_line2, delivery_city, delivery_state,
        delivery_postal_code, delivery_country, delivery_latitude, delivery_longitude,
        subtotal, tax, delivery_fee, tip, total_amount, estimated_prep_time, status,
        gloria_food_order_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'pending', $20)
      RETURNING *`,
      [
        restaurantId,
        orderNumber,
        orderData.customer_name,
        orderData.customer_phone,
        orderData.customer_email || null,
        orderData.delivery_address.line1,
        orderData.delivery_address.line2 || null,
        orderData.delivery_address.city,
        orderData.delivery_address.state || null,
        orderData.delivery_address.postal_code || null,
        orderData.delivery_address.country || 'US',
        null, // latitude - would need geocoding
        null, // longitude - would need geocoding
        orderData.subtotal,
        orderData.tax || 0,
        orderData.delivery_fee || 0,
        orderData.tip || 0,
        orderData.total_amount,
        orderData.estimated_prep_time || null,
        orderData.order_id,
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderData.items) {
      await query(
        `INSERT INTO order_items (order_id, item_name, quantity, unit_price, subtotal, special_instructions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          item.name,
          item.quantity,
          item.unit_price,
          item.subtotal,
          item.special_instructions || null,
        ]
      );
    }

    // Create delivery record
    await query(
      `INSERT INTO deliveries (order_id, restaurant_id, status)
       VALUES ($1, $2, 'pending')`,
      [order.id, restaurantId]
    );

    return order;
  } catch (error) {
    console.error('Error processing Gloria Food order:', error);
    throw new AppError('Failed to process Gloria Food order', 500);
  }
}

/**
 * Verify Gloria Food webhook signature
 */
export function verifyGloriaFoodWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In production, implement proper signature verification
  // For now, we'll use a simple API key check
  return signature === secret;
}
