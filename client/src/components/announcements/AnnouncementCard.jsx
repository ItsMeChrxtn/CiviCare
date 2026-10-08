import { formatDistanceToNow } from 'date-fns';
import { FiClock, FiMapPin } from 'react-icons/fi';
import { usePreferences } from '../../contexts/PreferencesContext';

const CATEGORY_EMOJI = { health: '🩺', safety: '⚠️', emergency: '🚨', event: '📅', infrastructure: '🛠️', general: '📢' };

/** Social-feed style post used on the resident dashboard and Announcements page (docu Figures 6 & 8). */
const AnnouncementCard = ({ item, large = false }) => {
  const { t } = usePreferences();
  const tags = item.content.match(/#[\p{L}\p{N}_]+/gu) || [];
  const body = item.content.replace(/#[\p{L}\p{N}_]+/gu, '').trim();

  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-card dark:bg-gray-900">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-bold">{t('dash.feed')}</p>
          {item.isPinned && <FiMapPin className="h-3.5 w-3.5 text-primary-600" aria-label="Pinned" />}
        </div>
        <p className="flex items-center gap-1 text-[11px] text-gray-400">
          <FiClock className="h-3 w-3" /> {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </p>
        <p className={`mt-2 whitespace-pre-line text-gray-800 dark:text-gray-200 ${large ? 'text-base' : 'text-[13px]'}`}>
          <span aria-hidden="true">{CATEGORY_EMOJI[item.category] || '📢'} </span>
          <span className="font-semibold uppercase">{item.title}:</span> {body}
        </p>
        {tags.length > 0 && <p className="mt-2 text-xs font-medium text-blue-700 dark:text-blue-400">{tags.join(' ')}</p>}
      </div>
      {item.coverImage?.url && (
        <img src={item.coverImage.url} alt="" loading="lazy" className={`w-full object-cover ${large ? 'max-h-[28rem]' : 'h-44'}`} />
      )}
    </article>
  );
};

export default AnnouncementCard;
