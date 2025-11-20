import { formatZipList, isInServiceArea } from '../lib/serviceArea'

interface ServiceAreaAlertProps {
  zipCode: string | null | undefined
  showWhenValid?: boolean
  className?: string
}

export default function ServiceAreaAlert({
  zipCode,
  showWhenValid = false,
  className = ''
}: ServiceAreaAlertProps) {

  if (!zipCode) {
    return (
      <div className={`rounded-md bg-yellow-50 p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Service Area Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Please provide a valid ZIP code to check service availability.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const inServiceArea = isInServiceArea(zipCode)

  if (inServiceArea && showWhenValid) {
    return (
      <div className={`rounded-md bg-green-50 p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Service Available
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Great news! We provide service to {zipCode}.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!inServiceArea) {
    return (
      <div className={`rounded-md bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Outside Service Area
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Unfortunately, we don't serve {zipCode} yet.</p>
              <p className="mt-2">
                We currently provide service to these northern New Jersey ZIP codes: {formatZipList()}.
              </p>
              <p className="mt-2 font-medium">
                Join our waitlist to be notified when we expand to your area!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
