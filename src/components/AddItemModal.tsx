import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase, logInventoryEventAuto, MAX_PHOTO_SIZE_MB, MAX_PHOTO_COUNT, uploadItemPhotos, validatePhotoFiles } from '../lib/supabase'

type Props = { onClose: () => void }

function dollarsToCents(v: string): number {
  if (!v || v.trim() === '') return 0  // Blank = $0
  const n = Number(v.replace(/[^\d.]/g, ''))
  if (!isFinite(n) || n < 0) throw new Error('Enter a valid dollar amount')
  return Math.round(n * 100)
}

function num(v: string, name: string): number {
  const n = Number(v)
  if (!isFinite(n) || n <= 0) throw new Error(`${name} must be > 0`)
  return n
}

export default function AddItemModal({ onClose }: Props) {
  const qc = useQueryClient()
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [valueUSD, setValueUSD] = useState('')
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth]   = useState('')
  const [height, setHeight] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Handle photo selection (multi-select, appends to existing)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []

    if (files.length === 0) return

    // Check combined count (existing + new)
    const totalAfterAdd = photos.length + files.length
    if (totalAfterAdd > MAX_PHOTO_COUNT) {
      setPhotoError(`Maximum ${MAX_PHOTO_COUNT} photos allowed. You have ${photos.length}, tried to add ${files.length}.`)
      e.currentTarget.value = ''  // Reset input for re-selection
      return
    }

    const { valid, error } = validatePhotoFiles(files)
    if (!valid) {
      setPhotoError(error || 'Invalid files.')
    } else {
      setPhotoError(null)
      // Append new files to existing photos
      setPhotos(prev => [...prev, ...files].slice(0, MAX_PHOTO_COUNT))
    }

    // Reset input so selecting same files triggers onChange again
    e.currentTarget.value = ''
  }

  // Remove a photo from the selection
  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoError(null)
  }

  // Set a photo as the cover (move to first position)
  const handleSetCover = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev]
      const [photo] = newPhotos.splice(index, 1)
      return [photo, ...newPhotos]
    })
  }

  const m = useMutation({
    mutationFn: async () => {
      setError(null)
      setPhotoError(null)

      // Validation
      if (label.trim().length < 3) throw new Error('Label: min 3 characters')
      if (description.trim().length < 3) throw new Error('Description: min 3 characters')
      if (photos.length === 0) throw new Error('At least 1 photo is required')
      if (photos.length > MAX_PHOTO_COUNT) throw new Error(`Maximum ${MAX_PHOTO_COUNT} photos allowed`)

      const { data: { user }, error: uerr } = await supabase.auth.getUser()
      if (uerr || !user) throw new Error('Not authenticated')

      // Validate photos (redundant check for safety)
      const { valid, error: validationError } = validatePhotoFiles(photos)
      if (!valid) throw new Error(validationError || 'Invalid photo files')

      // Parse numeric fields
      const estimated_value_cents = dollarsToCents(valueUSD)
      const weight_lbs  = num(weight, 'Weight (lbs)')
      const length_in   = num(length, 'Length (in)')
      const width_in    = num(width,  'Width (in)')
      const height_in   = num(height, 'Height (in)')

      // Upload all photos
      const { paths, errors } = await uploadItemPhotos(user.id, photos)
      if (errors.length > 0) {
        throw new Error(`Photo upload failed: ${errors.join(', ')}`)
      }
      if (paths.length === 0) {
        throw new Error('No photos were uploaded successfully')
      }

      const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean)

      // Insert item with photo_paths array (first photo is the cover)
      const { data: insertedData, error: insErr } = await supabase.from('items').insert({
        user_id: user.id,
        label: label.trim(),
        description: description.trim(),
        photo_paths: paths, // Use photo_paths array (not legacy photo_path)
        estimated_value_cents,
        weight_lbs,
        length_inches: length_in,
        width_inches: width_in,
        height_inches: height_in,
        tags: tagArr,
      })
      .select()
      .single()

      if (insErr) throw insErr

      // Log the creation event
      if (insertedData) {
        await logInventoryEventAuto(insertedData.id, 'item_created', {
          label: insertedData.label,
          value: insertedData.estimated_value_cents,
          photo_count: paths.length
        })
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['items'] })
      await qc.invalidateQueries({ queryKey: ['my-insurance'] })
      toast.success('Item added successfully')
    }
  })

  async function handleSubmit() {
    try {
      setBusy(true)
      await m.mutateAsync()
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to add item')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg bg-cream p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gunmetal">Add Item</h2>
          <button onClick={onClose} className="btn-secondary px-3 py-1">×</button>
        </div>

        {error && <div className="mb-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded p-2">{error}</div>}

        <label className="block text-sm text-gunmetal/80 mb-1">Title *</label>
        <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g., Holiday Decor" className="input w-full mb-4" />

        <label className="block text-sm text-gunmetal/80 mb-1">Description *</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Helpful notes so you can find this later" rows={3} className="input w-full mb-4" />

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gunmetal/80 mb-1">Estimated Value (USD)</label>
            <input value={valueUSD} onChange={e=>setValueUSD(e.target.value)} placeholder="Optional (e.g., 200)" inputMode="decimal" className="input w-full" />
          </div>
          <div>
            <label className="block text-sm text-gunmetal/80 mb-1">Tags (comma-separated)</label>
            <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="seasonal, decor" className="input w-full" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm text-gunmetal/80 mb-1">Length (in) *</label>
            <input value={length} onChange={e=>setLength(e.target.value)} inputMode="decimal" className="input w-full" />
          </div>
          <div>
            <label className="block text-sm text-gunmetal/80 mb-1">Width (in) *</label>
            <input value={width} onChange={e=>setWidth(e.target.value)} inputMode="decimal" className="input w-full" />
          </div>
          <div>
            <label className="block text-sm text-gunmetal/80 mb-1">Height (in) *</label>
            <input value={height} onChange={e=>setHeight(e.target.value)} inputMode="decimal" className="input w-full" />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm text-gunmetal/80 mb-1">Weight (lbs) *</label>
          <input value={weight} onChange={e=>setWeight(e.target.value)} inputMode="decimal" className="input w-full" />
        </div>

        {/* Photo Upload Section */}
        <div className="mt-4">
          <label className="block text-sm text-gunmetal/80 mb-2">
            Photos ({photos.length} / {MAX_PHOTO_COUNT}) *
          </label>

          {/* Photo Preview Grid */}
          {photos.length > 0 && (
            <div className="mb-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
              {photos.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Photo ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-md border-2 border-slate/30 transition-all group-hover:border-slate"
                  />
                  {/* Cover Badge (first photo is cover) */}
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-gunmetal text-bone text-xs px-2 py-0.5 rounded font-medium">
                      Cover
                    </div>
                  )}
                  {/* Set as Cover button (only show on non-cover photos) */}
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(index)}
                      className="absolute top-1 left-1 bg-slate/90 hover:bg-slate text-bone text-xs px-2 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Set as cover photo"
                    >
                      Set Cover
                    </button>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 flex items-center justify-center shadow-md"
                    title="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* File Input */}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotoChange}
            className="block w-full text-sm text-gunmetal
              file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
              file:text-sm file:font-semibold file:bg-slate file:text-bone
              hover:file:bg-gunmetal file:cursor-pointer cursor-pointer"
          />
          <p className="mt-1 text-xs text-gunmetal/60">
            JPG, PNG, or WebP only. Max {MAX_PHOTO_SIZE_MB}MB per photo. Select 1-{MAX_PHOTO_COUNT} photos at once.
            First photo is the cover image.
          </p>
          {photoError && (
            <p className="text-red-600 text-sm mt-2 bg-red-50 border border-red-200 rounded p-2">
              {photoError}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Adding…' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
