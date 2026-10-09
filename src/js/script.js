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
  searchErrorsList: document.getElementById('search-errors'),
};

const config = {
  TIMEOUT_SEC: 10,
  TIMEOUT_SEC_ERROR: 5,
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
  currentMarker: null,
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
  initState.userlat = data.latitude;
  initState.userLng = data.longitude;
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
  const data = await AJAX(`${config.API_URL_IP}/json/`);
  setNewIPDetailsInit(data);
};
const removeLastError = s => {
  const lastEl = elements.searchErrorsList.lastElementChild;
  setTimeout(() => {
    lastEl.classList.add('translate-x-[20rem]', 'opacity-0');
    setTimeout(() => {
      lastEl.remove();
    }, 500);
  }, 1000 * s);
};
const displayError = message => {
  const HTML = `
    <li class="flex items-center gap-3 rounded-xl bg-gray-950/90 backdrop-blur-md px-4 py-3 text-xs font-medium text-white shadow-xl border border-gray-800 starting:translate-x-[10rem]  starting:opacity-0 opacity-100 duration-500 trnasition-transform translate-x-0">
      <span class="h-2 w-2 rounded-full bg-rose-500 shrink-0"></span>
      <p>${message}.</p>
    </li>
  `;
  elements.searchErrorsList.insertAdjacentHTML('beforeend', HTML);
  removeLastError(config.TIMEOUT_SEC_ERROR);
};

const updateDomContainerIPDetails = data => {
  const location =
    `${[data.city, data.country].filter(Boolean).join(', ')} ${data.postalCode || ''}`.trim();
  elements.isp.textContent = data.ISP;
  elements.ipAddressEl.textContent = data.ipAddress;
  elements.location.textContent = location;
  elements.timezone.textContent = data.timeZone;
};

const setMarkerInMap = (lat, lng, message) => {
  const customIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 30],
    iconAnchor: [12, 41],
  });
  if (state.currentMarker) {
    state.map.removeLayer(state.currentMarker);
  }
  state.currentMarker = L.marker([lat, lng], {
    icon: customIcon,
  }).addTo(state.map);

  state.currentMarker
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
    const data = await AJAX(`${config.API_URL_IP}/${queryIP}/json/`);
    if (data.error) throw new Error('IP address not found or invalid!');
    updataIpDetails(data);
    unfocusInActiveEl();
    clearSearchInput();
    updateMarkerLocation();
    updateDomContainerIPDetails(state);
  } catch (err) {
    elements.searchInput.setAttribute('aria-invaild', true);
    displayError(err.message);
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
  elements.resetLocationBtn.addEventListener('click', () => {
    state.currUserLat = initState.userlat;
    state.currUserLng = initState.userLng;
    setNewIPDetails(initState);
    flyToMap(initState.userlat, initState.userLng);
    setMarkerInMap(
      initState.userlat,
      initState.userLng,
      'Your Current Location',
    );
    updateDomContainerIPDetails(initState);
  });
};

const init = async () => {
  try {
    await getIPdetails();
    state.currUserLat = initState.userlat;
    state.currUserLng = initState.userLng;
    setNewIPDetails(initState);
    setupMap();
    updateDomContainerIPDetails(initState);
    handleSearchForm();
    handleResetLocation();
  } catch (err) {
    displayError(err.message);
  }
};
init();
