import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiChevronLeft, FiChevronRight, FiVolume2 } from 'react-icons/fi';
import api from '../../utils/api';

const AUTOPLAY_MS = 6000;
const CATEGORY_EMOJI = { health: '🩺', safety: '⚠️', emergency: '🚨', event: '📅', infrastructure: '🛠️', general: '📢' };

/** Landing-page announcements carousel (panel revision): swipeable, auto-advancing, one card per view on phones. */
const AnnouncementCarousel = () => {
  const [items, setItems] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const track = useRef(null);

  useEffect(() => {
    api
      .get('/announcements', { params: { limit: 8, sort: '-isPinned,-createdAt' } })
      .then(({ data }) => setItems(data.data))
      .catch(() => setItems([]));
  }, []);

  const goTo = useCallback(
    (i) => {
      const el = track.current;
      if (!el || !items?.length) return;
      const next = (i + items.length) % items.length;
      el.scrollTo({ left: el.children[next]?.offsetLeft - el.offsetLeft, behavior: 'smooth' });
      setIndex(next);
    },
    [items]
  );

  useEffect(() => {
    if (paused || !items || items.length < 2) return undefined;
    const timer = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, items, index, goTo]);

  // Keeps the dots in sync when the resident swipes the track by hand.
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const width = el.children[0]?.offsetWidth || 1;
    setIndex(Math.round(el.scrollLeft / width));
  };

  if (items === null) return <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  if (!items.length) return <p className="card p-8 text-center text-sm text-gray-400">No announcements yet.</p>;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div ref={track} onScroll={onScroll} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((a, i) => (
          <Link
            key={a._id}
            to={`/announcements/${a._id}`}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}: ${a.title}`}
            className="card card-hover group flex w-full shrink-0 snap-start flex-col overflow-hidden sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
          >
            {a.coverImage?.url ? (
              <img src={a.coverImage.url} alt="" loading="lazy" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-primary-600 text-5xl">
                <span aria-hidden="true">{CATEGORY_EMOJI[a.category] || '📢'}</span>
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                {a.isPinned ? 'Important · ' : ''}
                {a.category || 'general'}
              </p>
              <h3 className="mt-1 line-clamp-2 font-display font-bold group-hover:text-primary-700 dark:group-hover:text-primary-400">{a.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">{a.content.replace(/#[\p{L}\p{N}_]+/gu, '').trim()}</p>
              <p className="mt-auto pt-3 text-xs text-gray-400">Posted {format(new Date(a.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </Link>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={() => goTo(index - 1)} className="rounded-full border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800" aria-label="Previous announcement">
            <FiChevronLeft />
          </button>
          <div className="flex gap-1.5">
            {items.map((a, i) => (
              <button
                key={a._id}
                onClick={() => goTo(i)}
                aria-label={`Go to announcement ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-primary-600' : 'w-2 bg-gray-300 dark:bg-gray-600'}`}
              />
            ))}
          </div>
          <button onClick={() => goTo(index + 1)} className="rounded-full border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800" aria-label="Next announcement">
            <FiChevronRight />
          </button>
          <Link to="/announcements" className="ml-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-400">
            <FiVolume2 /> View all
          </Link>
        </div>
      )}
    </div>
  );
};

export default AnnouncementCarousel;
