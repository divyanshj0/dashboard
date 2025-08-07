'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { FiMaximize, FiX } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false });
const MapDrawControl = dynamic(() => import('./MapDrawControl'), { ssr: false });
const MapUpdater = dynamic(() => Promise.resolve(({ children, ...props }) => {
  const map = useMap();
  useEffect(() => {
    if (map && map.fitBounds && props.L && props.mapInitialized && props.bounds && props.bounds.length === 4) {
      const timeoutId = setTimeout(() => {
        try {
          const southWest = props.L.latLng(props.bounds[0], props.bounds[1]);
          const northEast = props.L.latLng(props.bounds[2], props.bounds[3]);
          const newBounds = props.L.latLngBounds(southWest, northEast);
          if (newBounds.isValid()) {
            map.fitBounds(newBounds, { padding: [50, 50], maxZoom: 18 });
          }
        } catch (e) {
          console.error('Error fitting map bounds:', e);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [map, props.bounds, props.mapInitialized, props.L]);
  return null;
}), { ssr: false });

const markerColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#34D399'];

export default function MapWidget({ title = "Device Locations", parameters = [], token, geoFence, onGeofenceChange }) {
  const router=useRouter()
  const [deviceLocations, setDeviceLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [geofence, setGeofence] = useState(geoFence || null);

  const leafletRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !leafletRef.current) {
      const L = require('leaflet');
      require('leaflet-draw');
      require('leaflet-defaulticon-compatibility');
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
      leafletRef.current = L;
    }
  }, []);
  const createCustomIcon = useCallback((color) => {
    const L = leafletRef.current;
    if (!L) return null;
    return new L.DivIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, []);

  // Fetch device locations based on parameters and token
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      const fetchedLocations = [];
      let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
      let hasValidLocation = false;
      if (!token || !parameters.length) {
        setLoading(false);
        setDeviceLocations([]);
        setMapBounds(null);
        return;
      }
      for (const param of parameters) {
        if (!param.deviceId) continue;
        try {
          const latRes = await fetch('/api/thingsboard/timeseriesdata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, deviceId: param.deviceId, key: 'latitude', limit: 1 }),
          });
          if (latRes.status === 401) {
            localStorage.clear();
            toast.error('Session expired. Please log in again.');
            router.push('/');
            return;
          }
          const latData = await latRes.json();
          const latitude = latData?.latitude?.[0]?.value ? parseFloat(latData.latitude[0].value) : null;
          const lonRes = await fetch('/api/thingsboard/timeseriesdata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, deviceId: param.deviceId, key: 'longitude', limit: 1 }),
          });
          if (lonRes.status === 401) {
            localStorage.clear();
            toast.error('Session expired. Please log in again.');
            router.push('/');
            return;
          }
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
          console.error(`Failed fetching location for device ${param.deviceId}`, error);
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
    }
  }, [parameters, token]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Handlers for drawing events
  const handleCreated = (layer) => {
    const coords = layer.getLatLngs()[0].map(({ lat, lng }) => [lat, lng]);
    setGeofence(coords);
    onGeofenceChange(coords);
  };
  const handleEdited = (layers) => {
    if (layers && typeof layers.getLatLngs === 'function') {
      // This case handles a single layer being passed
      const coords = layers.getLatLngs()[0].map(({ lat, lng }) => [lat, lng]);
      setGeofence(coords);
      onGeofenceChange?.(coords);
    } else {
      console.error('Expected valid layers object for editing, but received:', layers);
    }
  };
  const handleDeleted = () => {
    setGeofence(null);
    onGeofenceChange?.(null);
  };

  const defaultCenter = [26.9124, 75.7873];
  const defaultZoom = 12;

  const MapContent = ({ fullScreen = false }) => {
    const L = leafletRef.current;
    if (!L) return <div className="h-full flex items-center justify-center">Loading map...</div>;
    const initialCenter = mapBounds ? [(mapBounds[0] + mapBounds[2]) / 2, (mapBounds[1] + mapBounds[3]) / 2] : defaultCenter;
    const initialZoom = defaultZoom;
    return (
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: fullScreen ? 0 : 8 }}
        whenReady={() => setMapInitialized(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {deviceLocations.map((device, idx) => (
          <Marker key={device.id} position={[device.lat, device.lon]} icon={createCustomIcon(markerColors[idx % markerColors.length])}>
            <Tooltip>{device.name}</Tooltip>
            <Popup>
              <b>{device.name}</b><br />
              Lat: {device.lat.toFixed(4)}, Lon: {device.lon.toFixed(4)}
            </Popup>
          </Marker>
        ))}
        {geofence && geofence.length > 0 && (
          <Polygon positions={geofence} pathOptions={{ color: 'blue', weight: 3, fillOpacity: 0.1 }} />
        )}
        {mapBounds && deviceLocations.length > 0 && <MapUpdater bounds={mapBounds} mapInitialized={mapInitialized} L={L} />}
        <MapDrawControl onCreated={handleCreated} onEdited={handleEdited} onDeleted={handleDeleted} existingGeofence={geofence} L={L} />
      </MapContainer>
    );
  };

  return (
    <div className="bg-white h-full w-full border border-gray-200 rounded-md shadow-sm p-2 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <p className="text-lg font-medium">{title}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsOpen(true)} title="Fullscreen" className="p-2 rounded-md bg-gray-100 hover:bg-gray-200">
            <FiMaximize size={20} />
          </button>
        </div>
      </div>
      <div className="flex-grow min-h-[150px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">Loading map data...</div>
        ) : deviceLocations.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No device locations available. Showing default view.
          </div>
        ) : (
          <MapContent />
        )}
      </div>
      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold">{title} - Full View</h2>
            <button onClick={() => setIsOpen(false)} className="text-lg p-1 rounded hover:bg-gray-200">
              <FiX size={24} />
            </button>
          </div>
          <div className="flex-grow">
            <MapContent fullScreen />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}