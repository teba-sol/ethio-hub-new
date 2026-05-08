'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Locate } from 'lucide-react';

const defaultCenter: [number, number] = [9.032, 38.746];

interface LocationPickerProps {
  value?: { latitude: number; longitude: number };
  onChange: (location: { latitude: number; longitude: number }) => void;
  height?: string;
}

function LocationMarker({ position, onChange }: { 
  position: [number, number] | null; 
  onChange: (location: { latitude: number; longitude: number }) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onChange({ latitude: position.lat, longitude: position.lng });
        },
      }}
      icon={L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 40px;
            height: 40px;
            background: #0f766e;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      })}
    />
  );
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  height = '400px',
}) => {
  const [position, setPosition] = useState<[number, number] | null>(
    value ? [value.latitude, value.longitude] : null
  );
  const [manualAddress, setManualAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) {
      setPosition([value.latitude, value.longitude]);
    }
  }, [value]);

  const handleMarkerDrag = useCallback(
    (location: { latitude: number; longitude: number }) => {
      setPosition([location.latitude, location.longitude]);
      onChange(location);
    },
    [onChange]
  );

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setPosition([location.latitude, location.longitude]);
          onChange(location);
          setLoading(false);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setLoading(false);
        }
      );
    }
  };

  const handleAddressSearch = async () => {
    if (!manualAddress.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}, Ethiopia&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
        setPosition([location.latitude, location.longitude]);
        onChange(location);
      } else {
        alert('Address not found. Try a different search term.');
      }
    } catch (err) {
      console.error('Address search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search address (e.g., Bole, Addis Ababa)"
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
        />
        <button
          type="button"
          onClick={handleAddressSearch}
          disabled={loading}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          Search
        </button>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={loading}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          title="Use my location"
        >
          <Locate className="w-4 h-4" />
          {loading ? 'Locating...' : 'Locate Me'}
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-gray-200"
        style={{ height }}
      >
        <MapContainer
          center={position || defaultCenter}
          zoom={position ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onChange={handleMarkerDrag} />
        </MapContainer>
      </div>

      {position && (
        <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm text-gray-600">
            Selected: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </span>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Click on the map or drag the marker to set your delivery location
      </p>
    </div>
  );
};

export default LocationPicker;
