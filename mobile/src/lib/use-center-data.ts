import { useCallback, useEffect, useState } from 'react';
import { db } from './api';
import { useAuth } from './auth-context';

/**
 * Markazga tegishli jadvalni yuklaydi (centerId bo'yicha serverda filtrlanadi).
 * Super admin uchun — barcha yozuvlar.
 */
export function useCenterData<T = any>(table: string) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const rows =
          user.centerId && user.centerId !== 'GLOBAL'
            ? await db.getWhere(table, 'centerId', user.centerId)
            : await db.get(table);
        setData(rows as T[]);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, table]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refreshing, error, reload: () => load(true), setData };
}
