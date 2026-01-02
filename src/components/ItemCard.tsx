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
  status?: 'home' | 'scheduled' | 'stored'
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

export default function ItemCard({ item, isSelected, onSelect, onEdit, onDelete, onViewDetails, viewMode = 'grid' }: ItemCardProps) {
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
    scheduled: 'bg-amber-100 text-amber-800',
    stored: 'bg-sv-terracotta text-white',
  }

  // Status-based card styling (left border accent)
  const statusCardStyles = {
    home: '',
    scheduled: 'border-l-4 border-sv-navy/25',
    stored: 'border-l-4 border-sv-terracotta/60',
  }

  const statusLabel = item.status || 'home'

  // ========== LIST VIEW ==========
  if (viewMode === 'list') {
    return (
      <div className={`card p-0 overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-sv-terracotta ring-offset-2' : ''
      } ${statusCardStyles[statusLabel] || ''}`}>
        <div className="flex items-center gap-3 p-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(item.id)}
            className="h-5 w-5 rounded text-sv-terracotta border-sv-sand focus:ring-sv-navy cursor-pointer flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Thumbnail */}
          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-sv-bone">
            {isLoading ? (
              <div className="w-full h-full animate-pulse" />
            ) : photoUrl ? (
              <img src={photoUrl} alt={item.label} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sv-stone">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{item.label}</h3>
            {item.description && (
              <p className="text-sm text-text-secondary truncate">{item.description}</p>
            )}
          </div>

          {/* Status Badge */}
          <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${statusColors[statusLabel]}`}>
            {statusLabel.replace('_', ' ').toUpperCase()}
          </span>

          {/* Actions Menu (compact) */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <button
              onClick={() => onViewDetails(item.id)}
              className="p-1.5 text-sv-slate hover:text-sv-midnight rounded hover:bg-sv-bone transition-colors"
              title="Details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={() => onEdit(item.id)}
              className="p-1.5 text-sv-terracotta hover:text-sv-ember rounded hover:bg-sv-bone transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-sv-bone transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== GRID VIEW (existing) ==========
  return (
    <div className={`card p-0 flex flex-col overflow-hidden transition-all ${
      isSelected ? 'ring-2 ring-sv-terracotta ring-offset-2' : ''
    } ${statusCardStyles[statusLabel] || ''}`}>
      {/* Photo Section with Checkbox and Status Badge */}
      <div className="relative">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="absolute top-2 left-2 h-5 w-5 rounded text-sv-terracotta border-sv-sand focus:ring-sv-navy cursor-pointer z-10"
          onClick={(e) => e.stopPropagation()}
        />

        {isLoading ? (
          <div className="h-48 w-full bg-sv-bone animate-pulse" />
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt={item.label}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="h-48 w-full bg-sv-ivory flex items-center justify-center text-sv-stone">
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
        <h3 className="font-bold text-lg text-text-primary">{item.label}</h3>

        {item.description && (
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{item.description}</p>
        )}

        {item.qr_code && (
          <p className="text-xs text-text-secondary mt-2">QR: {item.qr_code}</p>
        )}

        {/* Metadata */}
        <div className="text-sm text-text-secondary space-y-1 mt-3 flex-grow">
          {Number.isFinite(cubicFeet) && Number.isFinite(weightLbs) && (
            <p>{cubicFeet!.toFixed(1)} ft³ • {weightLbs} lbs</p>
          )}
          {Number.isFinite(estimatedValueCents) && (
            <p className="font-medium text-text-primary">
              ${(estimatedValueCents! / 100).toFixed(2)} value
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end space-x-2 border-t border-border pt-3">
          <button
            onClick={() => onViewDetails(item.id)}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => onEdit(item.id)}
            className="text-sm font-medium text-sv-terracotta hover:text-sv-ember transition-colors"
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
