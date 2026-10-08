import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import { CardSkeleton } from '../../components/common/Skeleton';

/** Events & Activities (docu Figure 11): this month's events as large date cards. */
const Events = () => {
  const { t } = usePreferences();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState(null);

  useEffect(() => {
    setEvents(null);
    api
      .get('/events', {
        params: {
          'startDate[gte]': startOfMonth(month).toISOString(),
          'startDate[lte]': endOfMonth(month).toISOString(),
          sort: 'startDate',
          limit: 50,
        },
      })
      .then(({ data }) => setEvents(data.data.filter((e) => e.status !== 'cancelled')))
      .catch(() => setEvents([]));
  }, [month]);

  const monthName = useMemo(() => format(month, 'MMMM'), [month]);

  return (
    <div className="rounded-2xl bg-white/60 p-4 dark:bg-gray-900/40 sm:p-6">
      <div className="mb-6 flex items-center justify-center gap-4">
        <button onClick={() => setMonth((m) => addMonths(m, -1))} className="rounded-full p-2 hover:bg-black/5" aria-label="Previous month">
          <FiChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="text-center">
          <span className="font-display text-4xl font-light text-gray-800 dark:text-gray-100">{monthName} </span>
          <span className="font-display text-3xl font-extrabold tracking-wide text-primary-800 dark:text-primary-300">{t('events.upcoming')}</span>
        </h2>
        <button onClick={() => setMonth((m) => addMonths(m, 1))} className="rounded-full p-2 hover:bg-black/5" aria-label="Next month">
          <FiChevronRight className="h-6 w-6" />
        </button>
      </div>

      {events === null ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : events.length === 0 ? (
        <p className="py-16 text-center text-gray-400">{t('events.none')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
          {events.map((e) => (
            <Link key={e._id} to={`/resident/events/${e._id}`} className="group block rounded-xl p-2 transition hover:bg-white dark:hover:bg-gray-900">
              <div className="flex items-start justify-between gap-3">
                <div className="font-display leading-none text-red-600">
                  <p className="text-2xl font-extrabold uppercase">{format(new Date(e.startDate), 'MMMM')}</p>
                  <p className="text-6xl font-extrabold">{format(new Date(e.startDate), 'd')}</p>
                </div>
                {e.coverImage?.url && <img src={e.coverImage.url} alt="" loading="lazy" className="h-24 w-32 rounded-lg object-cover" />}
              </div>
              <h3 className="mt-2 font-display text-xl font-bold text-gray-900 group-hover:text-primary-700 dark:text-gray-50">{e.title}</h3>
              <p className="text-sm">
                <span className="font-semibold">{t('events.venue')}:</span> {e.location}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{t('events.details')}:</span> {e.description}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {format(new Date(e.startDate), 'EEE, h:mm a')} – {format(new Date(e.endDate), 'h:mm a')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
