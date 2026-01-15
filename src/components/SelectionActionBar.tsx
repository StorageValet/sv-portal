// Storage Valet — Selection Action Bar Component
// v1.0 • Floating batch action bar for item selection with iOS safe area

interface SelectionActionBarProps {
  selectedCount: number
  selectedHomeCount: number
  selectedStoredCount: number
  canSchedule: boolean
  onSchedulePickup: () => void
  onScheduleRedelivery: () => void
  onClearSelection: () => void
}

export default function SelectionActionBar({
  selectedCount,
  selectedHomeCount,
  selectedStoredCount,
  canSchedule,
  onSchedulePickup,
  onScheduleRedelivery,
  onClearSelection,
}: SelectionActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
      {/* iOS safe area padding */}
      <div className="bg-sv-deep-teal text-white shadow-2xl pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Selection info */}
            <div className="flex items-center space-x-3">
              <span className="bg-sv-brown text-white text-sm font-bold px-2.5 py-1 rounded-full">
                {selectedCount}
              </span>
              <div className="text-sm">
                <span className="font-medium">item{selectedCount !== 1 ? 's' : ''} selected</span>
                {(selectedHomeCount > 0 || selectedStoredCount > 0) && (
                  <span className="text-sv-white/70 ml-2">
                    ({selectedHomeCount > 0 && `${selectedHomeCount} at home`}
                    {selectedHomeCount > 0 && selectedStoredCount > 0 && ', '}
                    {selectedStoredCount > 0 && `${selectedStoredCount} stored`})
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {/* Schedule Pickup - only for home items */}
              <button
                onClick={onSchedulePickup}
                disabled={!canSchedule || selectedHomeCount === 0}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !canSchedule || selectedHomeCount === 0
                    ? 'bg-sv-white/20 text-sv-white/50 cursor-not-allowed'
                    : 'bg-sv-brown hover:bg-sv-brown-hover text-white'
                }`}
                title={
                  !canSchedule
                    ? 'Address required and must be in service area'
                    : selectedHomeCount === 0
                      ? 'Select items at home to schedule pickup'
                      : `Schedule pickup for ${selectedHomeCount} item${selectedHomeCount !== 1 ? 's' : ''}`
                }
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Pickup ({selectedHomeCount})
              </button>

              {/* Schedule Redelivery - only for stored items */}
              <button
                onClick={onScheduleRedelivery}
                disabled={!canSchedule || selectedStoredCount === 0}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !canSchedule || selectedStoredCount === 0
                    ? 'bg-sv-white/20 text-sv-white/50 cursor-not-allowed'
                    : 'bg-sv-accent hover:bg-sv-accent/80 text-white'
                }`}
                title={
                  !canSchedule
                    ? 'Address required and must be in service area'
                    : selectedStoredCount === 0
                      ? 'Select items in storage to schedule redelivery'
                      : `Schedule redelivery for ${selectedStoredCount} item${selectedStoredCount !== 1 ? 's' : ''}`
                }
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Delivery ({selectedStoredCount})
              </button>

              {/* Clear selection */}
              <button
                onClick={onClearSelection}
                className="p-2 text-sv-white/70 hover:text-white rounded-lg hover:bg-sv-white/10 transition-colors"
                title="Clear selection"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
