import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiEye } from 'react-icons/fi';
import { BsPinAngleFill } from 'react-icons/bs';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const AnnouncementsList = () => {
  const { rows, meta, params, setPage, isLoading } = usePaginatedFetch('/announcements', { limit: 9 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">Announcements</span>
        <h1 className="mt-4 text-4xl font-extrabold">Barangay News & Updates</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Stay informed on the latest news, advisories, and updates from your barangay.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : rows.map((a) => (
              <Link key={a._id} to={`/announcements/${a._id}`} className="card overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                {a.coverImage?.url && <img src={a.coverImage.url} alt={a.title} className="h-40 w-full object-cover" />}
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    {a.isPinned && <BsPinAngleFill className="h-3.5 w-3.5 text-amber-500" />}
                    <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{a.category}</span>
                  </div>
                  <h3 className="mb-1 line-clamp-2 font-bold">{a.title}</h3>
                  <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{a.content}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>{format(new Date(a.createdAt), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1"><FiEye /> {a.views}</span>
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {!isLoading && !rows.length && <EmptyState title="No announcements yet" />}
      <div className="mt-8">
        <Pagination page={meta.page || params.page} totalPages={meta.totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default AnnouncementsList;
