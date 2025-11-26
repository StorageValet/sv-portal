import { useQuery } from '@tanstack/react-query'
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
  const cubicFeet = item.cubic_feet !== undefined && item.cubic_feet !== null
    ? Number(item.cubic_feet)
    : null

  const weightLbs = item.weight_lbs !== undefined && item.weight_lbs !== null
    ? Number(item.weight_lbs)
    : null

  const estimatedValueCents = item.estimated_value_cents !== undefined && item.estimated_value_cents !== null
    ? Number(item.estimated_value_cents)
    : null

  // Migration 0004: Read from photo_paths[] first, fallback to legacy photo_path
  const firstPhotoPath = item.photo_paths && item.photo_paths.length > 0
    ? item.photo_paths[0]
    : item.photo_path

  // Use React Query to cache signed URLs (50-minute cache, URLs expire at 60 minutes)
  const { data: photoUrl, isLoading } = useQuery({
    queryKey: ['item-photo', firstPhotoPath],
    queryFn: () => getItemPhotoUrl(firstPhotoPath!),
    enabled: !!firstPhotoPath,
    staleTime: 1000 * 60 * 50, // 50 minutes
  })

  const statusColors = {
    home: 'bg-green-100 text-green-800',
    in_transit: 'bg-yellow-100 text-yellow-800',
    stored: 'bg-blue-100 text-blue-800',
  }

  const statusLabel = item.status || 'home'

  return (
    <div className={`border border-slate rounded-lg shadow-sm bg-gunmetal-2 flex flex-col overflow-hidden transition-all ${
      isSelected ? 'ring-2 ring-bone ring-offset-2 ring-offset-gunmetal' : ''
    }`}>
      {/* Photo Section with Checkbox and Status Badge */}
      <div className="relative">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="absolute top-2 left-2 h-5 w-5 rounded text-bone border-slate focus:ring-bone cursor-pointer z-10 bg-gunmetal-2"
          onClick={(e) => e.stopPropagation()}
        />

        {isLoading ? (
          <div className="h-48 w-full bg-slate animate-pulse" />
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt={item.label}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="h-48 w-full bg-slate flex items-center justify-center text-bone/50">
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
        <h3 className="font-bold text-lg text-cream">{item.label}</h3>

        {item.description && (
          <p className="text-sm text-bone mt-1 line-clamp-2">{item.description}</p>
        )}

        {item.qr_code && (
          <p className="text-xs text-bone/70 mt-2">QR: {item.qr_code}</p>
        )}

        {/* Metadata */}
        <div className="text-sm text-bone space-y-1 mt-3 flex-grow">
          {Number.isFinite(cubicFeet) && Number.isFinite(weightLbs) && (
            <p>{cubicFeet!.toFixed(1)} ft³ • {weightLbs} lbs</p>
          )}
          {Number.isFinite(estimatedValueCents) && (
            <p className="font-medium text-cream">
              ${(estimatedValueCents! / 100).toFixed(2)} value
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end space-x-2 border-t border-slate pt-3">
          <button
            onClick={() => onViewDetails(item.id)}
            className="text-sm font-medium text-bone hover:text-cream transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => onEdit(item.id)}
            className="text-sm font-medium text-bone hover:text-cream transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
