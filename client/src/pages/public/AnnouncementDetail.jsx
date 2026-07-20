import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../../utils/api';
import PageLoader from '../../components/common/PageLoader';

const AnnouncementDetail = () => {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    api.get(`/announcements/${id}`).then(({ data }) => setAnnouncement(data.data));
  }, [id]);

  if (!announcement) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <Link to="/announcements" className="mb-6 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
        <FiArrowLeft /> Back to Announcements
      </Link>

      {announcement.coverImage?.url && (
        <img src={announcement.coverImage.url} alt={announcement.title} className="mb-6 w-full rounded-2xl object-cover" style={{ maxHeight: 360 }} />
      )}

      <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 capitalize">{announcement.category}</span>
      <h1 className="mt-3 text-3xl font-extrabold">{announcement.title}</h1>
      <p className="mt-2 text-sm text-gray-400">
        {format(new Date(announcement.createdAt), 'MMMM d, yyyy')} • Posted by {announcement.postedBy?.firstName} {announcement.postedBy?.lastName}
      </p>
      <div className="prose prose-gray dark:prose-invert mt-6 max-w-none whitespace-pre-line text-gray-600 dark:text-gray-300">
        {announcement.content}
      </div>
    </div>
  );
};

export default AnnouncementDetail;
