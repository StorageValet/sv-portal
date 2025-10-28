import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase, validatePhotoFiles, uploadItemPhotos, deleteItemPhotos, getItemPhotoUrls, logInventoryEventAuto } from '../lib/supabase'

interface EditItemModalProps {
  itemId: string
  onClose: () => void
}

// Helper functions
const dollarsToCents = (dollars: number) => Math.round(dollars * 100)
const centsToDollars = (cents: number) => (cents / 100).toFixed(2)
const num = (value: string | number) => Number(value) || 0

export default function EditItemModal({ itemId, onClose }: EditItemModalProps) {
  const queryClient = useQueryClient()
  const [photos, setPhotos] = useState<File[]>([])
  const [existingPhotoPaths, setExistingPhotoPaths] = useState<string[]>([])
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([])
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch the item's current data
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
  })

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['item', itemId],
    enabled: !!user && !!itemId,
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', user.id) // IDOR fix: verify ownership
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  })

  useEffect(() => {
    if (item) {
      // Migration 0004: Read from photo_paths[] array first, fallback to legacy photo_path
      const paths = item.photo_paths && item.photo_paths.length > 0
        ? item.photo_paths
        : item.photo_path
        ? [item.photo_path]
        : []

      setExistingPhotoPaths(paths)

      // Fetch signed URLs for existing photos
      if (paths.length > 0) {
        getItemPhotoUrls(paths).then(urls => {
          setExistingPhotoUrls(urls)
        })
      }
    }
  }, [item])

  const editItemMutation = useMutation({
    mutationFn: async (updatedItem: {
      label: string
      description: string
      estimated_value_cents: number
      weight_lbs: number
      length_inches: number
      width_inches: number
      height_inches: number
      tags: string[]
      newPhotos: File[]
      photoPathsToKeep: string[]
    }) => {
      setIsSubmitting(true)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error('Could not find user.')

      // Upload new photos
      let newPhotoPaths: string[] = []
      if (updatedItem.newPhotos.length > 0) {
        const { paths, errors } = await uploadItemPhotos(userData.user.id, updatedItem.newPhotos)
        if (errors.length > 0) {
          throw new Error(`Photo upload failed: ${errors.join(', ')}`)
        }
        newPhotoPaths = paths
      }

      const finalPhotoPaths = [...updatedItem.photoPathsToKeep, ...newPhotoPaths]

      // Update item in database FIRST (before deleting photos)
      const { error: updateError } = await supabase
        .from('items')
        .update({
          label: updatedItem.label,
          description: updatedItem.description,
          estimated_value_cents: updatedItem.estimated_value_cents,
          weight_lbs: updatedItem.weight_lbs,
          length_inches: updatedItem.length_inches,
          width_inches: updatedItem.width_inches,
          height_inches: updatedItem.height_inches,
          tags: updatedItem.tags,
          photo_paths: finalPhotoPaths,
        })
        .eq('id', itemId)
        .eq('user_id', userData.user.id) // IDOR fix: verify ownership

      if (updateError) throw new Error(`Failed to update item: ${updateError.message}`)

      // Delete photos that were removed (AFTER successful DB update)
      const photosToDelete = (item.photo_paths || [item.photo_path].filter(Boolean))
        .filter((p: string) => !updatedItem.photoPathsToKeep.includes(p))

      if (photosToDelete.length > 0) {
        await deleteItemPhotos(photosToDelete)
      }

      // Log inventory event
      await logInventoryEventAuto(
        itemId,
        'item_updated',
        {
          changed_fields: Object.keys(updatedItem).filter(k => k !== 'newPhotos' && k !== 'photoPathsToKeep')
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['my-insurance'] })
      onClose()
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    const totalPhotos = files.length + existingPhotoPaths.length

    if (totalPhotos > 5) {
      setPhotoError('You can upload a maximum of 5 photos in total.')
      return
    }

    const { valid, error } = validatePhotoFiles(files)
    if (!valid) {
      setPhotoError(error || 'Invalid files.')
      setPhotos([])
    } else {
      setPhotoError(null)
      setPhotos(files)
    }
  }

  const handleRemoveExistingPhoto = (path: string) => {
    setExistingPhotoPaths(prev => prev.filter(p => p !== path))
    setExistingPhotoUrls(prev => {
      const index = existingPhotoPaths.indexOf(path)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleRemoveNewPhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    const formData = new FormData(e.currentTarget)
    const newPhotos = photos

    const totalPhotos = newPhotos.length + existingPhotoPaths.length
    if (totalPhotos === 0 || totalPhotos > 5) {
      setPhotoError('Please select between 1 and 5 photos in total.')
      return
    }

    const updatedItem = {
      label: formData.get('label') as string,
      description: formData.get('description') as string,
      estimated_value_cents: dollarsToCents(num(formData.get('value') as string)),
      weight_lbs: num(formData.get('weight') as string),
      length_inches: num(formData.get('length') as string),
      width_inches: num(formData.get('width') as string),
      height_inches: num(formData.get('height') as string),
      tags: (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean),
      newPhotos: newPhotos,
      photoPathsToKeep: existingPhotoPaths,
    }

    editItemMutation.mutate(updatedItem)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <p className="text-white">Loading item...</p>
      </div>
    )
  }

  if (isError || !item) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <p className="text-white">Error loading item.</p>
      </div>
    )
  }

  const isLocked = !!item.physical_locked_at

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Item</h2>

        {isLocked && (
          <div className="p-3 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 border border-yellow-200" role="alert">
            <span className="font-medium">🔒 Physical data locked.</span> Dimensions and weight cannot be changed because this item has been picked up.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div>
            <label htmlFor="label" className="block text-sm font-medium text-gray-700">
              Label *
            </label>
            <input
              type="text"
              name="label"
              id="label"
              required
              minLength={3}
              defaultValue={item.label}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              name="description"
              id="description"
              required
              minLength={3}
              rows={3}
              defaultValue={item.description}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Estimated Value */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700">
              Estimated Value (USD) *
            </label>
            <input
              type="number"
              name="value"
              id="value"
              required
              min="0.01"
              step="0.01"
              defaultValue={centsToDollars(item.estimated_value_cents)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Weight (Physical Lock Enforced) */}
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
              Weight (lbs) * {isLocked && '🔒'}
            </label>
            <input
              type="number"
              name="weight"
              id="weight"
              required
              min="0.01"
              step="0.01"
              defaultValue={item.weight_lbs}
              disabled={isLocked}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Dimensions (Physical Lock Enforced) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="length" className="block text-sm font-medium text-gray-700">
                Length (in) * {isLocked && '🔒'}
              </label>
              <input
                type="number"
                name="length"
                id="length"
                required
                min="0.01"
                step="0.01"
                defaultValue={item.length_inches}
                disabled={isLocked}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                Width (in) * {isLocked && '🔒'}
              </label>
              <input
                type="number"
                name="width"
                id="width"
                required
                min="0.01"
                step="0.01"
                defaultValue={item.width_inches}
                disabled={isLocked}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                Height (in) * {isLocked && '🔒'}
              </label>
              <input
                type="number"
                name="height"
                id="height"
                required
                min="0.01"
                step="0.01"
                defaultValue={item.height_inches}
                disabled={isLocked}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              id="tags"
              defaultValue={item.tags?.join(', ') || ''}
              placeholder="e.g., fragile, seasonal, electronics"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Photo Management */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Photos ({existingPhotoPaths.length + photos.length} / 5) *
            </label>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-4">
              {/* Existing photos with signed URLs */}
              {existingPhotoPaths.map((path, index) => (
                <div key={path} className="relative">
                  <img
                    src={existingPhotoUrls[index] || ''}
                    alt={`Existing ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingPhoto(path)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* New photos to upload */}
              {photos.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewPhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <input
              type="file"
              name="photos"
              id="photos"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              JPG, PNG, or WebP only. Max 5MB per photo. Total 1-5 photos.
            </p>
            {photoError && (
              <p className="text-red-500 text-sm mt-1">{photoError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
