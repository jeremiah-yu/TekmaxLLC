# Courier Partnership Model

## Overview

This document explains how platforms like Shipday handle courier partnerships, the business and technical requirements, and how a startup should approach courier companies.

---

## How Shipday & Similar Platforms Do It

### Business Model

1. **Own Riders First**
   - Start with restaurant's own delivery staff
   - Full control over delivery experience
   - Higher margins (no courier commission)
   - Better customer experience

2. **Courier Partnerships as Backup**
   - When own riders unavailable
   - During peak hours
   - For long-distance deliveries
   - As capacity expansion

3. **Hybrid Model**
   - Smart routing: own riders for nearby, couriers for far
   - Cost optimization: use cheaper option
   - Reliability: fallback when needed

### Revenue Models

**Option 1: Commission-Based**
- Platform takes 15-25% commission from restaurant
- Restaurant pays courier separately
- Platform keeps full commission

**Option 2: Markup Model**
- Platform adds markup to courier fee
- Restaurant pays platform
- Platform pays courier (keeps difference)
- Example: Courier charges $5, platform charges $7, keeps $2

**Option 3: Subscription + Usage**
- Monthly subscription fee
- Per-delivery fee (lower than commission)
- Predictable revenue

**Option 4: White-Label**
- Platform charges courier companies
- Couriers pay for access to restaurant network
- Revenue share with restaurants

---

## Technical Requirements

### 1. Courier API Integration

#### Outgoing API (Platform → Courier)

**Create Delivery Request**
```http
POST https://courier-api.com/deliveries
Authorization: Bearer <courier_api_key>
Content-Type: application/json

{
  "pickup": {
    "name": "Pizza Palace",
    "address": "123 Main St, New York, NY 10001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "phone": "+1234567890",
    "instructions": "Pick up from back door"
  },
  "dropoff": {
    "name": "Jane Doe",
    "address": "456 Oak Ave, New York, NY 10002",
    "latitude": 40.7580,
    "longitude": -73.9855,
    "phone": "+1234567891",
    "instructions": "Ring doorbell twice"
  },
  "items": [
    {
      "description": "Pizza",
      "quantity": 1
    }
  ],
  "estimated_pickup_time": "2024-01-01T12:30:00Z",
  "estimated_delivery_time": "2024-01-01T13:00:00Z",
  "special_instructions": "Handle with care",
  "external_order_id": "ORD-20240101-000001"
}
```

**Response:**
```json
{
  "delivery_id": "courier_delivery_123",
  "status": "pending",
  "estimated_cost": 7.50,
  "tracking_url": "https://courier.com/track/123",
  "rider": {
    "name": "John Courier",
    "phone": "+1234567892"
  }
}
```

#### Incoming Webhooks (Courier → Platform)

**Delivery Status Updates**
```http
POST https://your-platform.com/api/webhooks/courier-partner
X-API-Key: <your_webhook_secret>

{
  "event": "delivery.status_changed",
  "delivery_id": "courier_delivery_123",
  "status": "picked_up",
  "timestamp": "2024-01-01T12:35:00Z",
  "rider": {
    "name": "John Courier",
    "phone": "+1234567892",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

**Delivery Completed**
```json
{
  "event": "delivery.completed",
  "delivery_id": "courier_delivery_123",
  "status": "delivered",
  "delivered_at": "2024-01-01T13:05:00Z",
  "proof_of_delivery": {
    "photo_url": "https://courier.com/photos/123.jpg",
    "signature": "base64_signature"
  }
}
```

### 2. Database Schema for Couriers

```sql
-- Courier partners
CREATE TABLE courier_partners (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(500),
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    commission_rate DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courier deliveries
CREATE TABLE courier_deliveries (
    id UUID PRIMARY KEY,
    delivery_id UUID REFERENCES deliveries(id),
    courier_partner_id UUID REFERENCES courier_partners(id),
    external_delivery_id VARCHAR(255),
    status VARCHAR(50),
    tracking_url VARCHAR(500),
    cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Integration Flow

```
1. Order Ready
   ↓
2. Check Own Riders Available?
   ├─ Yes → Assign to Own Rider
   └─ No → Check Courier Partners
       ↓
3. Request Quote from Couriers
   ↓
4. Select Best Option (cost, ETA, reliability)
   ↓
5. Create Delivery with Courier
   ↓
6. Track via Courier API/Webhooks
   ↓
7. Update Delivery Status
   ↓
8. Handle Completion/Payment
```

### 4. Implementation Code Example

```typescript
// services/courierService.ts

interface CourierPartner {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  commissionRate: number;
}

async function requestCourierDelivery(
  courier: CourierPartner,
  delivery: Delivery
): Promise<CourierDeliveryResponse> {
  const response = await axios.post(
    `${courier.apiEndpoint}/deliveries`,
    {
      pickup: {
        name: delivery.restaurant.name,
        address: delivery.restaurant.address,
        latitude: delivery.restaurant.latitude,
        longitude: delivery.restaurant.longitude,
        phone: delivery.restaurant.phone,
      },
      dropoff: {
        name: delivery.order.customerName,
        address: delivery.order.deliveryAddress,
        latitude: delivery.order.deliveryLatitude,
        longitude: delivery.order.deliveryLongitude,
        phone: delivery.order.customerPhone,
      },
      external_order_id: delivery.order.orderNumber,
    },
    {
      headers: {
        Authorization: `Bearer ${courier.apiKey}`,
      },
    }
  );

  return response.data;
}

async function assignToCourier(
  deliveryId: string,
  courierPartnerId: string
): Promise<void> {
  const delivery = await getDelivery(deliveryId);
  const courier = await getCourierPartner(courierPartnerId);

  // Request delivery from courier
  const courierResponse = await requestCourierDelivery(courier, delivery);

  // Save courier delivery record
  await query(
    `INSERT INTO courier_deliveries 
     (delivery_id, courier_partner_id, external_delivery_id, status, cost)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      deliveryId,
      courierPartnerId,
      courierResponse.delivery_id,
      courierResponse.status,
      courierResponse.estimated_cost,
    ]
  );

  // Update delivery status
  await updateDeliveryStatus(deliveryId, 'assigned');
}
```

---

## How to Approach Courier Companies

### 1. Research & Identify Partners

**Types of Courier Companies:**
- **On-Demand Couriers**: DoorDash Drive, Uber Direct, Postmates
- **Local Couriers**: Regional delivery services
- **Logistics Companies**: FedEx SameDay, DHL Express
- **Specialized**: Food delivery only, same-day only

**Research Steps:**
1. Identify couriers in your target market
2. Check if they have API/partnership programs
3. Review pricing and commission structures
4. Check integration requirements
5. Read reviews and reliability ratings

### 2. Initial Contact

**Email Template:**
```
Subject: Partnership Opportunity - TekMax Delivery Platform

Hi [Courier Company] Team,

I'm [Your Name], founder of TekMax, a delivery management platform 
for restaurants. We're looking to partner with reliable courier 
services to expand our delivery capacity.

We currently work with [X] restaurants and process [Y] deliveries 
per month. We're interested in integrating [Courier Company] as 
a delivery partner for orders when our own riders are unavailable.

Key Questions:
1. Do you offer API integration for third-party platforms?
2. What are your pricing/commission rates?
3. What are the technical requirements?
4. Do you have a partnership program?

Looking forward to discussing this opportunity.

Best regards,
[Your Name]
[Your Contact Info]
```

### 3. Partnership Negotiation

**Key Points to Discuss:**
- **Volume**: Expected delivery volume
- **Pricing**: Negotiate rates based on volume
- **SLA**: Delivery time guarantees
- **Coverage**: Geographic coverage areas
- **Support**: Technical support availability
- **Exclusivity**: Non-exclusive preferred
- **Payment Terms**: Net 30, weekly, etc.

**Negotiation Tips:**
- Start with smaller couriers (easier to negotiate)
- Emphasize volume potential
- Ask for pilot program first
- Negotiate better rates for exclusivity (if beneficial)
- Get everything in writing

### 4. Technical Integration

**Steps:**
1. **Get API Credentials**: Request API keys and documentation
2. **Sandbox Testing**: Test in sandbox environment first
3. **Implement Integration**: Build API client and webhook handlers
4. **Test Thoroughly**: Test all scenarios (success, failures, edge cases)
5. **Production Rollout**: Start with small volume, monitor closely
6. **Scale Gradually**: Increase volume as confidence grows

### 5. Legal & Compliance

**Agreements Needed:**
- **Partnership Agreement**: Terms, pricing, SLA
- **API License**: Terms of API usage
- **Data Sharing Agreement**: GDPR, privacy compliance
- **Insurance**: Verify courier has proper insurance

**Key Clauses:**
- Liability for lost/damaged orders
- Data privacy and security
- Termination clauses
- Dispute resolution

---

## Revenue Models Comparison

### Model 1: Commission-Based (Recommended for Startups)

**How it Works:**
- Restaurant pays platform 20% commission
- Restaurant pays courier separately (or platform handles)
- Platform keeps commission

**Pros:**
- Simple to implement
- Predictable revenue
- Restaurant controls courier costs

**Cons:**
- Restaurant pays both commission and courier fee
- May be expensive for restaurants

### Model 2: Markup Model

**How it Works:**
- Courier charges $5
- Platform charges restaurant $7
- Platform keeps $2 difference

**Pros:**
- Transparent pricing
- Platform controls margin
- Restaurant sees one price

**Cons:**
- Need to negotiate with couriers
- Margin may be thin

### Model 3: Subscription + Usage

**How it Works:**
- $99/month subscription
- $2 per delivery (regardless of courier cost)
- Platform absorbs courier costs

**Pros:**
- Predictable for restaurants
- Platform can optimize courier selection
- Higher margins possible

**Cons:**
- Platform takes on cost risk
- Need volume to be profitable

---

## Implementation Roadmap

### Phase 1: Research (Week 1)
- [ ] Identify 3-5 potential courier partners
- [ ] Research their APIs and requirements
- [ ] Contact them for partnership discussions

### Phase 2: Pilot Partnership (Weeks 2-4)
- [ ] Sign agreement with 1 courier
- [ ] Implement API integration
- [ ] Test with 1-2 restaurants
- [ ] Monitor and gather feedback

### Phase 3: Scale (Weeks 5-8)
- [ ] Add more courier partners
- [ ] Implement smart routing (own riders vs couriers)
- [ ] Add courier selection UI
- [ ] Optimize cost and ETA algorithms

### Phase 4: Optimization (Ongoing)
- [ ] Analyze courier performance
- [ ] Negotiate better rates
- [ ] Add more courier options
- [ ] Improve routing algorithms

---

## Best Practices

### 1. Start Small
- Begin with 1-2 courier partners
- Test thoroughly before scaling
- Learn from initial partnerships

### 2. Maintain Quality
- Monitor courier performance
- Track on-time delivery rates
- Handle complaints promptly
- Drop underperforming couriers

### 3. Cost Optimization
- Compare courier prices
- Route to cheapest option when appropriate
- Negotiate volume discounts
- Use own riders when possible

### 4. Customer Experience
- Keep customers informed
- Provide tracking links
- Handle issues quickly
- Maintain consistent experience

### 5. Technical Reliability
- Implement retry logic
- Handle API failures gracefully
- Monitor integration health
- Have fallback options

---

## Common Challenges & Solutions

### Challenge 1: No API Available
**Solution**: 
- Use manual assignment process
- Build webhook receiver for status updates
- Consider alternative couriers with APIs

### Challenge 2: High Costs
**Solution**:
- Negotiate volume discounts
- Use couriers only when necessary
- Optimize routing to reduce costs
- Pass some costs to restaurants

### Challenge 3: Reliability Issues
**Solution**:
- Work with multiple couriers
- Have fallback options
- Monitor performance metrics
- Set SLAs and hold couriers accountable

### Challenge 4: Integration Complexity
**Solution**:
- Start with simplest courier
- Build reusable integration framework
- Document everything
- Test thoroughly

---

## Success Metrics

### Partnership Health
- Number of active courier partners: 3-5
- Average delivery time: <30 minutes
- On-time delivery rate: >90%
- Customer satisfaction: >4.5 stars

### Business Metrics
- % of deliveries via couriers: 20-30%
- Average courier cost per delivery: $5-8
- Platform margin on courier deliveries: 15-25%
- Revenue from courier partnerships: Growing

---

## Conclusion

Courier partnerships are essential for scaling delivery operations. Start with your own riders, then add courier partners as backup and capacity expansion. Focus on:
1. **Quality**: Reliable couriers with good service
2. **Cost**: Competitive pricing and margins
3. **Integration**: Smooth technical integration
4. **Relationships**: Strong partnerships with couriers

Remember: Your own riders should be the primary delivery method. Couriers are a supplement, not a replacement.
