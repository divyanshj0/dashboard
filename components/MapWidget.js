'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { FiMaximize, FiX } from 'react-icons/fi';

// Dynamically import MapContainer and related components with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('react-leaflet').then(mod => mod.Tooltip),
  { ssr: false }
);
const useMap = dynamic(
  () => import('react-leaflet').then(mod => mod.useMap),
  { ssr: false }
);

// Import Leaflet library itself only on the client-side
let L;
if (typeof window !== 'undefined') {
  L = require('leaflet');

  // Fix for default marker icon issues with Webpack - only run on client
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}


// Helper component to update map view (zoom/center/bounds)
function MapUpdater({ bounds, mapInitialized }) {
  const map = useMap();

  useEffect(() => {
    if (map && map.fitBounds && mapInitialized && bounds && bounds.length === 4 && L) {
      // Use a timeout to ensure the map container has the correct size before fitting bounds
      const timeoutId = setTimeout(() => {
        try {
          const southWest = L.latLng(bounds[0], bounds[1]);
          const northEast = L.latLng(bounds[2], bounds[3]);
          const newBounds = L.latLngBounds(southWest, northEast);

          // Only fit bounds if they are valid and represent an actual area (not a single point or invalid range)
          if (newBounds.isValid() && !newBounds.isEmpty()) {
            map.fitBounds(newBounds, { padding: [50, 50], maxZoom: 18 });
          } else {
            console.warn('Invalid or empty bounds calculated, map fitBounds skipped.');
          }
        } catch (e) {
          console.error('Error fitting map bounds:', e);
        }
      }, 500); // Increased delay to 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [map, bounds, mapInitialized]);

  return null;
}

export default function MapWidget({ title = "Device Locations", parameters = [], token }) {
  const [deviceLocations, setDeviceLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  const markerColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#34D399'];

  const createCustomIcon = (color) => {
    if (!L) return null;
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      const fetchedLocations = [];
      let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
      let hasValidLocation = false;

      for (const param of parameters) {
        if (!param.deviceId) continue;

        try {
          const latRes = await fetch('/api/thingsboard/timeseriesdata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, deviceId: param.deviceId, key: 'latitude', limit: 1 }),
          });
          const latData = await latRes.json();
          const latitude = latData?.latitude?.[0]?.value ? parseFloat(latData.latitude[0].value) : null;

          const lonRes = await fetch('/api/thingsboard/timeseriesdata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, deviceId: param.deviceId, key: 'longitude', limit: 1 }),
          });
          const lonData = await lonRes.json();
          const longitude = lonData?.longitude?.[0]?.value ? parseFloat(lonData.longitude[0].value) : null;

          const deviceName = param.name || 'Unknown Device';

          if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
            fetchedLocations.push({ id: param.deviceId, name: deviceName, lat: latitude, lon: longitude });
            minLat = Math.min(minLat, latitude);
            maxLat = Math.max(maxLat, latitude);
            minLon = Math.min(minLon, longitude);
            maxLon = Math.max(maxLon, longitude);
            hasValidLocation = true;
          }
        } catch (error) {
          console.error(`Error fetching location for device ${param.deviceId}:`, error);
        }
      }

      setDeviceLocations(fetchedLocations);

      if (hasValidLocation) {
        if (fetchedLocations.length === 1) {
            const singleLat = fetchedLocations[0].lat;
            const singleLon = fetchedLocations[0].lon;
            setMapBounds([singleLat - 0.001, singleLon - 0.001, singleLat + 0.001, singleLon + 0.001]);
        } else {
            setMapBounds([minLat, minLon, maxLat, maxLon]);
        }
      } else {
        setMapBounds(null);
      }
      setLoading(false);
    };

    if (token && parameters.length > 0) {
      fetchLocations();
    } else {
      setLoading(false);
      setDeviceLocations([]);
      setMapBounds(null);
    }
  }, [parameters, token]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const defaultCenter = [26.9124, 75.7873];
  const defaultZoom = 12;

  const MapContent = ({ fullScreen = false }) => {
    if (!L) {
      return <div className="h-full flex items-center justify-center">Loading map...</div>;
    }

    const initialCenter = mapBounds ? [(mapBounds[0] + mapBounds[2]) / 2, (mapBounds[1] + mapBounds[3]) / 2] : defaultCenter;
    const initialZoom = mapBounds ? defaultZoom : defaultZoom;

    return (
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: fullScreen ? '0' : '8px' }}
        whenReady={() => setMapInitialized(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {deviceLocations.map((device, index) => (
          <Marker
            key={device.id}
            position={[device.lat, device.lon]}
            icon={createCustomIcon(markerColors[index % markerColors.length])}
          >
            <Tooltip>{device.name}</Tooltip>
            <Popup>
              <strong>{device.name}</strong><br />
              Lat: {device.lat.toFixed(4)}, Lon: {device.lon.toFixed(4)}
            </Popup>
          </Marker>
        ))}
        {mapBounds && deviceLocations.length > 0 && (
          <MapUpdater bounds={mapBounds} mapInitialized={mapInitialized} />
        )}
      </MapContainer>
    );
  };

  return (
    <div className="bg-white h-full w-full border border-gray-200 rounded-md shadow-sm p-2 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <p className="text-lg font-medium">{title}</p>
        <button onClick={() => setIsOpen(true)} title="Fullscreen" className='cursor-pointer'>
          <FiMaximize size={20} />
        </button>
      </div>
      <div className="flex-grow min-h-[150px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p>Loading map data...</p>
          </div>
        ) : deviceLocations.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>No device locations available. Showing default view.</p>
          </div>
        ) : (
          <MapContent />
        )}
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold">{title} - Full View</h2>
            <button onClick={() => setIsOpen(false)} className="text-lg">
              <FiX size={24} />
            </button>
          </div>
          <div className="flex-grow">
            <MapContent fullScreen={true} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}