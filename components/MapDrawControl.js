'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import { useMap } from 'react-leaflet';
// This component adds drawing controls and listens to leaflet-draw events
export default function MapDrawControl({ onCreated, onEdited, onDeleted, existingGeofence }) {
  const drawnItems = useRef(new L.FeatureGroup());
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.addLayer(drawnItems.current);

    // If there’s an existing geofence polygon, add to feature group on mount
    if (existingGeofence && existingGeofence.length) {
      const polygon = L.polygon(existingGeofence);
      drawnItems.current.addLayer(polygon);
    }

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems.current,
        remove: true,
      },
      draw: {
        polygon: true,
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
    });

    map.addControl(drawControl);

    // Event handlers
    const createdHandler = (e) => {
      drawnItems.current.clearLayers(); // Only one polygon allowed, clear previous
      drawnItems.current.addLayer(e.layer);
      if (onCreated) onCreated(e.layer);
    };

    const editedHandler = (e) => {
      e.layers.eachLayer((layer) => {
        if (onEdited) onEdited(layer);
      });
    };

    const deletedHandler = (e) => {
      drawnItems.current.clearLayers();
      if (onDeleted) onDeleted();
    };

    map.on(L.Draw.Event.CREATED, createdHandler);
    map.on(L.Draw.Event.EDITED, editedHandler);
    map.on(L.Draw.Event.DELETED, deletedHandler);

    return () => {
      map.off(L.Draw.Event.CREATED, createdHandler);
      map.off(L.Draw.Event.EDITED, editedHandler);
      map.off(L.Draw.Event.DELETED, deletedHandler);

      map.removeControl(drawControl);
      map.removeLayer(drawnItems.current);
    };
  }, [map, onCreated, onEdited, onDeleted, existingGeofence]);

  return null;
}