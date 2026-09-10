export interface SocialImage {
  path: string
  width: number
  height: number
  alt: string
  type: 'image/png' | 'image/jpeg' | 'image/webp'
}

export const defaultSocialImage: SocialImage = {
  path: '/brand/authier-social-card.png',
  width: 1200,
  height: 630,
  alt: 'Authier — your vault, your devices',
  type: 'image/png'
}
