import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import api from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import { CardSkeleton } from '../../components/common/Skeleton';

const WEEKDAYS = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], tl: ['Lin', 'Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab'] };

// An event lands on every calendar day from its start date to its end date.
const occursOn = (e, day) => {
  const start = new Date(e.startDate);
  const end = new Date(e.endDate || e.startDate);
  return isSameDay(day, start) || (day >= start && day <= end);
};

/**
 * Events & Activities (panel revision): a month calendar with every event listed below it.
 * Tapping a date shows only that day's events; tapping it again shows the whole month.
 */
const Events = () => {
  const { t, lang } = usePreferences();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState(null);

  useEffect(() => {
    setEvents(null);
    setSelected(null);
    api
      .get('/events', {
        params: {
          'startDate[lte]': endOfMonth(month).toISOString(),
          'endDate[gte]': startOfMonth(month).toISOString(),
          sort: 'startDate',
          limit: 100,
        },
      })
      .then(({ data }) => setEvents(data.data.filter((e) => e.status !== 'cancelled')))
      .catch(() => setEvents([]));
  }, [month]);

  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) }), [month]);
  const shown = selected ? (events || []).filter((e) => occursOn(e, selected)) : events || [];

  return (
    <div className="space-y-6">
      <section className="card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button onClick={() => setMonth((m) => addMonths(m, -1))} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Previous month">
            <FiChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-xl font-extrabold sm:text-2xl">{format(month, 'MMMM yyyy')}</h2>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Next month">
            <FiChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {(WEEKDAYS[lang] || WEEKDAYS.en).map((d) => (
            <div key={d} className="py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const count = (events || []).filter((e) => occursOn(e, day)).length;
            const inMonth = isSameMonth(day, month);
            const active = selected && isSameDay(day, selected);
            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={!inMonth}
                onClick={() => setSelected(active ? null : day)}
                aria-pressed={!!active}
                aria-label={`${format(day, 'MMMM d')}${count ? `, ${count} event(s)` : ''}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition sm:aspect-auto sm:h-16 ${
                  !inMonth
                    ? 'text-gray-300 dark:text-gray-700'
                    : active
                    ? 'bg-primary-600 font-bold text-white'
                    : isToday(day)
                    ? 'bg-primary-50 font-bold text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/10 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {format(day, 'd')}
                {inMonth && count > 0 && (
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : 'bg-red-500'}`} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">
            {selected ? t('events.on', { date: format(selected, 'MMMM d, yyyy') }) : t('events.allMonth', { month: format(month, 'MMMM') })}
          </h2>
          {selected && (
            <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm font-semibold text-primary-700 dark:text-primary-400">
              <FiX /> {t('events.showAll')}
            </button>
          )}
        </div>

        {events === null ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : shown.length === 0 ? (
          <p className="card py-12 text-center text-sm text-gray-400">{selected ? t('events.noneDay') : t('events.none')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {shown.map((e) => (
              <Link key={e._id} to={`/resident/events/${e._id}`} className="card card-hover flex gap-4 p-4">
                <div className="w-14 shrink-0 text-center font-display leading-none text-red-600">
                  <p className="text-xs font-extrabold uppercase">{format(new Date(e.startDate), 'MMM')}</p>
                  <p className="text-3xl font-extrabold">{format(new Date(e.startDate), 'd')}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-gray-900 dark:text-gray-50">{e.title}</h3>
                  <p className="text-xs text-gray-500">
                    {format(new Date(e.startDate), 'EEE, h:mm a')} – {format(new Date(e.endDate), 'h:mm a')}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">{t('events.venue')}:</span> {e.location}
                  </p>
                  <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{e.description}</p>
                </div>
                {e.coverImage?.url && <img src={e.coverImage.url} alt="" loading="lazy" className="hidden h-20 w-24 shrink-0 rounded-lg object-cover sm:block" />}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Events;
