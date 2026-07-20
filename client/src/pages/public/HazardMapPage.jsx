import HazardMap from '../../components/map/HazardMap';

const HazardMapPage = () => (
  <div className="mx-auto max-w-6xl animate-fadeIn px-4 py-16 lg:px-8">
    <div className="mx-auto max-w-2xl text-center">
      <span className="section-eyebrow">Hazard Map</span>
      <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Barangay Hazard & Risk Map</h1>
      <p className="mt-4 text-gray-500 dark:text-gray-400">
        Explore flood zones, fire hazards, danger areas, road closures, evacuation centers, and safe areas within the barangay.
      </p>
    </div>

    <div className="mt-12 overflow-hidden rounded-2xl border border-gray-100 shadow-card dark:border-gray-800">
      <HazardMap height="32rem" />
    </div>
  </div>
);

export default HazardMapPage;
