import { useState, useEffect } from 'react';
import { getLogs, searchLogs } from '../services/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDisplayDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function previewText(text) {
  if (!text) return 'No content';
  if (text.length <= 100) return text;
  return `${text.slice(0, 100)}...`;
}

export default function LogJournal({ searchQuery, onDateSelect }) {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const isSearch = Boolean(searchQuery?.trim());

  useEffect(() => {
    setPage(1);
    setLogs([]);
    setHasMore(true);
  }, [searchQuery]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        if (isSearch) {
          const res = await searchLogs(searchQuery.trim());
          const data = res.data || [];
          setLogs(data);
          setHasMore(false);
        } else {
          const res = await getLogs(1, 10);
          const data = res.data || [];
          setLogs(data);
          setHasMore(data.length === 10);
          setPage(1);
        }
      } catch (err) {
        setError('Failed to load logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [searchQuery, isSearch]);

  const handleLoadMore = async () => {
    if (isSearch || loadingMore || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);
    setError('');
    try {
      const res = await getLogs(nextPage, 10);
      const data = res.data || [];
      setLogs((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === 10);
    } catch (err) {
      setError('Failed to load more logs');
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading...</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      {logs.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No logs yet</p>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    {formatDisplayDate(log.log_date)}
                  </h3>
                  <p className="text-sm text-gray-600">{previewText(log.what_i_did)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDateSelect(log.log_date)}
                  className="shrink-0 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSearch && hasMore && logs.length > 0 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-md transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
