'use client';
import { useEffect, useState } from 'react';
import { supa } from './supabase';

export function usePlans() {
  const [plans, setPlans] = useState<any[]>([]);
  useEffect(() => {
    supa
      .from('plans')
      .select('*')
      .then(({ data }) => setPlans(data || []));
  }, []);
  return plans;
}
