// Mock in-memory database for development/testing without PostgreSQL

interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'restaurant_owner' | 'rider' | 'agency_partner';
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  logo_url?: string;
  is_active: boolean;
  subscription_tier: string;
  created_at: Date;
  updated_at: Date;
}

interface Rider {
  id: string;
  user_id: string;
  restaurant_id?: string;
  vehicle_type?: string;
  license_number?: string;
  phone: string;
  current_latitude?: number;
  current_longitude?: number;
  is_available: boolean;
  is_online: boolean;
  status: string;
  rating: number;
  total_deliveries: number;
  created_at: Date;
  updated_at: Date;
}

interface Order {
  id: string;
  restaurant_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address_line1: string;
  delivery_address_line2?: string;
  delivery_city: string;
  delivery_state?: string;
  delivery_postal_code?: string;
  delivery_country: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_instructions?: string;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  tip: number;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  status: string;
  source: string;
  external_order_id?: string;
  scheduled_for?: Date;
  estimated_prep_time?: number;
  estimated_delivery_time?: Date;
  actual_delivery_time?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface OrderItem {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions?: string;
  created_at: Date;
}

interface Delivery {
  id: string;
  order_id: string;
  rider_id?: string;
  restaurant_id: string;
  status: string;
  assigned_at?: Date;
  accepted_at?: Date;
  picked_up_at?: Date;
  started_at?: Date;
  delivered_at?: Date;
  estimated_pickup_time?: Date;
  estimated_delivery_time?: Date;
  actual_delivery_time?: Date;
  distance_km?: number;
  duration_minutes?: number;
  delivery_notes?: string;
  customer_rating?: number;
  customer_feedback?: string;
  created_at: Date;
  updated_at: Date;
}

interface RestaurantSettings {
  id: string;
  restaurant_id: string;
  // API Credentials
  api_key?: string;
  integration_email?: string;
  // Gloria Food
  gloria_food_api_key?: string;
  gloria_food_store_id?: string;
  gloria_food_master_key?: string;
  gloria_food_contact_email?: string;
  gloria_food_webhook_url?: string;
  // DoorDash
  doordash_developer_id?: string;
  doordash_key_id?: string;
  doordash_signing_secret?: string;
  doordash_merchant_id?: string;
  doordash_sandbox?: boolean;
  // Connection status
  is_gloria_food_connected?: boolean;
  is_doordash_connected?: boolean;
  // Location
  country?: string;
  city?: string;
  state?: string;
  currency?: string;
  timezone?: string;
  distance_unit?: string;
  // Dispatch
  auto_assign_riders?: boolean;
  max_delivery_radius?: number;
  delivery_fee?: number;
  minimum_order_amount?: number;
  // Notifications
  email_notifications?: boolean;
  sms_notifications?: boolean;
  order_status_notifications?: boolean;
  delivery_status_notifications?: boolean;
  created_at: Date;
  updated_at: Date;
}

class MockDatabase {
  private users: Map<string, User> = new Map();
  private restaurants: Map<string, Restaurant> = new Map();
  private riders: Map<string, Rider> = new Map();
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem[]> = new Map();
  private deliveries: Map<string, Delivery> = new Map();
  private restaurantSettings: Map<string, RestaurantSettings> = new Map();
  private orderNumberCounter = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed admin user
    const adminUser: User = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@tekmax.com',
      password_hash: '$2a$10$DHNFQWd0S/E291kH4q6b/uPTlL5bJ5UrlsktiqOQQc4qUvtyCTMqa', // password: admin123
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      phone: '+1234567890',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Seed restaurant owner (Merchant)
    const ownerUser: User = {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'owner@restaurant.com',
      password_hash: '$2a$10$ukAGurSeoaMrPBkoA5Igu.Bq6f1j89K5WqDMSpZfAZ8ij/ZshGH5i', // password: owner123
      role: 'restaurant_owner',
      first_name: 'John',
      last_name: 'Restaurant',
      phone: '+1234567891',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(ownerUser.id, ownerUser);

    // Seed agency partner
    const agencyUser: User = {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'agency@tekmax.com',
      password_hash: '$2a$10$gfUtnvPFwWu9PcKky1H4.eLoUN.0Mv3fRiVBpohEvPMTH0GrBflti', // password: agency123
      role: 'agency_partner',
      first_name: 'Agency',
      last_name: 'Partner',
      phone: '+1234567894',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(agencyUser.id, agencyUser);

    // Seed restaurant
    const restaurant: Restaurant = {
      id: '00000000-0000-0000-0000-000000000010',
      owner_id: ownerUser.id,
      name: 'Pizza Palace',
      slug: 'pizza-palace',
      description: 'Best pizza in town',
      phone: '+1234567892',
      email: 'info@pizzapalace.com',
      address_line1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postal_code: '10001',
      country: 'US',
      latitude: 40.7128,
      longitude: -74.0060,
      is_active: true,
      subscription_tier: 'basic',
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.restaurants.set(restaurant.id, restaurant);

    // Seed rider user
    const riderUser: User = {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'rider@tekmax.com',
      password_hash: '$2a$10$Hv1EHr5eMog7PVHR.X3P4uSaqJDgjrManJcqjtuyOcOAL7PHH1igO', // password: rider123
      role: 'rider',
      first_name: 'Mike',
      last_name: 'Rider',
      phone: '+1234567893',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(riderUser.id, riderUser);

    // Seed rider
    const rider: Rider = {
      id: '00000000-0000-0000-0000-000000000020',
      user_id: riderUser.id,
      restaurant_id: restaurant.id,
      vehicle_type: 'motorcycle',
      phone: '+1234567893',
      current_latitude: 40.7128,
      current_longitude: -74.0060,
      is_available: true,
      is_online: true,
      status: 'available',
      rating: 4.8,
      total_deliveries: 150,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.riders.set(rider.id, rider);
  }

  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  // Restaurant operations
  async findRestaurantById(id: string): Promise<Restaurant | null> {
    return this.restaurants.get(id) || null;
  }

  async findRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).filter(r => r.owner_id === ownerId);
  }

  async findAllRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }

  async createRestaurant(restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<Restaurant> {
    const newRestaurant: Restaurant = {
      ...restaurant,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.restaurants.set(newRestaurant.id, newRestaurant);
    return newRestaurant;
  }

  async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<Restaurant | null> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return null;
    const updated = { ...restaurant, ...updates, updated_at: new Date() };
    this.restaurants.set(id, updated);
    return updated;
  }

  // Rider operations
  async findRiderById(id: string): Promise<Rider | null> {
    return this.riders.get(id) || null;
  }

  async findRiderByUserId(userId: string): Promise<Rider | null> {
    for (const rider of this.riders.values()) {
      if (rider.user_id === userId) return rider;
    }
    return null;
  }

  async findAvailableRiders(restaurantId?: string): Promise<Rider[]> {
    let riders = Array.from(this.riders.values()).filter(
      r => r.is_available && r.is_online
    );
    if (restaurantId) {
      riders = riders.filter(r => r.restaurant_id === restaurantId);
    }
    return riders.sort((a, b) => b.rating - a.rating);
  }

  async findAllRiders(): Promise<Rider[]> {
    return Array.from(this.riders.values());
  }

  async createRider(rider: Omit<Rider, 'id' | 'created_at' | 'updated_at'>): Promise<Rider> {
    const newRider: Rider = {
      ...rider,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.riders.set(newRider.id, newRider);
    return newRider;
  }

  async updateRider(id: string, updates: Partial<Rider>): Promise<Rider | null> {
    const rider = this.riders.get(id);
    if (!rider) return null;
    const updated = { ...rider, ...updates, updated_at: new Date() };
    this.riders.set(id, updated);
    return updated;
  }

  // Order operations
  async findOrderById(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async findOrderByNumber(orderNumber: string): Promise<Order | null> {
    for (const order of this.orders.values()) {
      if (order.order_number === orderNumber) return order;
    }
    return null;
  }

  async findOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.restaurant_id === restaurantId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async findAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async createOrder(order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<Order> {
    const orderNumber = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(this.orderNumberCounter++).padStart(6, '0')}`;
    const newOrder: Order = {
      ...order,
      id: this.generateId(),
      order_number: orderNumber,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order) return null;
    const updated = { ...order, ...updates, updated_at: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  // Order items operations
  async createOrderItem(item: Omit<OrderItem, 'id' | 'created_at'>): Promise<OrderItem> {
    const newItem: OrderItem = {
      ...item,
      id: this.generateId(),
      created_at: new Date(),
    };
    const items = this.orderItems.get(item.order_id) || [];
    items.push(newItem);
    this.orderItems.set(item.order_id, items);
    return newItem;
  }

  async findOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.orderItems.get(orderId) || [];
  }

  // Delivery operations
  async findDeliveryById(id: string): Promise<Delivery | null> {
    return this.deliveries.get(id) || null;
  }

  async findDeliveriesByOrder(orderId: string): Promise<Delivery | null> {
    for (const delivery of this.deliveries.values()) {
      if (delivery.order_id === orderId) return delivery;
    }
    return null;
  }

  async findDeliveriesByRider(riderId: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .filter(d => d.rider_id === riderId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async findDeliveriesByRestaurant(restaurantId: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .filter(d => d.restaurant_id === restaurantId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async findAllDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async createDelivery(delivery: Omit<Delivery, 'id' | 'created_at' | 'updated_at'>): Promise<Delivery> {
    const newDelivery: Delivery = {
      ...delivery,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.deliveries.set(newDelivery.id, newDelivery);
    return newDelivery;
  }

  async updateDelivery(id: string, updates: Partial<Delivery>): Promise<Delivery | null> {
    const delivery = this.deliveries.get(id);
    if (!delivery) return null;
    const updated = { ...delivery, ...updates, updated_at: new Date() };
    this.deliveries.set(id, updated);
    return updated;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Query helper (mimics PostgreSQL query interface)
  async query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
    const sql = text.trim().toUpperCase();
    const p = params || [];

    try {
      // SELECT queries
      if (sql.startsWith('SELECT')) {
        // Handle COUNT queries
        if (sql.includes('COUNT(*)')) {
          let count = 0;
          
          // Count orders
          if (sql.includes('FROM ORDERS') || sql.includes('FROM orders')) {
            if (sql.includes('WHERE DATE(created_at) = CURRENT_DATE') || sql.includes('DATE(created_at)')) {
              const today = new Date().toISOString().split('T')[0];
              count = Array.from(this.orders.values()).filter(o => 
                o.created_at.toISOString().split('T')[0] === today
              ).length;
            } else {
              count = this.orders.size;
            }
            return { rows: [{ count: count.toString() }], rowCount: 1 };
          }
          
          // Count deliveries
          if (sql.includes('FROM DELIVERIES') || sql.includes('FROM deliveries')) {
            if (sql.includes("status NOT IN ('delivered', 'cancelled', 'failed')")) {
              count = Array.from(this.deliveries.values()).filter(d => 
                !['delivered', 'cancelled', 'failed'].includes(d.status)
              ).length;
            } else {
              count = this.deliveries.size;
            }
            return { rows: [{ count: count.toString() }], rowCount: 1 };
          }
          
          // Count riders
          if (sql.includes('FROM RIDERS') || sql.includes('FROM riders')) {
            count = this.riders.size;
            return { rows: [{ count: count.toString() }], rowCount: 1 };
          }
          
          // Count restaurants
          if (sql.includes('FROM RESTAURANTS') || sql.includes('FROM restaurants')) {
            count = this.restaurants.size;
            return { rows: [{ count: count.toString() }], rowCount: 1 };
          }
        }

        // Users
        if (sql.includes('FROM USERS') || sql.includes('FROM users') || text.toLowerCase().includes('from users')) {
          // Check for email query
          if (sql.includes('WHERE EMAIL') || text.toLowerCase().includes('where email')) {
            const user = await this.findUserByEmail(p[0]);
            if (user) {
              // Return only requested columns
              const requestedCols = text.match(/SELECT\s+(.+?)\s+FROM/i)?.[1] || '*';
              if (requestedCols === '*') {
                return { rows: [user], rowCount: 1 };
              }
              // Return subset of columns
              const cols = requestedCols.split(',').map(c => c.trim().toLowerCase());
              const result: any = {};
              cols.forEach(col => {
                if (col === 'first_name') result.first_name = user.first_name;
                else if (col === 'last_name') result.last_name = user.last_name;
                else if (col === 'id') result.id = user.id;
                else if (col === 'email') result.email = user.email;
                else if (col === 'password_hash') result.password_hash = user.password_hash;
                else if (col === 'role') result.role = user.role;
                else if (col === 'is_active') result.is_active = user.is_active;
                else if (col === 'phone') result.phone = user.phone;
              });
              return { rows: [result], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
          }
          // Check for id query
          if (sql.includes('WHERE ID') || text.toLowerCase().includes('where id')) {
            const user = await this.findUserById(p[0]);
            if (user) {
              const requestedCols = text.match(/SELECT\s+(.+?)\s+FROM/i)?.[1] || '*';
              if (requestedCols === '*') {
                return { rows: [user], rowCount: 1 };
              }
              const cols = requestedCols.split(',').map(c => c.trim().toLowerCase());
              const result: any = {};
              cols.forEach(col => {
                if (col === 'first_name') result.first_name = user.first_name;
                else if (col === 'last_name') result.last_name = user.last_name;
                else if (col === 'id') result.id = user.id;
                else if (col === 'email') result.email = user.email;
                else if (col === 'password_hash') result.password_hash = user.password_hash;
                else if (col === 'role') result.role = user.role;
                else if (col === 'is_active') result.is_active = user.is_active;
                else if (col === 'phone') result.phone = user.phone;
              });
              return { rows: [result], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
          }
          if (sql.includes('WHERE is_active = true')) {
            const users = Array.from(this.users.values()).filter(u => u.is_active);
            return { rows: users, rowCount: users.length };
          }
        }

        // Restaurants
        if (sql.includes('FROM RESTAURANTS') || sql.includes('FROM restaurants')) {
          if (sql.includes('WHERE owner_id = $1') || sql.includes('WHERE owner_id')) {
            const restaurants = await this.findRestaurantsByOwner(p[0]);
            // If SELECT only specific columns (like SELECT id), return only those
            const requestedCols = text.match(/SELECT\s+(.+?)\s+FROM/i)?.[1] || '*';
            if (requestedCols !== '*' && !requestedCols.includes(',')) {
              // Single column select (like SELECT id)
              const colName = requestedCols.trim().toLowerCase();
              const result = restaurants.map(r => ({ [colName]: r.id }));
              // Handle LIMIT 1
              if (sql.includes('LIMIT 1') || sql.includes('limit 1')) {
                return { rows: result.slice(0, 1), rowCount: result.length > 0 ? 1 : 0 };
              }
              return { rows: result, rowCount: result.length };
            }
            // Handle LIMIT 1
            if (sql.includes('LIMIT 1') || sql.includes('limit 1')) {
              return { rows: restaurants.slice(0, 1), rowCount: restaurants.length > 0 ? 1 : 0 };
            }
            return { rows: restaurants, rowCount: restaurants.length };
          }
          if (sql.includes('WHERE id = $1') || sql.includes('WHERE id')) {
            const restaurant = await this.findRestaurantById(p[0]);
            return { rows: restaurant ? [restaurant] : [], rowCount: restaurant ? 1 : 0 };
          }
          return { rows: await this.findAllRestaurants(), rowCount: this.restaurants.size };
        }

        // Restaurant Settings
        if (sql.includes('FROM restaurant_settings') || sql.includes('FROM RESTAURANT_SETTINGS')) {
          if (sql.includes('WHERE restaurant_id = $1')) {
            const settings = Array.from(this.restaurantSettings.values()).find(s => s.restaurant_id === p[0]);
            if (settings) {
              return { rows: [settings], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
          }
          return { rows: Array.from(this.restaurantSettings.values()), rowCount: this.restaurantSettings.size };
        }

        // Riders (including JOIN queries)
        if (sql.includes('FROM RIDERS') || sql.includes('FROM riders') || sql.includes('JOIN riders') || sql.includes('JOIN RIDERS')) {
          // Handle SELECT restaurant_id FROM riders WHERE user_id
          if (sql.includes('SELECT restaurant_id') && sql.includes('WHERE user_id = $1')) {
            const rider = await this.findRiderByUserId(p[0]);
            if (rider) {
              return { rows: [{ restaurant_id: rider.restaurant_id || null }], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
          }
          
          if (sql.includes('JOIN users') || sql.includes('JOIN USERS')) {
            // Handle JOIN queries for riders with users
            let riders = await this.findAllRiders();
            
            if (sql.includes('WHERE r.restaurant_id = $1') || (sql.includes('WHERE') && sql.includes('restaurant_id'))) {
              const restaurantId = p[0];
              riders = riders.filter(r => r.restaurant_id === restaurantId);
            }
            
            // Add user info to each rider
            const ridersWithUser = riders.map(rider => {
              const user = this.users.get(rider.user_id);
              const restaurant = rider.restaurant_id ? this.restaurants.get(rider.restaurant_id) : null;
              
              return {
                ...rider,
                first_name: user?.first_name || null,
                last_name: user?.last_name || null,
                email: user?.email || null,
                user_phone: user?.phone || null,
                restaurant_name: restaurant?.name || null,
              };
            });
            
            return { rows: ridersWithUser, rowCount: ridersWithUser.length };
          }
          
          if (sql.includes('WHERE user_id = $1') || sql.includes('WHERE user_id')) {
            const rider = await this.findRiderByUserId(p[0]);
            return { rows: rider ? [rider] : [], rowCount: rider ? 1 : 0 };
          }
          if (sql.includes('WHERE id = $1') || sql.includes('WHERE id')) {
            const rider = await this.findRiderById(p[0]);
            return { rows: rider ? [rider] : [], rowCount: rider ? 1 : 0 };
          }
          if (sql.includes('is_available = true') && sql.includes('is_online = true')) {
            const riders = await this.findAvailableRiders(p[0] || undefined);
            // Add user info for available riders
            const ridersWithUser = riders.map(rider => {
              const user = this.users.get(rider.user_id);
              return {
                ...rider,
                first_name: user?.first_name || null,
                last_name: user?.last_name || null,
                user_phone: user?.phone || null,
              };
            });
            return { rows: ridersWithUser, rowCount: ridersWithUser.length };
          }
          if (sql.includes('WHERE restaurant_id = $1')) {
            const allRiders = await this.findAllRiders();
            const filtered = allRiders.filter(r => r.restaurant_id === p[0]);
            return { rows: filtered, rowCount: filtered.length };
          }
          return { rows: await this.findAllRiders(), rowCount: this.riders.size };
        }

        // Orders (including JOIN queries)
        if (sql.includes('FROM ORDERS') || sql.includes('FROM orders') || sql.includes('JOIN orders') || sql.includes('JOIN ORDERS')) {
          if (sql.includes('JOIN restaurants') || sql.includes('JOIN RESTAURANTS')) {
            // Handle JOIN queries for orders with restaurants
            let orders = await this.findAllOrders();
            
            if (sql.includes('WHERE r.owner_id = $1') || (sql.includes('WHERE') && sql.includes('owner_id'))) {
              // Filter by restaurant owner
              const ownerId = p[0];
              const ownerRestaurants = await this.findRestaurantsByOwner(ownerId);
              const restaurantIds = ownerRestaurants.map(r => r.id);
              orders = orders.filter(o => restaurantIds.includes(o.restaurant_id));
            }
            
            // Add restaurant name to each order
            const ordersWithRestaurant = orders.map(order => {
              const restaurant = this.restaurants.get(order.restaurant_id);
              return {
                ...order,
                restaurant_name: restaurant?.name || null,
              };
            });
            
            return { rows: ordersWithRestaurant.slice(0, 100), rowCount: ordersWithRestaurant.length };
          }
          
          if (sql.includes('WHERE restaurant_id')) {
            const orders = await this.findOrdersByRestaurant(p[0]);
            return { rows: orders, rowCount: orders.length };
          }
          if (sql.includes('WHERE id = $1') || sql.includes('WHERE id')) {
            const order = await this.findOrderById(p[0]);
            return { rows: order ? [order] : [], rowCount: order ? 1 : 0 };
          }
          if (sql.includes('WHERE order_number')) {
            const order = await this.findOrderByNumber(p[0]);
            return { rows: order ? [order] : [], rowCount: order ? 1 : 0 };
          }
          return { rows: await this.findAllOrders(), rowCount: this.orders.size };
        }

        // Order Items
        if (sql.includes('FROM ORDER_ITEMS') || sql.includes('FROM order_items')) {
          if (sql.includes('WHERE order_id = $1') || sql.includes('WHERE order_id')) {
            const items = await this.findOrderItems(p[0]);
            return { rows: items, rowCount: items.length };
          }
        }

        // Deliveries (including JOIN queries)
        if (sql.includes('FROM DELIVERIES') || sql.includes('FROM deliveries') || sql.includes('JOIN deliveries') || sql.includes('JOIN DELIVERIES')) {
          if (sql.includes('JOIN orders') || sql.includes('JOIN ORDERS') || sql.includes('JOIN restaurants') || sql.includes('JOIN RESTAURANTS')) {
            // Handle JOIN queries for deliveries with orders and restaurants
            let deliveries = await this.findAllDeliveries();
            
            if (sql.includes('WHERE r.owner_id = $1') || (sql.includes('WHERE') && sql.includes('owner_id'))) {
              // Filter by restaurant owner
              const ownerId = p[0];
              const ownerRestaurants = await this.findRestaurantsByOwner(ownerId);
              const restaurantIds = ownerRestaurants.map(r => r.id);
              deliveries = deliveries.filter(d => restaurantIds.includes(d.restaurant_id));
            } else if (sql.includes('WHERE d.rider_id = $1') || (sql.includes('WHERE') && sql.includes('rider_id'))) {
              // Filter by rider
              const riderId = p[0];
              deliveries = deliveries.filter(d => d.rider_id === riderId);
            }
            
            // Add order and restaurant info to each delivery
            const deliveriesWithDetails = deliveries.map(delivery => {
              const order = this.orders.get(delivery.order_id);
              const restaurant = this.restaurants.get(delivery.restaurant_id);
              const rider = delivery.rider_id ? this.riders.get(delivery.rider_id) : null;
              const riderUser = rider ? this.users.get(rider.user_id) : null;
              
              return {
                ...delivery,
                order_number: order?.order_number || null,
                customer_name: order?.customer_name || null,
                customer_phone: order?.customer_phone || null,
                delivery_address_line1: order?.delivery_address_line1 || null,
                delivery_city: order?.delivery_city || null,
                restaurant_name: restaurant?.name || null,
                rider_name: riderUser ? `${riderUser.first_name} ${riderUser.last_name}` : null,
              };
            });
            
            return { rows: deliveriesWithDetails.slice(0, 100), rowCount: deliveriesWithDetails.length };
          }
          
          if (sql.includes('WHERE order_id = $1') || sql.includes('WHERE order_id')) {
            const delivery = await this.findDeliveriesByOrder(p[0]);
            return { rows: delivery ? [delivery] : [], rowCount: delivery ? 1 : 0 };
          }
          if (sql.includes('WHERE rider_id = $1') || sql.includes('WHERE rider_id')) {
            const deliveries = await this.findDeliveriesByRider(p[0]);
            return { rows: deliveries, rowCount: deliveries.length };
          }
          if (sql.includes('WHERE restaurant_id')) {
            const deliveries = await this.findDeliveriesByRestaurant(p[0]);
            return { rows: deliveries, rowCount: deliveries.length };
          }
          if (sql.includes('WHERE id = $1') || sql.includes('WHERE id')) {
            const delivery = await this.findDeliveryById(p[0]);
            return { rows: delivery ? [delivery] : [], rowCount: delivery ? 1 : 0 };
          }
          return { rows: await this.findAllDeliveries(), rowCount: this.deliveries.size };
        }
      }

      // INSERT queries
      if (sql.startsWith('INSERT INTO')) {
        if (sql.includes('INTO USERS') || sql.includes('INTO users')) {
          try {
            const user = await this.createUser({
              email: p[0],
              password_hash: p[1],
              role: p[2],
              first_name: p[3],
              last_name: p[4],
              phone: p[5] || undefined,
              is_active: true,
              email_verified: false,
            });
            if (sql.includes('RETURNING')) {
              return { rows: [{ id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name }], rowCount: 1 };
            }
            return { rows: [], rowCount: 1 };
          } catch (error) {
            console.error('Error creating user in mock DB:', error);
            throw error;
          }
        }

        if (sql.includes('INTO RESTAURANTS')) {
          const restaurant = await this.createRestaurant({
            owner_id: p[0],
            name: p[1],
            slug: p[2],
            description: p[3] || undefined,
            phone: p[4] || undefined,
            email: p[5] || undefined,
            address_line1: p[6],
            address_line2: p[7] || undefined,
            city: p[8],
            state: p[9] || undefined,
            postal_code: p[10] || undefined,
            country: p[11] || 'US',
            latitude: p[12] || undefined,
            longitude: p[13] || undefined,
            is_active: true,
            subscription_tier: 'basic',
          });
          if (sql.includes('RETURNING')) {
            return { rows: [restaurant], rowCount: 1 };
          }
          return { rows: [], rowCount: 1 };
        }

        if (sql.includes('INTO ORDERS')) {
          const order = await this.createOrder({
            restaurant_id: p[0],
            customer_name: p[1],
            customer_phone: p[2],
            customer_email: p[3] || undefined,
            delivery_address_line1: p[4],
            delivery_address_line2: p[5] || undefined,
            delivery_city: p[6],
            delivery_state: p[7] || undefined,
            delivery_postal_code: p[8] || undefined,
            delivery_country: p[9] || 'US',
            delivery_latitude: p[10] || undefined,
            delivery_longitude: p[11] || undefined,
            delivery_instructions: p[12] || undefined,
            subtotal: parseFloat(p[13]),
            tax: parseFloat(p[14] || 0),
            delivery_fee: parseFloat(p[15] || 0),
            tip: parseFloat(p[16] || 0),
            total_amount: parseFloat(p[17]),
            payment_status: 'pending',
            status: p[18] || 'pending',
            source: 'manual',
            estimated_prep_time: p[19] || undefined,
          });
          if (sql.includes('RETURNING')) {
            return { rows: [order], rowCount: 1 };
          }
          return { rows: [], rowCount: 1 };
        }

        if (sql.includes('INTO order_items')) {
          const item = await this.createOrderItem({
            order_id: p[0],
            item_name: p[1],
            quantity: parseInt(p[2]),
            unit_price: parseFloat(p[3]),
            subtotal: parseFloat(p[4]),
            special_instructions: p[5] || undefined,
          });
          return { rows: [], rowCount: 1 };
        }

        if (sql.includes('INTO DELIVERIES')) {
          const delivery = await this.createDelivery({
            order_id: p[0],
            restaurant_id: p[1],
            rider_id: p[2] || undefined,
            status: p[3] || 'pending',
          });
          return { rows: [], rowCount: 1 };
        }

        if (sql.includes('INTO restaurant_settings') || sql.includes('INTO RESTAURANT_SETTINGS')) {
          const settingsId = this.generateId();
          const settings: RestaurantSettings = {
            id: settingsId,
            restaurant_id: p[0],
            created_at: new Date(),
            updated_at: new Date(),
          };
          this.restaurantSettings.set(settingsId, settings);
          if (sql.includes('RETURNING')) {
            return { rows: [settings], rowCount: 1 };
          }
          return { rows: [], rowCount: 1 };
        }
      }

      // UPDATE queries
      if (sql.startsWith('UPDATE')) {
        if (sql.includes('users SET')) {
          const user = await this.findUserById(p[p.length - 1]); // Last param is usually WHERE id
          if (user) {
            // Simplified - would need to parse SET clauses properly
            return { rows: [], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }

        if (sql.includes('orders SET status')) {
          const order = await this.findOrderById(p[1]); // Usually WHERE id = $2
          if (order) {
            await this.updateOrder(p[1], { status: p[0] });
            return { rows: [], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }

        if (sql.includes('deliveries SET')) {
          const delivery = await this.findDeliveryById(p[p.length - 1]);
          if (delivery) {
            const updates: any = {};
            if (sql.includes('status = $1')) updates.status = p[0];
            if (sql.includes('rider_id = $1')) updates.rider_id = p[0];
            if (sql.includes('assigned_at')) updates.assigned_at = new Date();
            if (sql.includes('accepted_at')) updates.accepted_at = new Date();
            if (sql.includes('picked_up_at')) updates.picked_up_at = new Date();
            if (sql.includes('started_at')) updates.started_at = new Date();
            if (sql.includes('delivered_at')) updates.delivered_at = new Date();
            if (sql.includes('actual_delivery_time')) updates.actual_delivery_time = new Date();
            await this.updateDelivery(p[p.length - 1], updates);
            return { rows: [], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }

        if (sql.includes('riders SET')) {
          const riderId = p[p.length - 1];
          const updates: any = {};
          if (sql.includes('is_available')) updates.is_available = p[0];
          if (sql.includes('is_online')) updates.is_online = p[0];
          if (sql.includes('status')) updates.status = p[0];
          if (sql.includes('current_latitude')) updates.current_latitude = p[0];
          if (sql.includes('current_longitude')) updates.current_longitude = p[1];
          await this.updateRider(riderId, updates);
          return { rows: [], rowCount: 1 };
        }

        if (sql.includes('restaurant_settings SET') || sql.includes('RESTAURANT_SETTINGS SET')) {
          const restaurantId = p[p.length - 1]; // Last param is WHERE restaurant_id
          let settings = Array.from(this.restaurantSettings.values()).find(s => s.restaurant_id === restaurantId);
          
          if (!settings) {
            // Create new settings if doesn't exist
            settings = {
              id: this.generateId(),
              restaurant_id: restaurantId,
              created_at: new Date(),
              updated_at: new Date(),
            };
            this.restaurantSettings.set(settings.id, settings);
          }

          // Parse SET clauses (simplified - matches common patterns)
          const updates: any = { updated_at: new Date() };
          let paramIndex = 0;
          
          // Match common field patterns
          const fieldMappings: { [key: string]: string } = {
            'api_key': 'api_key',
            'integration_email': 'integration_email',
            'gloria_food_api_key': 'gloria_food_api_key',
            'gloria_food_store_id': 'gloria_food_store_id',
            'gloria_food_master_key': 'gloria_food_master_key',
            'gloria_food_contact_email': 'gloria_food_contact_email',
            'gloria_food_webhook_url': 'gloria_food_webhook_url',
            'doordash_developer_id': 'doordash_developer_id',
            'doordash_key_id': 'doordash_key_id',
            'doordash_signing_secret': 'doordash_signing_secret',
            'doordash_merchant_id': 'doordash_merchant_id',
            'doordash_sandbox': 'doordash_sandbox',
            'is_gloria_food_connected': 'is_gloria_food_connected',
            'is_doordash_connected': 'is_doordash_connected',
            'country': 'country',
            'city': 'city',
            'state': 'state',
            'currency': 'currency',
            'timezone': 'timezone',
            'distance_unit': 'distance_unit',
            'auto_assign_riders': 'auto_assign_riders',
            'max_delivery_radius': 'max_delivery_radius',
            'delivery_fee': 'delivery_fee',
            'minimum_order_amount': 'minimum_order_amount',
            'email_notifications': 'email_notifications',
            'sms_notifications': 'sms_notifications',
            'order_status_notifications': 'order_status_notifications',
            'delivery_status_notifications': 'delivery_status_notifications',
          };

          for (const [sqlField, jsField] of Object.entries(fieldMappings)) {
            const regex = new RegExp(`${sqlField}\\s*=\\s*\\$\\d+`, 'gi');
            if (regex.test(text)) {
              const match = text.match(new RegExp(`${sqlField}\\s*=\\s*\\$(\\d+)`, 'i'));
              if (match) {
                const paramNum = parseInt(match[1]) - 1;
                if (paramNum < p.length - 1) { // Exclude last param (WHERE clause)
                  updates[jsField] = p[paramNum];
                }
              }
            }
          }

          // Apply updates
          Object.assign(settings, updates);
          this.restaurantSettings.set(settings.id, settings);

          if (sql.includes('RETURNING')) {
            return { rows: [settings], rowCount: 1 };
          }
          return { rows: [], rowCount: 1 };
        }

        if (sql.includes('restaurants SET') || sql.includes('RESTAURANTS SET')) {
          const restaurantId = p[p.length - 1];
          const restaurant = await this.findRestaurantById(restaurantId);
          if (restaurant) {
            const updates: any = {};
            if (sql.includes('name = $1')) updates.name = p[0];
            if (sql.includes('description = $1')) updates.description = p[0];
            if (sql.includes('phone = $1')) updates.phone = p[0];
            if (sql.includes('email = $1')) updates.email = p[0];
            if (sql.includes('address_line1 = $1')) updates.address_line1 = p[0];
            if (sql.includes('address_line2 = $1')) updates.address_line2 = p[0];
            if (sql.includes('city = $1')) updates.city = p[0];
            if (sql.includes('state = $1')) updates.state = p[0];
            if (sql.includes('postal_code = $1')) updates.postal_code = p[0];
            if (sql.includes('country = $1')) updates.country = p[0];
            if (sql.includes('latitude = $1')) updates.latitude = p[0];
            if (sql.includes('longitude = $1')) updates.longitude = p[0];
            await this.updateRestaurant(restaurantId, updates);
            if (sql.includes('RETURNING')) {
              const updated = await this.findRestaurantById(restaurantId);
              return { rows: updated ? [updated] : [], rowCount: updated ? 1 : 0 };
            }
            return { rows: [], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }
      }
    } catch (error: any) {
      console.error('Mock DB query error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      // Don't throw - return empty result to prevent server crash
      // The actual error will be logged above
    }

    console.warn(`Mock DB: Unhandled query: ${text} with params: ${JSON.stringify(params)}`);
    return { rows: [], rowCount: 0 };
  }
}

// Export singleton instance
export const mockDb = new MockDatabase();

// Export types
export type { User, Restaurant, Rider, Order, OrderItem, Delivery };
