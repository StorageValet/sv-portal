import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ═══════════════════════════════════════════════════════════════════
// PHOTO MANAGEMENT (Multi-Photo Support)
// ═══════════════════════════════════════════════════════════════════

// Helper: Get signed URL for item photo (1h expiry)
export async function getItemPhotoUrl(photoPath: string): Promise<string | null> {
  if (!photoPath) return null

  const { data, error } = await supabase.storage
    .from('item-photos')
    .createSignedUrl(photoPath, 3600) // 1 hour

  if (error) {
    console.error('Failed to create signed URL:', error)
    return null
  }

  return data.signedUrl
}

// Helper: Get signed URLs for multiple photos (1h expiry)
export async function getItemPhotoUrls(photoPaths: string[]): Promise<string[]> {
  if (!photoPaths || photoPaths.length === 0) return []

  const urls = await Promise.all(
    photoPaths.map(path => getItemPhotoUrl(path))
  )

  // Filter out null values (failed URLs)
  return urls.filter((url): url is string => url !== null)
}

// Helper: Upload multiple item photos (1-5 photos)
export async function uploadItemPhotos(
  userId: string,
  files: File[]
): Promise<{ paths: string[]; errors: string[] }> {
  const paths: string[] = []
  const errors: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const filePath = `${userId}/${timestamp}_${i}.${ext}`

    const { error } = await supabase.storage
      .from('item-photos')
      .upload(filePath, file)

    if (error) {
      console.error(`Failed to upload photo ${i}:`, error)
      errors.push(`Photo ${i + 1}: ${error.message}`)
    } else {
      paths.push(filePath)
    }
  }

  return { paths, errors }
}

// Helper: Delete single item photo from storage
export async function deleteItemPhoto(photoPath: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from('item-photos')
    .remove([photoPath])

  if (error) {
    console.error('Failed to delete photo:', error)
    return false
  }

  return true
}

// Helper: Delete multiple item photos from storage
export async function deleteItemPhotos(photoPaths: string[]): Promise<void> {
  if (!photoPaths || photoPaths.length === 0) return

  const { error } = await supabase.storage
    .from('item-photos')
    .remove(photoPaths)

  if (error) {
    console.error('Failed to delete photos:', error)
  }
}

// Helper: Validate photo file (≤5MB, JPG/PNG/WebP only)
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  const maxSizeMB = 5
  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp']

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File size must be ≤${maxSizeMB}MB` }
  }

  if (!allowedFormats.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and WebP formats are allowed' }
  }

  return { valid: true }
}

// Helper: Validate multiple photo files (1-5 photos, each ≤5MB)
export function validatePhotoFiles(files: File[]): { valid: boolean; error?: string } {
  if (files.length === 0) {
    return { valid: false, error: 'At least 1 photo is required' }
  }

  if (files.length > 5) {
    return { valid: false, error: 'Maximum 5 photos allowed' }
  }

  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const validation = validatePhotoFile(files[i])
    if (!validation.valid) {
      return { valid: false, error: `Photo ${i + 1}: ${validation.error}` }
    }
  }

  return { valid: true }
}

// ═══════════════════════════════════════════════════════════════════
// EVENT LOGGING (Movement History)
// ═══════════════════════════════════════════════════════════════════

export type InventoryEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'pickup_scheduled'
  | 'redelivery_scheduled'
  | 'delivered'
  | 'returned'

// Helper: Log inventory event
export async function logInventoryEvent(
  itemId: string,
  userId: string,
  eventType: InventoryEventType,
  eventData: Record<string, any> = {}
): Promise<boolean> {
  const { error } = await supabase
    .from('inventory_events')
    .insert({
      item_id: itemId,
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
    })

  if (error) {
    console.error('Failed to log inventory event:', error)
    return false
  }

  return true
}
