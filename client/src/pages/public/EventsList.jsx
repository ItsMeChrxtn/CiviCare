import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiMapPin, FiCalendar } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';

const EventsList = () => {
  const { rows, meta, params, setPage, isLoading } = usePaginatedFetch('/events', { limit: 9, sort: 'startDate' });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">Community Events</span>
        <h1 className="mt-4 text-4xl font-extrabold">Upcoming Barangay Events</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Join community activities, drills, and programs. Log in to register and earn certificates.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : rows.map((e) => (
              <Link key={e._id} to={`/events/${e._id}`} className="card overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                {e.coverImage?.url && <img src={e.coverImage.url} alt={e.title} className="h-40 w-full object-cover" />}
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{e.category?.replace(/_/g, ' ')}</span>
                    <Badge status={e.status} />
                  </div>
                  <h3 className="mb-2 line-clamp-2 font-bold">{e.title}</h3>
                  <p className="flex items-center gap-1 text-xs text-gray-400"><FiCalendar /> {format(new Date(e.startDate), 'MMM d, yyyy, h:mm a')}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400"><FiMapPin /> {e.location}</p>
                </div>
              </Link>
            ))}
      </div>

      {!isLoading && !rows.length && <EmptyState title="No upcoming events" />}
      <div className="mt-8">
        <Pagination page={meta.page || params.page} totalPages={meta.totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default EventsList;
