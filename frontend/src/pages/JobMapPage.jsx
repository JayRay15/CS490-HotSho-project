/**
 * JobMapPage - Interactive map view of tracked jobs
 * Displays jobs on a map with commute calculations and filtering
 */

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  Home,
  Navigation,
  Filter,
  RefreshCw,
  Clock,
  Car,
  Train,
  Bike,
  Footprints,
  Building2,
  Globe,
  Monitor,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPinned,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getJobsWithLocations,
  geocodeAllJobs,
  setHomeLocation,
  getHomeLocation,
  compareJobLocations,
} from "../api/jobLocation";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const homeIcon = createCustomIcon("#10B981"); // Green
const jobIcons = {
  Interested: createCustomIcon("#3B82F6"), // Blue
  Applied: createCustomIcon("#8B5CF6"), // Purple
  "Phone Screen": createCustomIcon("#F59E0B"), // Yellow
  Interview: createCustomIcon("#EC4899"), // Pink
  Offer: createCustomIcon("#10B981"), // Green
  Rejected: createCustomIcon("#EF4444"), // Red
};

// Component to fit map bounds to markers
const FitBounds = ({ jobs, homeLocation }) => {
  const map = useMap();

  useEffect(() => {
    const points = [];

    if (homeLocation?.coordinates) {
      points.push([homeLocation.coordinates.lat, homeLocation.coordinates.lng]);
    }

    jobs.forEach((job) => {
      if (job.coordinates?.lat) {
        points.push([job.coordinates.lat, job.coordinates.lng]);
      }
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [jobs, homeLocation, map]);

  return null;
};

const JobMapPage = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  // State
  const [jobs, setJobs] = useState([]);
  const [homeLocation, setHomeLocationState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [settingHome, setSettingHome] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [homeAddress, setHomeAddress] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedJobsForComparison, setSelectedJobsForComparison] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    workMode: "",
    status: "",
    maxDistance: "",
    maxCommuteTime: "",
  });

  // Load data on mount
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadData();
    }
  }, [isLoaded, isSignedIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsResponse, homeResponse] = await Promise.all([
        getJobsWithLocations(
          {
            workMode: filters.workMode || undefined,
            status: filters.status || undefined,
            maxDistance: filters.maxDistance || undefined,
            maxCommuteTime: filters.maxCommuteTime || undefined,
          },
          getToken
        ),
        getHomeLocation(getToken),
      ]);

      console.log("Jobs response:", jobsResponse);
      console.log("Home response:", homeResponse);

      if (jobsResponse.success) {
        setJobs(jobsResponse.data.jobs);
        // Also update home location from jobs response if available
        if (jobsResponse.data.homeLocation) {
          setHomeLocationState(jobsResponse.data.homeLocation);
        }
      }

      if (homeResponse.success && homeResponse.data) {
        setHomeLocationState(homeResponse.data);
      }
    } catch (error) {
      console.error("Error loading job locations:", error);
      toast.error("Failed to load job locations");
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs by commute time (client-side) - now also handled server-side
  const filteredJobs = useMemo(() => {
    // Server already filters, but keep client-side filter as backup
    return jobs;
  }, [jobs]);

  // Jobs with coordinates for map display
  const mappableJobs = useMemo(() => {
    return filteredJobs.filter((job) => job.coordinates?.lat);
  }, [filteredJobs]);

  // Handle geocode all jobs
  const handleGeocodeAll = async () => {
    try {
      setGeocoding(true);
      const response = await geocodeAllJobs(getToken);

      if (response.success) {
        toast.success(
          `Geocoded ${response.data.geocodedCount} jobs. ${response.data.failedCount} failed.`
        );
        loadData();
      }
    } catch (error) {
      console.error("Error geocoding jobs:", error);
      toast.error("Failed to geocode jobs");
    } finally {
      setGeocoding(false);
    }
  };

  // Handle set home location
  const handleSetHomeLocation = async () => {
    if (!homeAddress.trim()) {
      toast.error("Please enter an address");
      return;
    }

    try {
      setSettingHome(true);
      console.log("Saving home address:", homeAddress);
      const response = await setHomeLocation(homeAddress, getToken);
      console.log("Home location response:", response);

      if (response.success) {
        setHomeLocationState(response.data);
        setShowHomeModal(false);
        setHomeAddress("");
        toast.success("Home location set successfully");
        loadData(); // Reload to get updated commute calculations
      } else {
        toast.error(response.message || "Failed to set home location");
      }
    } catch (error) {
      console.error("Error setting home location:", error);
      console.error("Error response:", error.response);
      toast.error(error.response?.data?.message || "Failed to set home location");
    } finally {
      setSettingHome(false);
    }
  };

  // Handle job comparison
  const handleCompareJobs = async () => {
    if (selectedJobsForComparison.length < 2) {
      toast.error("Select at least 2 jobs to compare");
      return;
    }

    try {
      const response = await compareJobLocations(selectedJobsForComparison, getToken);

      if (response.success) {
        setComparisonData(response.data);
        setShowComparison(true);
      }
    } catch (error) {
      console.error("Error comparing jobs:", error);
      toast.error(error.response?.data?.message || "Failed to compare jobs");
    }
  };

  // Toggle job selection for comparison
  const toggleJobSelection = (jobId) => {
    setSelectedJobsForComparison((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  // Get work mode icon
  const getWorkModeIcon = (workMode) => {
    switch (workMode) {
      case "Remote":
        return <Globe className="h-4 w-4" />;
      case "Hybrid":
        return <Monitor className="h-4 w-4" />;
      case "On-site":
        return <Building2 className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (homeLocation?.coordinates) {
      return [homeLocation.coordinates.lat, homeLocation.coordinates.lng];
    }
    if (mappableJobs.length > 0) {
      return [mappableJobs[0].coordinates.lat, mappableJobs[0].coordinates.lng];
    }
    return [39.8283, -98.5795]; // Center of USA
  }, [homeLocation, mappableJobs]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please sign in to view the job map.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPinned className="h-6 w-6 text-blue-500" />
            Job Location Map
          </h1>
          <p className="text-gray-600 mt-1">
            View your tracked jobs on an interactive map with commute calculations
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowHomeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Home className="h-4 w-4" />
            {homeLocation ? "Update Home" : "Set Home Location"}
          </button>

          <button
            onClick={handleGeocodeAll}
            disabled={geocoding}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {geocoding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Geocode All Jobs
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
              <select
                value={filters.workMode}
                onChange={(e) => setFilters({ ...filters, workMode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="Interested">Interested</option>
                <option value="Applied">Applied</option>
                <option value="Phone Screen">Phone Screen</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Distance (km)
              </label>
              <input
                type="number"
                value={filters.maxDistance}
                onChange={(e) => setFilters({ ...filters, maxDistance: e.target.value })}
                placeholder="e.g., 50"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Commute Time (min)
              </label>
              <input
                type="number"
                value={filters.maxCommuteTime}
                onChange={(e) => setFilters({ ...filters, maxCommuteTime: e.target.value })}
                placeholder="e.g., 45"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setFilters({ workMode: "", status: "", maxDistance: "", maxCommuteTime: "" });
                loadData();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500">Total Jobs</div>
          <div className="text-2xl font-bold text-gray-900">{filteredJobs.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500">On Map</div>
          <div className="text-2xl font-bold text-blue-600">{mappableJobs.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500">Need Geocoding</div>
          <div className="text-2xl font-bold text-yellow-600">
            {filteredJobs.length - mappableJobs.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500">Home Set</div>
          <div className="text-2xl font-bold text-green-600">
            {homeLocation ? "Yes" : "No"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-[500px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={10}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitBounds jobs={mappableJobs} homeLocation={homeLocation} />

                {/* Home marker */}
                {homeLocation?.coordinates && (
                  <Marker
                    position={[homeLocation.coordinates.lat, homeLocation.coordinates.lng]}
                    icon={homeIcon}
                  >
                    <Popup>
                      <div className="font-medium">🏠 Home</div>
                      <div className="text-sm text-gray-600">
                        {homeLocation.displayName || homeLocation.address}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Job markers */}
                {mappableJobs.map((job) => (
                  <Marker
                    key={job._id}
                    position={[job.coordinates.lat, job.coordinates.lng]}
                    icon={jobIcons[job.status] || jobIcons.Interested}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-600">{job.company}</div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          {getWorkModeIcon(job.workMode)}
                          <span>{job.workMode || "Not specified"}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {job.location}
                        </div>
                        {job.commuteDetails && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm">
                              <Car className="h-4 w-4 text-blue-500" />
                              <span>
                                {job.commuteDetails.estimates.driving.timeFormatted} (
                                {job.commuteDetails.distance.miles} mi)
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              job.status === "Offer"
                                ? "bg-green-100 text-green-800"
                                : job.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : job.status === "Interview"
                                ? "bg-pink-100 text-pink-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Job List Sidebar */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium text-gray-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Jobs List
            </h2>
            {selectedJobsForComparison.length > 0 && (
              <button
                onClick={handleCompareJobs}
                className="mt-2 w-full px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
              >
                Compare Selected ({selectedJobsForComparison.length})
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {filteredJobs.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No jobs found. Add jobs to see them on the map.
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job._id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    selectedJobsForComparison.includes(job._id) ? "bg-purple-50" : ""
                  } ${selectedJobForDetails?._id === job._id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}`}
                  onClick={() => setSelectedJobForDetails(selectedJobForDetails?._id === job._id ? null : job)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-600">{job.company}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {getWorkModeIcon(job.workMode)}
                        <span className="text-xs text-gray-500">
                          {job.workMode || "Not specified"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {job.coordinates?.lat ? (
                        <MapPin className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      {selectedJobsForComparison.includes(job._id) && (
                        <Check className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                  </div>
                  {job.commuteDetails && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {job.commuteDetails.estimates.driving.timeFormatted}
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        {job.commuteDetails.distance.miles} mi
                      </div>
                    </div>
                  )}
                  
                  {/* Expanded commute details when job is selected */}
                  {selectedJobForDetails?._id === job._id && job.commuteDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">Commute Details from Home</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <Car className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium text-blue-900">Driving</div>
                            <div className="text-blue-700">{job.commuteDetails.estimates.driving.timeFormatted}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <Train className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium text-green-900">Transit</div>
                            <div className="text-green-700">{job.commuteDetails.estimates.transit.timeFormatted}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                          <Bike className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium text-orange-900">Cycling</div>
                            <div className="text-orange-700">{job.commuteDetails.estimates.cycling.timeFormatted}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                          <Footprints className="h-4 w-4 text-purple-600" />
                          <div>
                            <div className="font-medium text-purple-900">Walking</div>
                            <div className="text-purple-700">{job.commuteDetails.estimates.walking.timeFormatted}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-gray-100 rounded text-center">
                        <span className="font-medium text-gray-900">{job.commuteDetails.distance.miles} miles</span>
                        <span className="text-gray-600"> ({job.commuteDetails.distance.km} km)</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleJobSelection(job._id);
                        }}
                        className={`mt-2 w-full py-1 text-xs rounded ${
                          selectedJobsForComparison.includes(job._id)
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {selectedJobsForComparison.includes(job._id) ? "✓ Selected for Comparison" : "Add to Comparison"}
                      </button>
                    </div>
                  )}
                  
                  {/* Message when no home location or commute data */}
                  {selectedJobForDetails?._id === job._id && !job.commuteDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 text-center p-2 bg-yellow-50 rounded">
                        {!homeLocation ? (
                          <span>Set your home location to see commute times</span>
                        ) : !job.coordinates?.lat ? (
                          <span>Job location needs geocoding to calculate commute</span>
                        ) : (
                          <span>Unable to calculate commute details</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-medium text-gray-900 mb-3">Map Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
            <span className="text-sm text-gray-600">Home</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
            <span className="text-sm text-gray-600">Interested</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow"></div>
            <span className="text-sm text-gray-600">Applied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow"></div>
            <span className="text-sm text-gray-600">Phone Screen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow"></div>
            <span className="text-sm text-gray-600">Interview</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
            <span className="text-sm text-gray-600">Offer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
            <span className="text-sm text-gray-600">Rejected</span>
          </div>
        </div>
      </div>

      {/* Home Location Modal */}
      {showHomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Home className="h-5 w-5 text-green-500" />
                Set Home Location
              </h2>
              <button
                onClick={() => setShowHomeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Enter your home address to calculate commute times to each job location.
            </p>

            <input
              type="text"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder="e.g., 123 Main St, New York, NY 10001"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
            />

            {homeLocation && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Current home location:</div>
                <div className="text-sm font-medium text-gray-900">
                  {homeLocation.displayName || homeLocation.address}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSetHomeLocation}
                disabled={settingHome || !homeAddress.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {settingHome ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Location
              </button>
              <button
                onClick={() => setShowHomeModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && comparisonData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Location Comparison
              </h2>
              <button
                onClick={() => {
                  setShowComparison(false);
                  setComparisonData(null);
                  setSelectedJobsForComparison([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonData.jobs.map((job, index) => (
                  <div
                    key={job._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="font-medium text-gray-900">{job.title}</div>
                    <div className="text-sm text-gray-600 mb-2">{job.company}</div>

                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      {getWorkModeIcon(job.workMode)}
                      <span>{job.workMode || "Not specified"}</span>
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      {job.location}
                    </div>

                    {job.commuteDetails ? (
                      <div className="space-y-2 border-t pt-3">
                        <div className="text-sm font-medium text-gray-700">Commute Times</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3 text-blue-500" />
                            {job.commuteDetails.estimates.driving.timeFormatted}
                          </div>
                          <div className="flex items-center gap-1">
                            <Train className="h-3 w-3 text-green-500" />
                            {job.commuteDetails.estimates.transit.timeFormatted}
                          </div>
                          <div className="flex items-center gap-1">
                            <Bike className="h-3 w-3 text-yellow-500" />
                            {job.commuteDetails.estimates.cycling.timeFormatted}
                          </div>
                          <div className="flex items-center gap-1">
                            <Footprints className="h-3 w-3 text-purple-500" />
                            {job.commuteDetails.estimates.walking.timeFormatted}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Distance: {job.commuteDetails.distance.miles} mi (
                          {job.commuteDetails.distance.km} km)
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Location not geocoded
                      </div>
                    )}

                    {job.timezoneDiff !== null && job.timezoneDiff !== 0 && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {job.timezoneDiff > 0 ? "+" : ""}
                        {job.timezoneDiff}h timezone difference
                      </div>
                    )}

                    {/* Rank badge */}
                    <div className="mt-3 pt-2 border-t">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          index === 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {index === 0
                          ? "🏆 Shortest Commute"
                          : `#${index + 1} by commute`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMapPage;
