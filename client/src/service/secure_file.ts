import adminApi from '@/service/api_administrator';
import memberApi from '@/service/api_member';

type Principal = 'administrator' | 'member';

function clientFor(principal: Principal) {
  return principal === 'member' ? memberApi : adminApi;
}

export async function createSecureFileUrl(
  path: string,
  principal: Principal = 'administrator',
) {
  const response = await clientFor(principal).get(path, { responseType: 'blob' });
  return URL.createObjectURL(response.data);
}

export async function openSecureFile(
  path: string,
  principal: Principal = 'administrator',
) {
  const objectUrl = await createSecureFileUrl(path, principal);
  const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Popup diblokir browser.');
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
