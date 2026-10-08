import L from 'leaflet';
import markerIcon from '../assets/images/icon-location.svg';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const elements = {
  map: document.getElementById('map'),
  resetLocationBtn: document.getElementById('reset-location-btn'),
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
const initState = {
  userlat: 0,
  userLng: 0,
  ipAddress: undefined,
  ISP: '',
  region: '',
  postalCode: '',
  city: '',
  timeZone: '',
  country: '',
};
const state = {
  currUserLat: 0,
  currUserLng: 0,
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
  state.currUserLat = data.latitude;
  state.currUserLng = data.longitude;
};
const setNewIPDetailsInit = data => {
  initState.ipAddress = data.ip;
  initState.city = data.city;
  initState.region = data.region;
  initState.country = data.country;
  initState.postalCode = data.postal;
  initState.ISP = data.org;
  initState.timeZone = data.timezone;
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
  setNewIPDetailsInit(data);
};
const getGeoLocation = () => {
  return new Promise((resolve, reject) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          initState.userlat = pos.coords.latitude;
          initState.userLng = pos.coords.longitude;
          resolve();
        },
        err => {
          reject(err.message);
        },
      );
    } else reject('Geolocation API is not supported by your browser');
  });
};
const updateDomContainerIPDetails = state => {
  const location = `${state.city} ${state.country ? `, ${state.country}` : ''} ${state.postalCode ? `,${state.postalCode}` : ''}`;
  elements.isp.textContent = state.ISP;
  elements.ipAddressEl.textContent = state.ipAddress;
  elements.location.textContent = location;
  elements.timezone.textContent = state.timeZone;
};
const setMarkerInMap = (lat, lng, message) => {
  const customIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 30],
    iconAnchor: [12, 41],
  });
  const marker = L.marker([lat, lng], {
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
    [initState.userlat, initState.userLng],
    config.ZOOM_LEVEL,
  );
  setMarkerInMap(initState.userlat, initState.userLng, 'Your Current Location');
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
  flyToMap(state.currUserLat, state.currUserLng);
  setMarkerInMap(state.currUserLat, state.currUserLng, 'The IP Location');
};
const handlerSearchInput = async (queryIP = '') => {
  try {
    if (queryIP === '') return;
    const data = await AJAX(`${config.API_URL_IP}/${queryIP}/json`);
    if (data.error) throw new Error('IP address not found or invalid!');
    updataIpDetails(data);
    unfocusInActiveEl();
    clearSearchInput();
    updateMarkerLocation(state);
    updateDomContainerIPDetails(state);
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
const handleResetLocation = () => {
  elements.resetLocationBtn.addEventListener('click', async () => {
    setNewIPDetails(initState);
    flyToMap(initState.userlat, initState.userLng);
    updateDomContainerIPDetails(initState);
  });
};
const init = async () => {
  try {
    await getIPdetails();
    await getGeoLocation();
    setupMap();
    updateDomContainerIPDetails(initState);
    handleSearchForm();
    handleResetLocation();
  } catch (err) {
    alert(err.message ? err.message : err);
  }
};
init();
