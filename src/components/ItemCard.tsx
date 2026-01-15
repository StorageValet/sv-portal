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
    stored: 'bg-sv-accent text-white',
  }

  // Status-based card styling (left border accent)
  const statusCardStyles = {
    home: '',
    scheduled: 'border-l-4 border-sv-deep-teal/25',
    stored: 'border-l-4 border-sv-accent/60',
  }

  const statusLabel = item.status || 'home'
  const isScheduled = item.status === 'scheduled'

  // Handle selection - guard against selecting scheduled items
  const handleSelect = () => {
    if (isScheduled) return
    onSelect(item.id)
  }

  // ========== LIST VIEW ==========
  if (viewMode === 'list') {
    return (
      <div className={`card p-0 overflow-hidden transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-sv-brown ring-offset-2 scale-[1.01]' : ''
      } ${isScheduled ? 'bg-sv-alabaster' : ''} ${statusCardStyles[statusLabel] || ''}`}>
        <div className="flex items-center gap-3 p-3">
          {/* Checkbox - disabled for scheduled items */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSelect()
            }}
            disabled={isScheduled}
            className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isScheduled
                ? 'opacity-50 cursor-not-allowed border-sv-steel bg-sv-steel/20'
                : isSelected
                  ? 'bg-sv-brown border-sv-brown text-white'
                  : 'border-sv-sand hover:border-sv-brown focus:ring-sv-accent'
            }`}
            title={isScheduled ? 'Already scheduled' : isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected && !isScheduled && (
              <svg className="w-3 h-3 animate-check-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Thumbnail */}
          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-sv-bone">
            {isLoading ? (
              <div className="w-full h-full animate-pulse" />
            ) : photoUrl ? (
              <img src={photoUrl} alt={item.label} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sv-steel">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-sv-deep-teal truncate">{item.label}</h3>
            {item.description && (
              <p className="text-sm text-sv-slate truncate">{item.description}</p>
            )}
          </div>

          {/* Scheduled Badge */}
          {isScheduled && (
            <span className="flex-shrink-0 text-xs bg-sv-steel/80 text-white px-2 py-0.5 rounded">
              Already scheduled
            </span>
          )}

          {/* Status Badge */}
          <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${statusColors[statusLabel]}`}>
            {statusLabel.replace('_', ' ').toUpperCase()}
          </span>

          {/* Actions Menu (compact) */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <button
              onClick={() => onViewDetails(item.id)}
              className="p-1.5 text-sv-slate hover:text-sv-deep-teal rounded hover:bg-sv-bone transition-colors"
              title="Details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={() => onEdit(item.id)}
              className="p-1.5 text-sv-brown hover:text-sv-brown-hover rounded hover:bg-sv-bone transition-colors"
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

  // ========== GRID VIEW ==========
  return (
    <div className={`group card p-0 flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
      isSelected ? 'ring-2 ring-sv-brown ring-offset-2 scale-[1.02]' : ''
    } ${isScheduled ? 'bg-sv-alabaster' : ''} ${statusCardStyles[statusLabel] || ''}`}>
      {/* Photo Section with Checkbox and Status Badge */}
      <div className="relative overflow-hidden">
        {/* Selection Checkbox - disabled for scheduled items */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleSelect()
          }}
          disabled={isScheduled}
          className={`absolute top-2 left-2 h-5 w-5 rounded border-2 flex items-center justify-center z-10 transition-colors ${
            isScheduled
              ? 'opacity-50 cursor-not-allowed border-sv-steel bg-sv-steel/20'
              : isSelected
                ? 'bg-sv-brown border-sv-brown text-white'
                : 'border-sv-sand bg-white/80 hover:border-sv-brown focus:ring-sv-accent'
          }`}
          title={isScheduled ? 'Already scheduled' : isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected && !isScheduled && (
            <svg className="w-3 h-3 animate-check-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {isLoading ? (
          <div className="h-48 w-full bg-sv-bone animate-pulse" />
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt={item.label}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-48 w-full bg-sv-ivory flex items-center justify-center text-sv-steel">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Scheduled Badge */}
        {isScheduled && (
          <span className="absolute top-2 right-2 text-xs bg-sv-steel/80 text-white px-2 py-0.5 rounded z-10">
            Already scheduled
          </span>
        )}

        {/* Status Badge */}
        {item.status && !isScheduled && (
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${statusColors[statusLabel]}`}>
            {statusLabel.replace('_', ' ').toUpperCase()}
          </span>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-sv-deep-teal">{item.label}</h3>

        {item.description && (
          <p className="text-sm text-sv-slate mt-1 line-clamp-2">{item.description}</p>
        )}

        {item.qr_code && (
          <p className="text-xs text-sv-slate mt-2">QR: {item.qr_code}</p>
        )}

        {/* Metadata */}
        <div className="text-sm text-sv-slate space-y-1 mt-3 flex-grow">
          {Number.isFinite(cubicFeet) && Number.isFinite(weightLbs) && (
            <p>{cubicFeet!.toFixed(1)} ft³ • {weightLbs} lbs</p>
          )}
          {Number.isFinite(estimatedValueCents) && (
            <p className="font-medium text-sv-deep-teal">
              ${(estimatedValueCents! / 100).toFixed(2)} value
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end space-x-2 border-t border-sv-sand pt-3">
          <button
            onClick={() => onViewDetails(item.id)}
            className="text-sm font-medium text-sv-slate hover:text-sv-deep-teal transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => onEdit(item.id)}
            className="text-sm font-medium text-sv-brown hover:text-sv-brown-hover transition-colors"
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
