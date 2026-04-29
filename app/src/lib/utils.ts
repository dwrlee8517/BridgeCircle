import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip the "(DEV)" suffix from org names in production. The suffix is a
 * dev-data marker so we don't ship it to real users; in dev we keep it so we
 * remember which DB we're hitting.
 */
export function displayOrgName(name: string | null | undefined): string {
  const v = name ?? 'your network'
  if (process.env.NODE_ENV === 'production') {
    return v.replace(/\s*\(DEV\)\s*$/i, '').trim()
  }
  return v
}
