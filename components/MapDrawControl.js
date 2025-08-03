'use client';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

const MapDrawControl = ({ onCreated, onEdited, onDeleted }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !L) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        poly: {
          allowIntersection: false,
        },
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e) => {
      const { layer } = e;
      drawnItems.addLayer(layer);
      onCreated(layer);
    });

    map.on(L.Draw.Event.EDITED, (e) => {
      onEdited(e.layers);
    });

    map.on(L.Draw.Event.DELETED, (e) => {
      onDeleted(e.layers);
    });
    
    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onCreated, onEdited, onDeleted]);

  return null;
};

export default MapDrawControl;