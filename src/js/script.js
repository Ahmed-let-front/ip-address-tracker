import L from 'leaflet';
import markerIcon from '../assets/images/icon-location.svg';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const elements = {
  map: document.getElementById('map'),
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  ipAddressEl: document.getElementById('ip-address'),
  location: document.getElementById('location'),
  timezone: document.getElementById('timezone'),
  isp: document.getElementById('isp'),
};
const config = {
  TIMEOUT_SEC: 10,
  ZOOM_LEVEL: 15,
  API_URL_IP: 'https://ipapi.co',
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
  country: '',
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
  state.userLat = data.latitude;
  state.userLng = data.longitude;
};
const setNewIPDetails = data => {
  state.ipAddress = data.ip;
  state.city = data.city;
  state.region = data.region;
  state.country = data.country;
  state.postalCode = data.postal;
  state.ISP = data.org;
  state.timeZone = data.timezone;
};

const updataIpDetails = data => {
  setNewLatAndLng(data);
  setNewIPDetails(data);
};
const getIPdetails = async () => {
  const data = await AJAX(`${config.API_URL_IP}/json`);
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
  const location = `${state.city} ${state.country ? `, ${state.country}` : ''} ${state.postalCode ? `,${state.postalCode}` : ''}`;
  elements.isp.textContent = state.ISP;
  elements.ipAddressEl.textContent = state.ipAddress;
  elements.location.textContent = location;
  elements.timezone.textContent = state.timeZone;
};
const setMarkerInMap = message => {
  const customIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 30],
    iconAnchor: [12, 41],
  });
  const marker = L.marker([state.userLat, state.userLng], {
    icon: customIcon,
  }).addTo(state.map);
  marker
    .bindTooltip(message, {
      permanent: true,
      direction: 'top',
      offset: [0, -35],
      className: 'custom-tooltip',
    })
    .openTooltip();
};
const setupMap = () => {
  state.map = L.map('map').setView(
    [state.userLat, state.userLng],
    config.ZOOM_LEVEL,
  );
  setMarkerInMap('Your Current Location');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(state.map);
};
const unfocusInActiveEl = () => document.activeElement.blur();
const clearSearchInput = () => (elements.searchInput.value = '');
const flyToMap = (lat, lng) => {
  state.map.flyTo([lat, lng], config.ZOOM_LEVEL, {
    animate: true,
    duration: 1.5,
  });
};
const updateMarkerLocation = () => {
  flyToMap(state.userLat, state.userLng);
  setMarkerInMap('The IP Location');
};
const handlerSearchInput = async (queryIP = '') => {
  try {
    if (queryIP === '') return;
    const data = await AJAX(`${config.API_URL_IP}/${queryIP}/json`);
    if (data.error) throw new Error('IP address not found or invalid!');
    updataIpDetails(data);
    unfocusInActiveEl();
    clearSearchInput();
    updateMarkerLocation();
    updateDomContainerIPDetails();
  } catch (err) {
    alert(err.message);
  }
};
const handleSearchForm = () => {
  elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const queryIP = elements.searchInput.value.trim();
    handlerSearchInput(queryIP);
  });
};
const init = async () => {
  try {
    await getIPdetails();
    await getGeoLocation();
    setupMap();
    updateDomContainerIPDetails();
    handleSearchForm();
  } catch (err) {
    alert(err.message ? err.message : err);
  }
};
init();