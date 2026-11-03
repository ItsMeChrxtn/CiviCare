import { FiAlertOctagon, FiCheckCircle, FiHelpCircle, FiUsers } from 'react-icons/fi';

// Report verification algorithm result (server: services/incidentVerification.service.js).
const STATUS = {
  likely_valid: { label: 'Likely valid', icon: FiCheckCircle, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  needs_review: { label: 'Needs review', icon: FiHelpCircle, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  suspicious: { label: 'Possibly false', icon: FiAlertOctagon, cls: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
};

/** Officials-only: how many residents reported the incident nearby and the report's credibility score. */
const ReportCredibility = ({ incident, detailed = false }) => {
  const v = incident.verification;
  const style = STATUS[v?.status] || STATUS.likely_valid;
  const count = incident.reportCount || 1;

  return (
    <div className={detailed ? 'space-y-2' : 'flex flex-wrap gap-1'}>
      <div className="flex flex-wrap gap-1">
        <span
          className={`badge ${incident.isValidated ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
          title="Reports of the same kind within 150 m in the last 24 hours, from different residents. 3 reports = validated."
        >
          <FiUsers /> {count} {count === 1 ? 'report' : 'reports'}
          {incident.isValidated && ' · Validated'}
        </span>
        {v && (
          <span className={`badge ${style.cls}`} title={v.flags?.join('\n') || 'No issues found'}>
            <style.icon /> {style.label} ({v.score})
          </span>
        )}
      </div>
      {detailed && v?.flags?.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-gray-500 dark:text-gray-400">
          {v.flags.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReportCredibility;
