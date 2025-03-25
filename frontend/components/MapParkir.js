"use client"; // Paksa render di client-side

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const getIcon = (status) => {
  const iconUrl = {
    kosong:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    ramai:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
    penuh:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  };
  return new L.Icon({
    iconUrl: iconUrl[status],
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
};

export default function MapParkir({ parkirData }) {
  return (
    <MapContainer
      key={parkirData.length} // Tambahkan ini
      center={[-7.952, 112.613]}
      zoom={16}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {parkirData.map((parkir) => (
        <Marker
          key={parkir.id}
          position={[parkir.latitude, parkir.longitude]}
          icon={getIcon(parkir.status)}
        >
          <Popup>
            {parkir.nama} - Status: {parkir.status}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
