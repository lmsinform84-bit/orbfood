'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserHeader } from './user-header';
import { HomePageNew } from './home-page-new';
import { FloatingOrderNotification } from './floating-order-notification';
import { supabase } from '@/lib/supabase/client';

export function UserHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedAreaId = searchParams.get('area');
  const [selectedAreaName, setSelectedAreaName] = useState<string | null>(null);

  useEffect(() => {
    const fetchAreaName = async () => {
      if (!selectedAreaId) {
        setSelectedAreaName(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('areas')
          .select('name')
          .eq('id', selectedAreaId)
          .single();

        if (error || !data) {
          setSelectedAreaName(null);
          return;
        }

        setSelectedAreaName(data.name);
      } catch (error) {
        console.error('Error fetching area name:', error);
        setSelectedAreaName(null);
      }
    };

    fetchAreaName();
  }, [selectedAreaId]);

  const handleAreaChange = (areaId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (areaId) {
      params.set('area', areaId);
    } else {
      params.delete('area');
    }
    router.push(`/user/home?${params.toString()}`);
  };

  return (
    <>
      <UserHeader 
        selectedAreaId={selectedAreaId} 
        onAreaChange={handleAreaChange}
      />
      <HomePageNew 
        selectedAreaId={selectedAreaId}
        selectedAreaName={selectedAreaName}
      />
      <FloatingOrderNotification />
    </>
  );
}

