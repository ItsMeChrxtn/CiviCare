import { useEffect, useState } from 'react';
import { FiPhoneCall, FiDroplet, FiWind, FiActivity, FiAlertOctagon, FiCheckSquare, FiMap } from 'react-icons/fi';
import { GiFire } from 'react-icons/gi';
import api from '../../utils/api';
import HazardMap from '../../components/map/HazardMap';

const GUIDES = [
  {
    key: 'flood',
    icon: FiDroplet,
    title: 'Flood Guide',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
    tips: [
      'Move to higher ground immediately when water starts rising.',
      'Turn off electricity and gas at the main switch/valve.',
      'Avoid walking or driving through floodwaters.',
      'Keep an emergency go-bag ready with essentials.',
      'Monitor official announcements for evacuation orders.',
    ],
  },
  {
    key: 'fire',
    icon: GiFire,
    title: 'Fire Guide',
    color: 'text-red-600 bg-red-50 dark:bg-red-500/10',
    tips: [
      'Alert neighbors and call the fire department immediately.',
      'Stay low to avoid smoke inhalation while evacuating.',
      'Never use elevators during a fire emergency.',
      'Feel doors before opening - do not open if hot.',
      'Have a designated meeting point outside your home.',
    ],
  },
  {
    key: 'earthquake',
    icon: FiActivity,
    title: 'Earthquake Guide',
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10',
    tips: [
      'Drop, Cover, and Hold On during shaking.',
      'Stay away from windows, mirrors, and heavy furniture.',
      'If outdoors, move to an open area away from buildings.',
      'After shaking stops, check for injuries and hazards.',
      'Be prepared for aftershocks.',
    ],
  },
  {
    key: 'typhoon',
    icon: FiWind,
    title: 'Typhoon Guide',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
    tips: [
      'Secure loose items outdoors that could be blown away.',
      'Stock up on food, water, and flashlight batteries.',
      'Stay indoors and away from windows during the storm.',
      'Charge phones and power banks before the storm hits.',
      'Follow evacuation orders from barangay officials.',
    ],
  },
];

const CHECKLIST_ITEMS = [
  'Emergency go-bag prepared (food, water, first aid)',
  'Flashlight and extra batteries ready',
  'Important documents in a waterproof container',
  'Emergency contact numbers saved/written down',
  'Family emergency meeting point identified',
  'Fire extinguisher accessible and functional',
  'Evacuation route from home identified',
  'Battery-powered or hand-crank radio available',
];

const EmergencyHub = () => {
  const [hotlines, setHotlines] = useState([]);
  const [checked, setChecked] = useState(() => JSON.parse(localStorage.getItem('civicare-checklist') || '{}'));

  useEffect(() => {
    api.get('/hotlines').then(({ data }) => setHotlines(data.data));
  }, []);

  const toggleItem = (item) => {
    const next = { ...checked, [item]: !checked[item] };
    setChecked(next);
    localStorage.setItem('civicare-checklist', JSON.stringify(next));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="badge bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">
          <FiAlertOctagon /> Emergency Hub
        </span>
        <h1 className="mt-4 text-4xl font-extrabold">Be Prepared, Stay Safe</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Disaster guides, hotline directory, and evacuation map for your barangay.</p>
      </div>

      {/* Guides */}
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <div key={g.key} className="card p-6">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${g.color}`}>
              <g.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-lg font-bold">{g.title}</h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              {g.tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Hotlines */}
      <div className="mt-14">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold"><FiPhoneCall /> Hotline Directory</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotlines.map((h) => (
            <a key={h._id} href={`tel:${h.number}`} className="card flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div>
                <p className="font-semibold">{h.name}</p>
                <p className="text-xs text-gray-400">{h.availability}</p>
              </div>
              <span className="font-bold text-primary-600">{h.number}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Evacuation Map */}
      <div className="mt-14">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold"><FiMap /> Interactive Evacuation Map</h2>
        <HazardMap />
      </div>

      {/* Safety Checklist */}
      <div className="mt-14">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold"><FiCheckSquare /> Household Safety Checklist</h2>
        <div className="card grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label key={item} className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                checked={!!checked[item]}
                onChange={() => toggleItem(item)}
                className="h-4 w-4 rounded accent-primary-600"
              />
              <span className={`text-sm ${checked[item] ? 'text-gray-400 line-through' : ''}`}>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmergencyHub;
