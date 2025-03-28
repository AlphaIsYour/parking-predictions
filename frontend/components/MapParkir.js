"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./MapParkir.module.css";
import { FiNavigation } from "react-icons/fi";

// Fix untuk icon marker yang hilang
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/map-icons/default-marker.png",
  iconUrl: "/map-icons/default-marker.png",
  shadowUrl: "/map-icons/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const createIcon = (status) =>
  L.icon({
    iconUrl: `/map-icons/${status}-marker.png`,
    shadowUrl: "/map-icons/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });

export default function MapParkir({ parkirData = [] }) {
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
        minZoom={14}
        maxZoom={18}
        scrollWheelZoom={true} // Diubah ke true
        zoomControl={true} // Tambahkan kontrol zoom
        className="h-full w-full rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {Array.isArray(parkirData) &&
          parkirData.map((parkir) => {
            if (
              !parkir?.id ||
              typeof parkir.latitude !== "number" ||
              typeof parkir.longitude !== "number"
            )
              return null;

            return (
              <Marker
                key={parkir.id}
                position={[parkir.latitude, parkir.longitude]}
                icon={createIcon(parkir.status || "kosong")}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold mb-2">
                      {parkir.nama || "Lokasi Parkir"}
                    </h3>
                    <p>
                      Status:{" "}
                      <span className="capitalize">
                        {parkir.status || "tidak diketahui"}
                      </span>
                    </p>
                    <p>Kapasitas: {parkir.kapasitas || 0}</p>
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
            );
          })}
      </MapContainer>
    </div>
  );
}
