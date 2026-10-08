import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiChevronUp, FiChevronDown, FiSearch } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import AnnouncementCard from '../../components/announcements/AnnouncementCard';
import Pagination from '../../components/common/Pagination';
import { CardSkeleton } from '../../components/common/Skeleton';

const CATEGORIES = ['general', 'health', 'safety', 'emergency', 'event', 'infrastructure'];

/** Digital bulletin board: one post at a time with up/down arrows (docu Figure 8), plus search and category filter. */
const Announcements = () => {
  const { t } = usePreferences();
  const [searchParams] = useSearchParams();
  const { rows, meta, params, setPage, updateFilters, isLoading } = usePaginatedFetch('/announcements', {
    limit: 10,
    sort: '-isPinned,-createdAt',
  });
  const [index, setIndex] = useState(0);
  const refs = useRef([]);
  const counted = useRef(new Set());

  // Open on the post that was clicked on the dashboard.
  useEffect(() => {
    const focus = searchParams.get('focus');
    const i = focus ? rows.findIndex((r) => r._id === focus) : 0;
    setIndex(Math.max(i, 0));
  }, [rows, searchParams]);

  useEffect(() => {
    const item = rows[index];
    if (!item) return;
    refs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Opening the post through the detail endpoint records one view per resident.
    if (!counted.current.has(item._id)) {
      counted.current.add(item._id);
      api.get(`/announcements/${item._id}`).catch(() => {});
    }
  }, [index, rows]);

  const move = (delta) => setIndex((i) => Math.min(Math.max(i + delta, 0), rows.length - 1));

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder={`${t('common.search')}...`}
              onChange={(e) => updateFilters({ search: e.target.value || undefined })}
              className="input-field pl-10"
              aria-label={t('common.search')}
            />
          </div>
          <select onChange={(e) => updateFilters({ category: e.target.value || undefined })} className="input-field w-auto capitalize" aria-label="Category">
            <option value="">{t('common.all')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <CardSkeleton />
        ) : rows.length === 0 ? (
          <p className="card p-10 text-center text-sm text-gray-400">{t('dash.noAnnouncements')}</p>
        ) : (
          <div className="space-y-6">
            {rows.map((a, i) => (
              <div
                key={a._id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className={`scroll-mt-24 rounded-xl transition ${i === index ? 'ring-2 ring-primary-500' : 'opacity-90'}`}
              >
                <AnnouncementCard item={a} large />
              </div>
            ))}
            <Pagination page={meta.page || params.page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <div className="sticky top-1/2 flex -translate-y-1/2 flex-col items-center gap-3">
          <button onClick={() => move(-1)} disabled={index === 0} className="text-primary-700 transition hover:scale-110 disabled:opacity-30" aria-label="Previous announcement">
            <FiChevronUp className="h-12 w-12" strokeWidth={3} />
          </button>
          <span className="text-xs font-semibold text-gray-500">
            {rows.length ? index + 1 : 0}/{rows.length}
          </span>
          <button
            onClick={() => move(1)}
            disabled={index >= rows.length - 1}
            className="text-primary-700 transition hover:scale-110 disabled:opacity-30"
            aria-label="Next announcement"
          >
            <FiChevronDown className="h-12 w-12" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
