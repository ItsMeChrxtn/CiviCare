import HazardMap from '../../components/map/HazardMap';

const HazardMapPage = () => (
  <div className="mx-auto max-w-6xl animate-fadeIn px-4 py-16 lg:px-8">
    <div className="mx-auto max-w-2xl text-center">
      <span className="section-eyebrow">Evacuation Map</span>
      <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Interactive Evacuation Map</h1>
      <p className="mt-4 text-gray-500 dark:text-gray-400">
        Find evacuation centers, evacuation routes, safe areas, and emergency facilities within the barangay.
      </p>
    </div>

    <div className="mt-12 overflow-hidden rounded-2xl border border-gray-100 shadow-card dark:border-gray-800">
      <HazardMap height="32rem" />
    </div>
  </div>
);

export default HazardMapPage;
