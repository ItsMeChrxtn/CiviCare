import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

/**
 * Shared list-fetching hook for every paginated resource screen
 * (incidents, documents, users, ...). Handles page state, query params,
 * loading, and re-fetch-on-demand so it isn't rewritten per page.
 */
const usePaginatedFetch = (endpoint, initialParams = {}) => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [params, setParams] = useState({ page: 1, limit: 10, ...initialParams });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(endpoint, { params });
      setRows(data.data);
      setMeta(data.meta || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setPage = (page) => setParams((prev) => ({ ...prev, page }));
  const updateFilters = (filters) => setParams((prev) => ({ ...prev, ...filters, page: 1 }));

  return { rows, meta, params, setPage, updateFilters, isLoading, error, refetch: fetchData };
};

export default usePaginatedFetch;
