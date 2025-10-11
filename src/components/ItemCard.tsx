import { useState, useEffect } from 'react'
import { getItemPhotoUrl } from '../lib/supabase'

interface ItemCardProps {
  id: string
  label: string
  description?: string
  photo_path?: string
  qr_code?: string
  cubic_feet?: number
}

export default function ItemCard({
  label,
  description,
  photo_path,
  qr_code,
  cubic_feet,
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
      <div className="flex justify-between text-xs text-gray-500">
        {qr_code && <span>QR: {qr_code}</span>}
        {cubic_feet && <span>{cubic_feet} cu ft</span>}
      </div>
    </div>
  )
}
