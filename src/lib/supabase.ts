import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
