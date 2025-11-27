import { useEffect, useState } from 'react'
import { InlineWidget } from 'react-calendly'

interface CalendlyEmbedProps {
  url?: string
  onClose?: () => void
}

// Default Calendly URL - can be overridden via props or env var
const DEFAULT_CALENDLY_URL = import.meta.env.VITE_CALENDLY_URL || 'https://calendly.com/zach-mystoragevalet'

export default function CalendlyEmbed({ url = DEFAULT_CALENDLY_URL, onClose }: CalendlyEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Listen for Calendly iframe load event
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-cream rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate/20">
          <h2 className="text-lg font-semibold text-gunmetal">Book an Appointment</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-secondary px-3 py-1"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        {/* Calendly Widget */}
        <div className="flex-1 relative min-h-[600px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-cream z-10">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-slate mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gunmetal/70">Loading scheduler...</p>
              </div>
            </div>
          )}
          <InlineWidget
            url={url}
            styles={{
              height: '100%',
              minHeight: '600px',
            }}
            pageSettings={{
              backgroundColor: 'f8f4f0',
              hideEventTypeDetails: false,
              hideLandingPageDetails: false,
              primaryColor: '2f4b4d',
              textColor: '162726',
            }}
          />
        </div>
      </div>
    </div>
  )
}
