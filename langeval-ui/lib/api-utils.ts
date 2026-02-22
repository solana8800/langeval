export { API_BASE_URL, IS_DEMO } from './api-client';

export async function delay(ms: number = 200) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
