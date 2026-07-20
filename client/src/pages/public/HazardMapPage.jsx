import HazardMap from '../../components/map/HazardMap';

const HazardMapPage = () => (
  <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
    <div className="mx-auto max-w-2xl text-center">
      <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">Hazard Map</span>
      <h1 className="mt-4 text-4xl font-extrabold">Barangay Hazard & Risk Map</h1>
      <p className="mt-4 text-gray-500 dark:text-gray-400">
        Explore flood zones, fire hazards, danger areas, road closures, evacuation centers, and safe areas within the barangay.
      </p>
    </div>

    <div className="mt-12">
      <HazardMap height="32rem" />
    </div>
  </div>
);

export default HazardMapPage;
