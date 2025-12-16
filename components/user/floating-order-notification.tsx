'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function FloatingOrderNotification() {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [hasAnyOrders, setHasAnyOrders] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let channel: any = null;

    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Check if user has any orders at all
        const { data: allOrders, error: allError } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (allError) {
          console.error('Error checking orders:', allError);
          return;
        }

        if (allOrders && allOrders.length > 0) {
          if (mounted) {
            setHasAnyOrders(true);
          }

          // Fetch pending orders count
          const { data: pendingOrders, error: pendingError } = await supabase
            .from('orders')
            .select('id, status')
            .eq('user_id', user.id)
            .in('status', ['pending', 'diproses'])
            .limit(10);

          if (pendingError) {
            console.error('Error fetching pending orders:', pendingError);
            return;
          }

          if (mounted) {
            setPendingOrdersCount(pendingOrders?.length || 0);
          }
        } else {
          if (mounted) {
            setHasAnyOrders(false);
            setPendingOrdersCount(0);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    // Set up real-time subscription
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return;

      channel = supabase
        .channel('user_orders_floating')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();
    });

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Show notification if user has any orders (pending or completed)
  // Badge only shows if there are pending orders
  if (loading || !hasAnyOrders) {
    return null;
  }

  return (
    <Link href="/user/my-orders">
      <Button
        className={cn(
          "fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50",
          "h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg",
          "bg-[#1E3A8A] hover:bg-[#312E81]",
          "flex items-center justify-center",
          "transition-all hover:scale-110 active:scale-95"
        )}
        size="icon"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        {pendingOrdersCount > 0 && (
          <Badge
            className={cn(
              "absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1",
              "h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0",
              "bg-[#22C55E] text-white border-2 border-white",
              "flex items-center justify-center",
              "text-[10px] sm:text-xs font-bold"
            )}
          >
            {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
          </Badge>
        )}
        <span className="sr-only">Lihat status pesanan</span>
      </Button>
    </Link>
  );
}

