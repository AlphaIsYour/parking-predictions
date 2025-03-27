"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./MapParkir.module.css";
import { FiNavigation } from "react-icons/fi";

const createIcon = (status) =>
  L.icon({
    iconUrl: `/map-icons/${status}-marker.png`,
    shadowUrl: "/map-icons/marker-shadow.png",
    iconSize: [25, 38],
    iconAnchor: [19, 38],
  });

export default function MapParkir({ parkirData }) {
  const center = [-7.952968, 112.613808];

  const handleNavigation = (lat, lng) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    );
  };

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        className="h-full w-full rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {parkirData.map((parkir) => (
          <Marker
            key={parkir.id}
            position={[parkir.latitude, parkir.longitude]}
            icon={createIcon(parkir.status)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold mb-2">{parkir.nama}</h3>
                <p>
                  Status: <span className="capitalize">{parkir.status}</span>
                </p>
                <p>Kapasitas: {parkir.kapasitas}</p>
                <button
                  onClick={() =>
                    handleNavigation(parkir.latitude, parkir.longitude)
                  }
                  className="mt-2 flex items-center gap-1 text-blue-500 hover:text-blue-700"
                >
                  <FiNavigation /> Navigasi
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
