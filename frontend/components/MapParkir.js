"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./MapParkir.module.css";

// Fix icon issue
const DefaultIcon = L.icon({
  iconUrl: "/map-icons/default-marker.png",
  shadowUrl: "/map-icons/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapParkir({ parkirData }) {
  const center = [-7.952968, 112.613808];

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        className={styles.leafletContainer}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {parkirData.map((parkir) => (
          <Marker
            key={parkir.id}
            position={[parkir.latitude, parkir.longitude]}
            icon={L.icon({
              iconUrl: `/map-icons/${parkir.status}-marker.png`,
              shadowUrl: "/map-icons/marker-shadow.png",
              iconSize: [38, 38],
              iconAnchor: [19, 38],
            })}
          >
            <Popup>
              <div className={styles.popup}>
                <h3>{parkir.nama}</h3>
                <p>Status: {parkir.status}</p>
                <p>Kapasitas: {parkir.kapasitas}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
