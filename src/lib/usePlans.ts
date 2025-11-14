'use client';
import { useEffect, useState } from 'react';
import { supa } from './supabase';

export type CloudPlanSummary = {
  id: string;
  code: string;
  units: 'm' | 'ft';
  tech: boolean;
  gf_lo: number;
  gf_hi: number;
};

export function usePlans() {
  const [plans, setPlans] = useState<CloudPlanSummary[]>([]);

  useEffect(() => {
    let isMounted = true;
    supa
      .from('plans')
      .select('id, code, units, tech, gf_lo, gf_hi')
      .then(({ data }) => {
        if (!isMounted) return;
        const rows = (data ?? []) as CloudPlanSummary[];
        setPlans(rows);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return plans;
}
