import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cart, deliveryAddress, notes, paymentMethod, subtotal, deliveryFee, total } = body;

    // Validate required fields
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    if (!deliveryAddress?.trim()) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Get store_id from first cart item (all items should be from same store)
    const storeId = cart[0].storeId;
    
    // Verify store exists and is open
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, status, is_open')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    if (store.status !== 'approved') {
      return NextResponse.json(
        { error: 'Store is not approved' },
        { status: 400 }
      );
    }

    if (!store.is_open) {
      return NextResponse.json(
        { error: 'Store is currently closed' },
        { status: 400 }
      );
    }

    // Verify all products exist and have sufficient stock
    const productIds = cart.map((item: any) => item.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, stock, price, store_id')
      .in('id', productIds);

    if (productsError || !products || products.length !== cart.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      );
    }

    // Check stock availability
    for (const cartItem of cart) {
      const product = products.find((p) => p.id === cartItem.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${cartItem.name} not found` },
          { status: 404 }
        );
      }
      if (product.stock < cartItem.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${cartItem.name}` },
          { status: 400 }
        );
      }
      if (product.store_id !== storeId) {
        return NextResponse.json(
          { error: 'All items must be from the same store' },
          { status: 400 }
        );
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        store_id: storeId,
        total_price: subtotal,
        delivery_fee: deliveryFee,
        final_total: total,
        status: 'pending',
        delivery_address: deliveryAddress,
        notes: notes || null,
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = cart.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback: delete order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    // Update product stock
    for (const cartItem of cart) {
      const product = products.find((p) => p.id === cartItem.productId);
      if (product) {
        await supabase
          .from('products')
          .update({ stock: product.stock - cartItem.quantity })
          .eq('id', product.id);
      }
    }

    return NextResponse.json({ 
      success: true,
      orderId: order.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in create order:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

