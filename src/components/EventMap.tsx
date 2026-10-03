import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { fmtCard, startsAt } from '../lib/dates';
import { CATEGORY } from '../lib/events';
import type { Category, EventItem } from '../types';
import { EventBadges } from './Badge';

const iconCache = new Map<string, L.DivIcon>();

export function pinIcon(category: Category): L.DivIcon {
  const hit = iconCache.get(category);
  if (hit) return hit;
  const { color, Icon } = CATEGORY[category];
  const svg = renderToStaticMarkup(<Icon size={16} color="#fff" strokeWidth={2.5} />);
  const icon = L.divIcon({
    className: 'otc-pin',
    html: `<div style="background:${color}">${svg}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
  iconCache.set(category, icon);
  return icon;
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** OSM tiles need internet. If they fail, Leaflet's plain background shows and pins still render. */
function Tiles() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}

export function EventMap({ events, center, zoom = 12, className = '' }: {
  events: EventItem[];
  center: [number, number];
  zoom?: number;
  className?: string;
}) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className={`z-0 ${className}`}>
      <Tiles />
      <Recenter center={center} zoom={zoom} />
      {events.map((e) => (
        <Marker key={e.id} position={[e.lat, e.lng]} icon={pinIcon(e.category)} title={e.title}>
          <Popup>
            <div className="w-52 space-y-1.5">
              <p className="text-xs font-semibold text-accent-dark">{fmtCard(startsAt(e))}</p>
              <p className="text-[15px] font-bold leading-snug text-ink">{e.title}</p>
              <EventBadges event={e} />
              <Link to={`/event/${e.id}`} className="inline-block pt-1 text-sm font-semibold !text-accent-dark hover:underline">
                View →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

/** Small non-interactive map for the event page. */
export function StaticMap({ event, className = '' }: { event: EventItem; className?: string }) {
  const center = useMemo<[number, number]>(() => [event.lat, event.lng], [event.lat, event.lng]);
  return (
    <MapContainer
      center={center}
      zoom={15}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      zoomControl={false}
      keyboard={false}
      className={`z-0 ${className}`}
    >
      <Tiles />
      <Recenter center={center} zoom={15} />
      <Marker position={center} icon={pinIcon(event.category)} interactive={false} />
    </MapContainer>
  );
}

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (ev) => onPick(ev.latlng.lat, ev.latlng.lng) });
  return null;
}

/** Map used on Create event: click to drop the pin. */
export function PickerMap({ center, value, category, onPick, className = '' }: {
  center: [number, number];
  value: [number, number];
  category: Category;
  onPick: (lat: number, lng: number) => void;
  className?: string;
}) {
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={false} className={`z-0 cursor-crosshair ${className}`}>
      <Tiles />
      <Recenter center={center} zoom={13} />
      <ClickToPlace onPick={onPick} />
      <Marker position={value} icon={pinIcon(category)} />
    </MapContainer>
  );
}
