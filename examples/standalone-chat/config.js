// Frontend Configuration
// This will be loaded from deployment-config.json
let API_URL = null;

// Load API URL from deployment configuration
async function loadApiUrl() {
  try {
    const response = await fetch('/deployment-config.json');
    if (response.ok) {
      const config = await response.json();
      API_URL = config.worker_url;
      return API_URL;
    }
  } catch (e) {
    console.error('Failed to load deployment configuration:', e);
  }
  throw new Error('API URL not configured. Please run deployment script.');
}