import AppLayout from './AppLayout'

interface WaitlistDashboardProps {
  profile: any
}

export default function WaitlistDashboard({ profile }: WaitlistDashboardProps) {
  const zipCode = profile?.delivery_address?.zip || 'your area'
  const needsRefund = profile?.needs_manual_refund || false

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-gunmetal to-slate rounded-xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-4">
            You're on the Storage Valet Waitlist! 🚀
          </h1>
          <p className="text-lg mb-6">
            We're excited about your interest in Storage Valet. We're currently expanding
            our service area and ZIP code {zipCode} will be one of our next priorities.
          </p>

          {needsRefund && (
            <div className="bg-bone/20 rounded-lg p-4 mb-6">
              <p className="font-semibold">Your $99 setup fee will be refunded within 3-5 business days.</p>
              <p className="text-sm mt-2">You won't be charged the monthly subscription until service is available in your area.</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You'll be the first to know when we launch in your area
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Priority access and special launch pricing
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Exclusive updates on our autonomous delivery expansion
            </p>
          </div>
        </div>

        {/* Current Service Areas */}
        <div className="bg-gunmetal-2 border border-slate rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold text-gunmetal mb-4">
            Current Service Areas (Northern New Jersey)
          </h2>
          <p className="text-bone mb-4">
            We're currently serving these ZIP codes with plans to expand based on demand:
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {['07001', '07002', '07003', '07004', '07005', '07006', '07007',
              '07008', '07009', '07010', '07011', '07012', '07013'].map(zip => (
              <div key={zip} className="bg-cream rounded-lg py-2 font-mono text-sm">
                {zip}
              </div>
            ))}
          </div>
        </div>

        {/* Expansion Timeline */}
        <div className="bg-gunmetal-2 border border-slate rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gunmetal mb-4">
            What's Coming Next
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-cream rounded-full flex items-center justify-center font-bold text-gunmetal">
                Q1
              </div>
              <div>
                <h3 className="font-semibold">Service Area Expansion</h3>
                <p className="text-bone">
                  Based on waitlist demand, we'll expand to high-interest ZIP codes first
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-cream rounded-full flex items-center justify-center font-bold text-gunmetal">
                Q2
              </div>
              <div>
                <h3 className="font-semibold">Autonomous Delivery Testing</h3>
                <p className="text-bone">
                  Pilot program for contactless, autonomous pickup and delivery
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-cream rounded-full flex items-center justify-center font-bold text-gunmetal">
                Q3
              </div>
              <div>
                <h3 className="font-semibold">Regional Launch</h3>
                <p className="text-bone">
                  Full service across the tri-state area with enhanced features
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
