import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase, deleteItemPhotos, getItemPhotoUrl, logInventoryEventAuto } from '../lib/supabase'

interface DeleteConfirmModalProps {
  itemId: string
  onClose: () => void
}

export default function DeleteConfirmModal({ itemId, onClose }: DeleteConfirmModalProps) {
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Fetch item details to display in the confirmation
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('label, photo_path, photo_paths')
        .eq('id', itemId)
        .single()
      if (error) throw new Error(error.message)

      // Fetch signed URL for first photo
      if (data) {
        // Migration 0004: Read from photo_paths[] first, fallback to legacy photo_path
        const firstPhotoPath = data.photo_paths && data.photo_paths.length > 0
          ? data.photo_paths[0]
          : data.photo_path

        if (firstPhotoPath) {
          const url = await getItemPhotoUrl(firstPhotoPath)
          setPhotoUrl(url)
        }
      }

      return data
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      setIsDeleting(true)

      // Log deletion event BEFORE deleting (so we have item data)
      await logInventoryEventAuto(
        id,
        'item_deleted',
        {
          label: item?.label || 'Unknown item'
        }
      )

      // Delete associated photos from storage
      if (item) {
        // Migration 0004: Handle both photo_paths[] array and legacy photo_path
        const photoPaths = item.photo_paths && item.photo_paths.length > 0
          ? item.photo_paths
          : item.photo_path
          ? [item.photo_path]
          : []

        if (photoPaths.length > 0) {
          await deleteItemPhotos(photoPaths)
        }
      }

      // Delete the item record from the database
      // Note: inventory_events will cascade delete automatically (ON DELETE CASCADE)
      const { error: dbError } = await supabase.from('items').delete().eq('id', id)
      if (dbError) throw new Error(`Failed to delete item: ${dbError.message}`)
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['my-insurance'] }) // Affects insurance total
      onClose()
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
    onSettled: () => {
      setIsDeleting(false)
    },
  })

  const handleDelete = () => {
    if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
      deleteItemMutation.mutate(itemId)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gunmetal-2 border border-slate rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-cream mb-4">Confirm Deletion</h2>

        <div className="text-sm text-bone space-y-4">
          <p className="font-medium text-red-400">
            ⚠️ Are you sure you want to permanently delete this item?
          </p>
          <p>
            This action <strong>cannot be undone</strong>. All photos, history, and associated data will be permanently removed.
          </p>

          {isLoading ? (
            <div className="mt-4 h-20 bg-slate animate-pulse rounded-md" />
          ) : item ? (
            <div className="mt-4 flex items-center space-x-4 p-4 bg-slate rounded-md border border-slate">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={item.label}
                  className="h-16 w-16 object-cover rounded-md border border-slate"
                />
              ) : (
                <div className="h-16 w-16 bg-slate rounded-md flex items-center justify-center text-bone/50 text-xs">
                  No Photo
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-cream">{item.label}</p>
                <p className="text-xs text-bone/70 mt-1">
                  {item.photo_paths?.length || (item.photo_path ? 1 : 0)} photo(s)
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-400">Error loading item details.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || !item}
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
