// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * รวม className แบบปลอดภัย + รวม duplicate tailwind
 * ใช้: className={cn('p-4', condition && 'bg-orange-50')}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
