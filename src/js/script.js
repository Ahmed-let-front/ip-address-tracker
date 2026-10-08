import L from 'leaflet';
import markerIcon from '../assets/images/icon-location.svg';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const elements = {
  map: document.getElementById('map'),
};
const config = {
  ZOOM_LEVEL: 15,
};
const state = {
  userLat: 0,
  userLng: 0,
};
const getGeoLocation = () => {
  return new Promise((resolve, reject) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          state.userLat = pos.coords.latitude;
          state.userLng = pos.coords.longitude;
          resolve();
        },
        err => {
          reject(err.message);
        },
      );
    } else reject('Geolocation API is not supported by your browser');
  });
};
const setupMap = () => {
  const customIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 30],
    iconAnchor: [12, 41],
  });
  const map = L.map('map').setView([state.userLat, state.userLng], config.ZOOM_LEVEL);
  const marker = L.marker([state.userLat, state.userLng], { icon: customIcon }).addTo(
    map,
  );
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  marker
    .bindTooltip('Your current location', {
      permanent: true,
      direction: 'top',
      offset: [0, -35],
      className: 'custom-tooltip',
    })
    .openTooltip();
};
const init = async () => {
  try {
    await getGeoLocation();
    setupMap();
  } catch (err) {
    alert(err);
  }
};
init();
