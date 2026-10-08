import L from 'leaflet';
import markerIcon from '../assets/images/icon-location.svg';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const elements = {
  map: document.getElementById('map'),
  searchForm: document.getElementById('search-form'),
  ipAddressEl: document.getElementById('ip-address'),
  location: document.getElementById('location'),
  timezone: document.getElementById('timezone'),
  isp: document.getElementById('isp'),
};
const config = {
  TIMEOUT_SEC: 10,
  ZOOM_LEVEL: 15,
  API_KEY_IPIFY: 'at_GA7vbZkGLsCkDHtQ4EinHgZpLkTGX',
  IPIFY_API_URL: 'https://geo.ipify.org/api/v2/country,city',
};
const state = {
  userLat: 0,
  userLng: 0,
  ipAddress: undefined,
  ISP: '',
  region: '',
  postalCode: '',
  city: '',
  timeZone: '',
};
const timeout = s => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Request took too long! Timeout after ${config.TIMEOUT_SEC} seconds.`,
        ),
      );
    }, 1000 * s);
  });
};
const AJAX = async url => {
  const res = await Promise.race([fetch(url), timeout(config.TIMEOUT_SEC)]);
  if (!res.ok) throw new Error(`Failed to fetch data! Status: ${res.status}`);
  return await res.json();
};
const setNewLatAndLng = data => {
  const { location } = data;
  state.userLat = location.lat;
  state.userLng = location.lng;
};
const setNewIPDetails = data => {
  const { location } = data;
  state.ipAddress = data.ip;
  state.city = location.city;
  state.region = location.region;
  state.postalCode = location.postalCode;
  state.ISP = data.isp;
  state.timeZone = location.timezone;
};

const updataIpDetails = data => {
  setNewLatAndLng(data);
  setNewIPDetails(data);
};
const getIPdetails = async ip => {
  const data = await AJAX(
    `${config.IPIFY_API_URL}?apiKey=${config.API_KEY_IPIFY}${ip ? ip : ''}`,
  );
  updataIpDetails(data);
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
const updateDomContainerIPDetails = () => {
  const regionAbbr = (state.region[0] + state.region.at(-1)).toUpperCase();
  const location = `${state.city} ${regionAbbr ? `, ${regionAbbr}` : ''} ${state.postalCode ? `,${state.postalCode}` : ''}`;
  elements.isp.textContent = state.ISP;
  elements.ipAddressEl.textContent = state.ipAddress;
  elements.location.textContent = location;
  elements.timezone.textContent = state.timeZone;
};
const setupMap = () => {
  const customIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 30],
    iconAnchor: [12, 41],
  });
  const map = L.map('map').setView(
    [state.userLat, state.userLng],
    config.ZOOM_LEVEL,
  );
  const marker = L.marker([state.userLat, state.userLng], {
    icon: customIcon,
  }).addTo(map);
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
// const handleSearchForm = () => {
//     elements.searchForm 
// }
const init = async () => {
  try {
    await getIPdetails();
    await getGeoLocation();
    setupMap();
    updateDomContainerIPDetails();
  } catch (err) {
    alert(err.message ? err.message : err);
  }
};
init();
