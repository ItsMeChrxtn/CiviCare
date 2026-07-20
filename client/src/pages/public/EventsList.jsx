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
    <div className="mx-auto max-w-6xl animate-fadeIn px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">Community Events</span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Upcoming Barangay Events</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Join community activities, drills, and programs. Log in to register and earn certificates.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : rows.map((e) => (
              <Link key={e._id} to={`/events/${e._id}`} className="card card-hover group overflow-hidden">
                {e.coverImage?.url ? (
                  <div className="h-40 w-full overflow-hidden">
                    <img src={e.coverImage.url} alt={e.title} className="h-40 w-full object-cover transition duration-300 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 text-primary-300 dark:from-primary-500/10 dark:to-primary-500/5 dark:text-primary-500/40">
                    <FiCalendar className="h-8 w-8" />
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{e.category?.replace(/_/g, ' ')}</span>
                    <Badge status={e.status} />
                  </div>
                  <h3 className="mb-2 line-clamp-2 font-display font-bold tracking-tight">{e.title}</h3>
                  <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"><FiCalendar /> {format(new Date(e.startDate), 'MMM d, yyyy, h:mm a')}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"><FiMapPin /> {e.location}</p>
                </div>
              </Link>
            ))}
      </div>

      {!isLoading && !rows.length && <EmptyState title="No upcoming events" message="Check back soon for community activities and programs." />}
      <div className="mt-8">
        <Pagination page={meta.page || params.page} totalPages={meta.totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default EventsList;
