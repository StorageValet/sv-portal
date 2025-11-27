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

  // Status badge colors - using semantic colors for clarity
  const statusColors = {
    home: 'bg-green-100 text-green-800',
    in_transit: 'bg-amber-100 text-amber-800',
    stored: 'bg-slate text-bone',
  }

  const statusLabel = item.status || 'home'

  return (
    <div className={`card p-0 flex flex-col overflow-hidden transition-all ${
      isSelected ? 'ring-2 ring-slate ring-offset-2' : ''
    }`}>
      {/* Photo Section with Checkbox and Status Badge */}
      <div className="relative">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="absolute top-2 left-2 h-5 w-5 rounded text-slate border-slate/30 focus:ring-slate cursor-pointer z-10"
          onClick={(e) => e.stopPropagation()}
        />

        {isLoading ? (
          <div className="h-48 w-full bg-bone animate-pulse" />
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt={item.label}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="h-48 w-full bg-cream flex items-center justify-center text-slate/50">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
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
        <h3 className="font-bold text-lg text-gunmetal">{item.label}</h3>

        {item.description && (
          <p className="text-sm text-gunmetal/70 mt-1 line-clamp-2">{item.description}</p>
        )}

        {item.qr_code && (
          <p className="text-xs text-slate/60 mt-2">QR: {item.qr_code}</p>
        )}

        {/* Metadata */}
        <div className="text-sm text-gunmetal/70 space-y-1 mt-3 flex-grow">
          {Number.isFinite(cubicFeet) && Number.isFinite(weightLbs) && (
            <p>{cubicFeet!.toFixed(1)} ft³ • {weightLbs} lbs</p>
          )}
          {Number.isFinite(estimatedValueCents) && (
            <p className="font-medium text-gunmetal">
              ${(estimatedValueCents! / 100).toFixed(2)} value
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end space-x-2 border-t border-slate/20 pt-3">
          <button
            onClick={() => onViewDetails(item.id)}
            className="text-sm font-medium text-gunmetal/60 hover:text-gunmetal transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => onEdit(item.id)}
            className="text-sm font-medium text-slate hover:text-gunmetal transition-colors"
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
