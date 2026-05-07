import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from './UI';
import { X } from 'lucide-react';

// Fix for default marker icon issue with Next.js
// By deleting the _getIconUrl prototype and manually setting the paths using require,
// we can ensure Leaflet finds the correct image assets in a Webpack environment.
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});



interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  initialPosition: { lat: number; lng: number };
}

const LocationMarker: React.FC<{ position: L.LatLng | null; setPosition: (position: L.LatLng) => void }> = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={redIcon}></Marker>
  );
};

const MapPickerModal: React.FC<MapPickerModalProps> = ({ isOpen, onClose, onLocationSelect, initialPosition }) => {
  const defaultPos = { lat: 9.03, lng: 38.74 }; // Addis Ababa
  const [position, setPosition] = useState<L.LatLng | null>(
    L.latLng(
      initialPosition?.lat ?? defaultPos.lat, 
      initialPosition?.lng ?? defaultPos.lng
    )
  );

  useEffect(() => {
      if(isOpen) {
          setPosition(
            L.latLng(
              initialPosition?.lat ?? defaultPos.lat, 
              initialPosition?.lng ?? defaultPos.lng
            )
          );
      }
  }, [isOpen, initialPosition]);


  if (!isOpen) return null;

  const handleSave = () => {
    if (position) {
      onLocationSelect({ lat: position.lat, lng: position.lng });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        <header className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-primary text-lg">Select Business Location</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </header>
        <div className="flex-1 relative">
          <MapContainer center={position || [9.03, 38.75]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
        <footer className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Location</Button>
        </footer>
      </div>
    </div>
  );
};

export default MapPickerModal;