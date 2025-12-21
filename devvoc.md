# ORBfood System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Concepts](#core-concepts)
3. [System States & Lifecycle](#system-states--lifecycle)
4. [Data Models](#data-models)
5. [Business Logic](#business-logic)
6. [Edge Cases & Validations](#edge-cases--validations)

---

## System Overview

### What is ORBfood?
ORBfood is a food ordering platform that connects customers with local stores. The platform operates on a **deferred billing model** where stores accumulate platform fees over time and pay periodically.

### Key Principles
- **NOT an escrow system**: Money flows directly from customer to store
- **No automatic deductions**: Platform fees are invoiced, not deducted
- **Period-based billing**: Billing periods are defined by store payment cycles, not calendar dates
- **Single active invoice**: Each store has exactly one active invoice at any time

---

## Core Concepts

### 1. Fee Structure
```
Platform Fee = 5% of food subtotal (excluding delivery fee)

Example:
- Food subtotal: Rp 30,000
- Delivery fee: Rp 5,000
- Total paid by customer: Rp 35,000
- Platform fee: Rp 1,500 (5% × Rp 30,000)
- Store receives: Rp 35,000 (full amount)
- Store owes ORBfood: Rp 1,500
```

### 2. Invoice Lifecycle
```
┌─────────────────────────────────────────────────────┐
│  ACTIVE INVOICE (Accumulating)                      │
│  ┌──────────────────────────────────────┐          │
│  │ Fee += 5% of completed order          │          │
│  │ Accumulates until store pays          │          │
│  │ No expiration date                    │          │
│  └──────────────────────────────────────┘          │
│                     │                                │
│                     ▼                                │
│         Store decides to pay                        │
│                     │                                │
│                     ▼                                │
│  ┌──────────────────────────────────────┐          │
│  │ PENDING_VERIFICATION                  │          │
│  │ Store uploaded payment proof          │          │
│  └──────────────────────────────────────┘          │
│                     │                                │
│                     ▼                                │
│         Admin verifies payment                      │
│                     │                                │
│                     ▼                                │
│  ┌──────────────────────────────────────┐          │
│  │ PAID (Closed)                         │          │
│  │ closed_at = now()                     │          │
│  │ Moved to payment history              │          │
│  └──────────────────────────────────────┘          │
│                     │                                │
│                     ▼                                │
│  ┌──────────────────────────────────────┐          │
│  │ NEW ACTIVE INVOICE (Auto-created)     │          │
│  │ total_fee = 0                          │          │
│  │ opened_at = previous closed_at         │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

### 3. Billing Period Definition
**Important**: Periods are NOT calendar-based.

```
Period = Time between two consecutive store payments

Example:
- Period 1: June 10 → June 25 (15 days, 63 orders)
- Period 2: June 25 → July 3 (8 days, 28 orders)
- Period 3: July 3 → [ongoing] (variable duration)

Each period length is determined by when the store chooses to pay.
```

---

## System States & Lifecycle

### Phase 1: Initial State (Before Any Orders)

#### System Entities
```yaml
Store:
  status: approved
  qris_image: uploaded
  cod_enabled: true/false
  cod_max_amount: 30000  # Optional limit
  
Invoice:
  status: ACTIVE
  total_fee: 0
  total_orders: 0
  opened_at: store_registration_date
  closed_at: null
  
Customer:
  cart: []
  ready_to_checkout: false
```

#### Money Flow
```
Customer Balance: N/A
Store Balance: 0
ORBfood Receivables: 0
```

---

### Phase 2: Customer Checkout

#### Step 2.1: Pre-checkout Validation
```javascript
function validateCheckout(order, store) {
  // Check store availability
  if (store.status !== 'approved') {
    throw new Error('Store is not active');
  }
  
  // Check product availability
  if (!checkProductStock(order.items)) {
    throw new Error('Some items are out of stock');
  }
  
  // Validate COD if selected
  if (order.payment_method === 'cod') {
    if (!store.cod_enabled) {
      throw new Error('COD not available for this store');
    }
    
    const total = order.subtotal + order.delivery_fee;
    if (total > store.cod_max_amount) {
      throw new Error(`COD limit exceeded. Max: ${store.cod_max_amount}`);
    }
  }
  
  return true;
}
```

#### Step 2.2: Payment Method Selection

**Option A: QRIS Payment**
```
1. System displays:
   - Store's QRIS code (not ORBfood's)
   - Total amount: food_subtotal + delivery_fee
   
2. Customer scans and pays directly to store

3. Customer clicks "I have paid"

4. Order created with:
   status: pending_verification
   payment_method: qris
   
5. Money flow:
   Customer → Store (immediate)
   Store → ORBfood (deferred, via invoice)
```

**Option B: COD Payment**
```
1. System validates COD eligibility

2. Order created with:
   status: pending
   payment_method: cod
   
3. Money flow:
   Customer → [will pay on delivery]
   Store → ORBfood (deferred, via invoice)
```

#### Step 2.3: Order Creation
```javascript
const order = {
  order_id: generateId(),
  user_id: customer.id,
  store_id: store.id,
  items: cart.items,
  subtotal: calculateSubtotal(cart.items),
  delivery_fee: calculateDeliveryFee(customer.address, store.location),
  total: subtotal + delivery_fee,
  payment_method: 'qris' | 'cod',
  status: 'pending_verification' | 'pending',
  created_at: now(),
  completed_at: null
};

// Note: Invoice NOT updated yet
```

#### Store Actions
```
Store receives notification → Reviews order → Accepts or Rejects

If Accept:
  order.status = 'processing'
  
If Reject:
  order.status = 'cancelled'
  # No fee charged for cancelled orders
```

---

### Phase 3: Order Completion & Fee Accumulation

#### Step 3.1: Marking Order Complete
```
Trigger: Store clicks "Order Complete" OR Customer confirms delivery
Result: order.status = 'completed'
```

#### Step 3.2: Fee Calculation
```javascript
function calculateFee(order) {
  // Fee ONLY from food subtotal, NOT from delivery fee
  const fee = order.subtotal * 0.05;
  return fee;
}

// Example:
// subtotal: Rp 30,000
// delivery_fee: Rp 5,000
// fee: Rp 30,000 × 5% = Rp 1,500
```

#### Step 3.3: Invoice Accumulation
```javascript
function onOrderComplete(order) {
  const fee = calculateFee(order);
  const activeInvoice = getActiveInvoice(order.store_id);
  
  // Accumulate to active invoice
  activeInvoice.total_fee += fee;
  activeInvoice.total_orders += 1;
  
  // Do NOT create new invoice
  // Do NOT close current invoice
  // Do NOT deduct from store balance
  
  saveInvoice(activeInvoice);
  
  // Link order to invoice for tracking
  createInvoiceItem({
    invoice_id: activeInvoice.id,
    order_id: order.id,
    fee_amount: fee
  });
}
```

#### Step 3.4: System Notifications
```javascript
function checkInvoiceAge(invoice) {
  const daysSinceOpened = daysBetween(invoice.opened_at, now());
  
  if (daysSinceOpened >= 7) {
    sendNotification(invoice.store_id, {
      type: 'reminder',
      message: 'Your invoice has been running for 7 days. Consider settling to avoid large accumulation.',
      amount: invoice.total_fee,
      order_count: invoice.total_orders
    });
  }
  
  // Note: This is a soft reminder, NOT a penalty
}
```

#### What Does NOT Happen
```
❌ No automatic deduction
❌ No payment gateway charge
❌ No blocking of store operations
❌ No penalty or interest
❌ No invoice closure
✅ Only: Fee recorded and accumulated
```

---

### Phase 4: Store Payment & Period Closure

#### Step 4.1: Store Initiates Payment
```
Store decides to pay when:
- Invoice amount feels significant
- After system reminder (7+ days)
- Store wants to "reset" their billing

Payment method:
- Transfer to ORBfood QRIS
- Transfer to ORBfood bank account
```

#### Step 4.2: Payment Verification Flow
```javascript
function processStorePayment(payment) {
  // 1. Store uploads proof and amount
  const invoice = getActiveInvoice(payment.store_id);
  
  if (payment.amount !== invoice.total_fee) {
    throw new Error('Payment amount does not match invoice total');
  }
  
  // 2. Update invoice status
  invoice.status = 'PENDING_VERIFICATION';
  invoice.payment_proof_url = payment.proof_url;
  invoice.payment_submitted_at = now();
  
  // 3. Notify admin
  notifyAdmin({
    type: 'payment_verification_needed',
    invoice_id: invoice.id,
    store_id: payment.store_id,
    amount: payment.amount
  });
}
```

#### Step 4.3: Admin Verification
```javascript
function verifyPayment(invoice_id, admin_id, decision) {
  const invoice = getInvoice(invoice_id);
  
  if (decision === 'APPROVED') {
    // Close the invoice
    invoice.status = 'PAID';
    invoice.closed_at = now();
    invoice.verified_by = admin_id;
    invoice.verified_at = now();
    
    // Move to payment history
    moveToHistory(invoice);
    
    // Create new active invoice
    createNewActiveInvoice(invoice.store_id, invoice.closed_at);
    
    // Notify store
    notifyStore(invoice.store_id, {
      type: 'payment_confirmed',
      message: 'Payment verified. New billing period started.',
      old_invoice: invoice.id
    });
    
  } else {
    // Rejection
    invoice.status = 'ACTIVE'; // Revert to active
    notifyStore(invoice.store_id, {
      type: 'payment_rejected',
      message: 'Payment verification failed. Please check and resubmit.',
      reason: decision.reason
    });
  }
}
```

#### Step 4.4: New Period Initialization
```javascript
function createNewActiveInvoice(store_id, previous_closed_at) {
  const newInvoice = {
    invoice_id: generateId(),
    store_id: store_id,
    status: 'ACTIVE',
    total_fee: 0,
    total_orders: 0,
    opened_at: previous_closed_at, // Start of new period
    closed_at: null,
    previous_invoice_id: getPreviousInvoiceId(store_id)
  };
  
  saveInvoice(newInvoice);
  
  // Any NEW completed orders now accumulate to THIS invoice
  return newInvoice;
}
```

#### Period Boundary Behavior
```
Orders completed BEFORE payment verification:
  → Counted in OLD invoice (Period N)
  
Orders completed AFTER payment verification:
  → Counted in NEW invoice (Period N+1)
  
There is NO overlap or gap in fee tracking.
```

---

## Data Models

### Store Schema
```javascript
{
  store_id: String,
  owner_id: String,
  name: String,
  address: String,
  region: String,
  phone: String,
  qris_image_url: String,
  cod_enabled: Boolean,
  cod_max_amount: Number, // in currency units
  status: Enum['pending', 'approved', 'suspended', 'closed'],
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### Invoice Schema
```javascript
{
  invoice_id: String,
  store_id: String,
  status: Enum['ACTIVE', 'PENDING_VERIFICATION', 'PAID', 'CANCELLED'],
  total_fee: Number,
  total_orders: Number,
  opened_at: Timestamp,    // When period started
  closed_at: Timestamp,    // When period ended (null if active)
  payment_proof_url: String,
  payment_submitted_at: Timestamp,
  verified_by: String,     // Admin ID
  verified_at: Timestamp,
  previous_invoice_id: String, // For linking periods
  created_at: Timestamp,
  updated_at: Timestamp
}

// Indexes needed:
// - store_id + status (to find active invoice)
// - opened_at, closed_at (for period queries)
// - status (for admin verification queue)
```

### Order Schema
```javascript
{
  order_id: String,
  user_id: String,
  store_id: String,
  items: Array[{
    product_id: String,
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  subtotal: Number,        // Sum of all items
  delivery_fee: Number,
  total: Number,           // subtotal + delivery_fee
  payment_method: Enum['qris', 'cod'],
  status: Enum[
    'pending',             // Initial state
    'pending_verification', // QRIS awaiting verification
    'processing',          // Store accepted
    'out_for_delivery',    // Optional
    'completed',           // Delivered and confirmed
    'cancelled'            // Rejected or cancelled
  ],
  customer_address: String,
  customer_phone: String,
  notes: String,
  created_at: Timestamp,
  accepted_at: Timestamp,
  completed_at: Timestamp,
  cancelled_at: Timestamp
}
```

### InvoiceItem Schema (for tracking)
```javascript
{
  item_id: String,
  invoice_id: String,
  order_id: String,
  fee_amount: Number,
  created_at: Timestamp
}

// This links orders to invoices for audit trails
```

---

## Business Logic

### Fee Calculation Rules

```javascript
// Rule 1: Only completed orders generate fees
function shouldCalculateFee(order) {
  return order.status === 'completed';
}

// Rule 2: Fee is 5% of food subtotal only
function calculateOrderFee(order) {
  return order.subtotal * 0.05;
  // delivery_fee is NOT included
}

// Rule 3: Cancelled/rejected orders do not generate fees
function onOrderCancelled(order) {
  // Do nothing to invoice
  // Fee was never added in the first place
}
```

### Invoice Management Rules

```javascript
// Rule 1: One active invoice per store
function getActiveInvoice(store_id) {
  const invoice = db.query(`
    SELECT * FROM invoices 
    WHERE store_id = ? AND status = 'ACTIVE' 
    LIMIT 1
  `, [store_id]);
  
  if (!invoice) {
    throw new Error('Store must have an active invoice');
  }
  
  return invoice;
}

// Rule 2: Never auto-close invoices
function checkInvoiceAutoClose() {
  // ❌ Do NOT implement this
  // Invoices close ONLY when store pays
}

// Rule 3: Create new invoice only after payment
function afterPaymentVerified(old_invoice) {
  createNewActiveInvoice(
    old_invoice.store_id,
    old_invoice.closed_at
  );
}
```

### Payment Verification Rules

```javascript
// Rule 1: Exact amount match required
function validatePaymentAmount(payment, invoice) {
  if (payment.amount !== invoice.total_fee) {
    return {
      valid: false,
      message: `Amount mismatch. Expected: ${invoice.total_fee}, Received: ${payment.amount}`
    };
  }
  return { valid: true };
}

// Rule 2: Payment proof required
function validatePaymentProof(payment) {
  if (!payment.proof_url) {
    return {
      valid: false,
      message: 'Payment proof is required'
    };
  }
  return { valid: true };
}

// Rule 3: Manual admin verification
function requiresManualVerification() {
  return true; // Always manual for now
  // Future: Could implement auto-verification with payment gateway
}
```

---

## Edge Cases & Validations

### Edge Case 1: Order Cancelled After Completion
```
Scenario: Store accidentally marks order complete, then wants to cancel

Solution:
1. Order status: completed → cancelled
2. Reverse the fee from active invoice:
   invoice.total_fee -= fee_amount
   invoice.total_orders -= 1
3. Delete the InvoiceItem record
4. Log the reversal for audit

Code:
```javascript
function reverseOrderFee(order_id) {
  const order = getOrder(order_id);
  
  if (order.status !== 'completed') {
    throw new Error('Only completed orders can be reversed');
  }
  
  const invoiceItem = getInvoiceItemByOrder(order_id);
  const invoice = getInvoice(invoiceItem.invoice_id);
  
  // Only allow reversal if invoice still active
  if (invoice.status !== 'ACTIVE') {
    throw new Error('Cannot reverse fee from closed invoice');
  }
  
  // Reverse the fee
  invoice.total_fee -= invoiceItem.fee_amount;
  invoice.total_orders -= 1;
  
  // Mark order as cancelled
  order.status = 'cancelled';
  order.cancelled_at = now();
  
  // Log the reversal
  logAudit({
    action: 'fee_reversal',
    order_id: order_id,
    invoice_id: invoice.id,
    amount: invoiceItem.fee_amount
  });
  
  // Delete invoice item
  deleteInvoiceItem(invoiceItem.id);
}
```

### Edge Case 2: Store Pays Partial Amount
```
Scenario: Store transfers less than invoice total

Solution:
Admin rejects verification with reason: "Partial payment not accepted"
Store must pay full amount
```

### Edge Case 3: Multiple Orders Complete During Payment Verification
```
Scenario:
1. Invoice has Rp 50,000 (20 orders)
2. Store submits payment for Rp 50,000
3. While admin verifying, 3 more orders complete (Rp 7,500 fee)
4. Invoice now Rp 57,500

Solution:
```javascript
function handleConcurrentOrders(invoice_id) {
  // Lock invoice during verification
  const invoice = lockInvoice(invoice_id);
  
  // Any orders completed after payment submission
  // go to a "pending allocation" state
  const pendingOrders = getOrdersCompletedAfter(
    invoice.store_id,
    invoice.payment_submitted_at
  );
  
  if (pendingOrders.length > 0) {
    // These will be allocated to the NEW invoice
    // after current one closes
  }
}
```

**Better approach**: Use `payment_submitted_at` as the cutoff
```javascript
function allocateOrderToInvoice(order, store_id) {
  const activeInvoice = getActiveInvoice(store_id);
  
  // If invoice is pending verification
  if (activeInvoice.status === 'PENDING_VERIFICATION') {
    // Check if order completed before payment submission
    if (order.completed_at < activeInvoice.payment_submitted_at) {
      // Add to current invoice
      return activeInvoice.id;
    } else {
      // Hold until new invoice created
      return 'PENDING_ALLOCATION';
    }
  }
  
  // Normal case: add to active invoice
  return activeInvoice.id;
}
```

### Edge Case 4: Store Never Pays
```
Scenario: Invoice accumulates for months without payment

Solution:
1. Soft reminders at 7, 14, 30 days
2. After 60 days: Warn about account suspension
3. After 90 days: Suspend store account
4. Outstanding invoice remains as receivable

No penalties, just operational restriction.
```

### Edge Case 5: Two Orders Complete at Exact Same Time
```
Solution: Database handles this with transactions

```javascript
async function addFeeToInvoice(order) {
  await db.transaction(async (trx) => {
    const invoice = await trx('invoices')
      .where({ store_id: order.store_id, status: 'ACTIVE' })
      .forUpdate() // Lock the row
      .first();
    
    const fee = calculateOrderFee(order);
    
    await trx('invoices')
      .where({ id: invoice.id })
      .update({
        total_fee: invoice.total_fee + fee,
        total_orders: invoice.total_orders + 1
      });
    
    await trx('invoice_items').insert({
      invoice_id: invoice.id,
      order_id: order.id,
      fee_amount: fee
    });
  });
}
```

---

## Implementation Checklist

### Backend Requirements
- [ ] Invoice management system
  - [ ] Create active invoice on store approval
  - [ ] Accumulate fees on order completion
  - [ ] Handle payment submission
  - [ ] Payment verification by admin
  - [ ] Auto-create new invoice after verification
  
- [ ] Fee calculation engine
  - [ ] 5% of food subtotal only
  - [ ] Only for completed orders
  - [ ] Fee reversal for cancelled orders
  
- [ ] Notification system
  - [ ] Order notifications to store
  - [ ] Invoice reminders (7, 14, 30 days)
  - [ ] Payment verification notifications
  
- [ ] Admin panel
  - [ ] Payment verification queue
  - [ ] Invoice history view
  - [ ] Manual verification approval/rejection

### Frontend Requirements
- [ ] Store dashboard
  - [ ] Active invoice display (current amount)
  - [ ] Payment submission form
  - [ ] Payment history
  - [ ] Order management
  
- [ ] Customer checkout
  - [ ] QRIS payment flow (show store QRIS)
  - [ ] COD validation
  - [ ] Order confirmation
  
- [ ] Admin dashboard
  - [ ] Pending payment verifications
  - [ ] Store invoice overview
  - [ ] Manual verification interface

### Testing Requirements
- [ ] Fee calculation accuracy
- [ ] Invoice accumulation
- [ ] Payment verification flow
- [ ] Concurrent order handling
- [ ] Fee reversal
- [ ] Edge case scenarios

---

## API Endpoints Reference

```
# Store Invoices
GET    /api/stores/{id}/invoice/active
GET    /api/stores/{id}/invoices/history
POST   /api/stores/{id}/invoice/submit-payment

# Orders
POST   /api/orders
GET    /api/orders/{id}
PATCH  /api/orders/{id}/status
POST   /api/orders/{id}/complete

# Admin
GET    /api/admin/invoices/pending-verification
POST   /api/admin/invoices/{id}/verify
GET    /api/admin/invoices/{id}
GET    /api/admin/stores/{id}/invoices

# Customer
POST   /api/checkout
GET    /api/orders/my-orders
```

---

## Glossary

- **Active Invoice**: The current, open invoice that is accumulating fees
- **Billing Period**: Time between two consecutive store payments (not calendar-based)
- **Fee**: 5% platform charge on food subtotal (excluding delivery)
- **Invoice Accumulation**: Process of adding fees to active invoice as orders complete
- **Payment Verification**: Manual admin check of store payment proof
- **Period Closure**: When invoice is paid and closed, triggering new period

---

## FAQ for Developers

**Q: Why not use calendar-based billing (monthly)?**
A: Flexibility. Small stores may want to pay weekly, large stores might pay daily. Store-controlled periods reduce cash flow pressure.

**Q: Why manual payment verification instead of payment gateway?**
A: Simplicity for MVP. Can integrate automated payment gateway later.

**Q: What if store disputes a fee?**
A: Admin can view InvoiceItems to see which orders generated which fees. Can manually adjust if legitimate error found.

**Q: Can a store have multiple active invoices?**
A: No. Exactly one active invoice per store at all times.

**Q: What happens if invoice gets too large?**
A: System sends reminders. If store doesn't pay after 90 days, account suspended but no penalties charged.

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Maintained By**: ORBfood Engineering Team