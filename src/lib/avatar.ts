import { DEFAULT_AVATAR } from "./constants";

export function getAvatarSrc(avatar_url: string | undefined | null): string {
  if (!avatar_url || avatar_url === DEFAULT_AVATAR) {
    return DEFAULT_AVATAR;
  }
  // Private blob URLs need to go through our proxy
  if (avatar_url.includes("blob.vercel-storage.com")) {
    return `/api/avatar?url=${encodeURIComponent(avatar_url)}`;
  }
  return avatar_url;
}
