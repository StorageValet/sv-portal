import { useState, useEffect } from 'react'
import { getItemPhotoUrl } from '../lib/supabase'

interface Item {
  id: string
  label: string
  description?: string
  photo_path?: string
  photo_paths?: string[]
  qr_code?: string
  cubic_feet?: number
  weight_lbs?: number
  estimated_value_cents?: number
  status?: 'home' | 'in_transit' | 'stored'
}

interface ItemCardProps {
  item: Item
  isSelected: boolean
  onSelect: (itemId: string) => void
  onEdit: (itemId: string) => void
  onDelete: (itemId: string) => void
  onViewDetails: (itemId: string) => void
  viewMode?: 'grid' | 'list'
}

export default function ItemCard({ item, isSelected, onSelect, onEdit, onDelete, onViewDetails }: ItemCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Migration 0004: Read from photo_paths[] first, fallback to legacy photo_path
    const firstPhotoPath = item.photo_paths && item.photo_paths.length > 0
      ? item.photo_paths[0]
      : item.photo_path

    if (firstPhotoPath) {
      setIsLoading(true)
      getItemPhotoUrl(firstPhotoPath)
        .then(url => {
          setPhotoUrl(url)
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [item.photo_path, item.photo_paths])

  const statusColors = {
    home: 'bg-green-100 text-green-800',
    in_transit: 'bg-yellow-100 text-yellow-800',
    stored: 'bg-blue-100 text-blue-800',
  }

  const statusLabel = item.status || 'home'

  return (
    <div className={`border rounded-lg shadow-sm bg-white flex flex-col overflow-hidden transition-all ${
      isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
    }`}>
      {/* Photo Section with Checkbox and Status Badge */}
      <div className="relative">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="absolute top-2 left-2 h-5 w-5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer z-10"
          onClick={(e) => e.stopPropagation()}
        />

        {isLoading ? (
          <div className="h-48 w-full bg-gray-200 animate-pulse" />
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt={item.label}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="h-48 w-full bg-gray-100 flex items-center justify-center text-gray-400">
            No Photo
          </div>
        )}

        {/* Status Badge */}
        {item.status && (
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${statusColors[statusLabel]}`}>
            {statusLabel.replace('_', ' ').toUpperCase()}
          </span>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-gray-800">{item.label}</h3>

        {item.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
        )}

        {item.qr_code && (
          <p className="text-xs text-gray-500 mt-2">QR: {item.qr_code}</p>
        )}

        {/* Metadata */}
        <div className="text-sm text-gray-600 space-y-1 mt-3 flex-grow">
          {(typeof item.cubic_feet === 'number' && typeof item.weight_lbs === 'number') && (
            <p>{item.cubic_feet.toFixed(1)} ft³ • {item.weight_lbs} lbs</p>
          )}
          {typeof item.estimated_value_cents === 'number' && (
            <p className="font-medium text-gray-700">
              ${(item.estimated_value_cents / 100).toFixed(2)} value
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end space-x-2 border-t pt-3">
          <button
            onClick={() => onViewDetails(item.id)}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => onEdit(item.id)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
