'use client';

import { Suspense } from 'react';
import { UserHomeContent } from './user-home-content';

export function UserHomeWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserHomeContent />
    </Suspense>
  );
}

