const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8001';

export { API_BASE_URL, WS_BASE_URL };
export default API_BASE_URL;
