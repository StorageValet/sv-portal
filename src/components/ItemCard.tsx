import { useState, useEffect } from 'react'
import { getItemPhotoUrl } from '../lib/supabase'

interface ItemCardProps {
  id: string
  label: string
  description?: string
  photo_path?: string
  qr_code?: string
  cubic_feet?: number
  weight_lbs?: number
  estimated_value_cents?: number
}

export default function ItemCard({
  label,
  description,
  photo_path,
  qr_code,
  cubic_feet,
  weight_lbs,
  estimated_value_cents,
}: ItemCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (photo_path) {
      getItemPhotoUrl(photo_path).then(setPhotoUrl)
    }
  }, [photo_path])

  return (
    <div className="card">
      {photoUrl && (
        <img
          src={photoUrl}
          alt={label}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}
      <h3 className="font-semibold text-lg mb-2">{label}</h3>
      {description && <p className="text-gray-600 text-sm mb-3">{description}</p>}
      <div className="mt-2 text-sm text-deep-harbor flex flex-wrap gap-x-3 gap-y-1">
        {qr_code && <span>QR: {qr_code}</span>}
        {typeof cubic_feet === 'number' && <span>{cubic_feet.toFixed(1)} ft³</span>}
        {typeof weight_lbs === 'number' && <span>{weight_lbs} lbs</span>}
        {typeof estimated_value_cents === 'number' && (
          <span>${(estimated_value_cents / 100).toFixed(2)} value</span>
        )}
      </div>
    </div>
  )
}
