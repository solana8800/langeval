export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export async function delay(ms: number = 200) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
