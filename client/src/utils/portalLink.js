/**
 * Notification links are stored as public routes (/events/:id, /announcements/:id).
 * Rewrites them so signed-in users stay inside their own portal layout.
 */
const portalLink = (link, role) => {
  if (!link) return link;
  if (role === 'resident') {
    const event = link.match(/^\/events\/([^/?#]+)$/);
    if (event) return `/resident/events/${event[1]}`;
    const announcement = link.match(/^\/announcements\/([^/?#]+)$/);
    if (announcement) return `/resident/announcements?focus=${announcement[1]}`;
    if (link.startsWith('/resident/feedback/')) return '/resident/feedback';
    return link;
  }
  if (role === 'official' || role === 'admin') {
    if (/^\/events\/[^/?#]+$/.test(link)) return '/official/events';
    if (/^\/announcements\/[^/?#]+$/.test(link)) return '/official/announcements';
  }
  return link;
};

export default portalLink;
