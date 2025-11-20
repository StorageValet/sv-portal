// Storage Valet Service Area Configuration
// 13 ZIP codes in northern New Jersey

export const SUPPORTED_ZIP_CODES = [
  '07030', // Hoboken - PRIMARY MARKET
  '07001', // Avenel
  '07002', // Bayonne
  '07003', // Bloomfield
  '07004', // Fairfield
  '07005', // Boonton
  '07006', // Caldwell
  '07007', // Caldwell (West)
  '07008', // Carteret
  '07009', // Cedar Grove
  '07010', // Cliffside Park
  '07011', // Clifton
  '07012', // Clifton
  '07013', // Clifton
] as const

export type ServiceZipCode = typeof SUPPORTED_ZIP_CODES[number]

/**
 * Check if a ZIP code is within the Storage Valet service area
 */
export function isInServiceArea(zipCode: string | null | undefined): boolean {
  if (!zipCode) return false

  // Normalize ZIP code (remove spaces, handle ZIP+4 format)
  const normalizedZip = zipCode.trim().split('-')[0]

  // Type-safe check using array spread
  return (SUPPORTED_ZIP_CODES as readonly string[]).includes(normalizedZip)
}

/**
 * Format ZIP codes for display
 */
export function formatZipList(): string {
  const zips = [...SUPPORTED_ZIP_CODES]
  const lastZip = zips.pop()
  return `${zips.join(', ')}, and ${lastZip}`
}

/**
 * Get a user-friendly message for out-of-service-area customers
 */
export function getOutOfAreaMessage(zipCode?: string): string {
  if (!zipCode) {
    return `Storage Valet currently serves select areas in northern New Jersey. We support ZIP codes: ${formatZipList()}.`
  }

  return `Unfortunately, Storage Valet doesn't serve ${zipCode} yet. We currently operate in northern New Jersey ZIP codes: ${formatZipList()}.

Join our waitlist to be notified when we expand to your area!`
}

/**
 * Validate an address for service eligibility
 */
export interface Address {
  street?: string
  city?: string
  state?: string
  zip?: string
}

export interface ServiceAreaValidation {
  isValid: boolean
  zipCode?: string
  message?: string
}

export function validateServiceAddress(address: Address | null | undefined): ServiceAreaValidation {
  if (!address || !address.zip) {
    return {
      isValid: false,
      message: 'Please provide a valid ZIP code to check service availability.'
    }
  }

  const zipCode = address.zip.trim().split('-')[0]
  const isValid = isInServiceArea(zipCode)

  return {
    isValid,
    zipCode,
    message: isValid
      ? `Great news! We serve ${zipCode}.`
      : getOutOfAreaMessage(zipCode)
  }
}

/**
 * Component helper: Get badge color based on service area status
 */
export function getServiceAreaBadgeColor(isInArea: boolean): string {
  return isInArea ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
}

/**
 * Component helper: Get icon for service area status
 */
export function getServiceAreaIcon(isInArea: boolean): '✓' | '✗' {
  return isInArea ? '✓' : '✗'
}
