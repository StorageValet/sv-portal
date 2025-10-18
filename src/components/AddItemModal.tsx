import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, logInventoryEventAuto } from '../lib/supabase'

type Props = { onClose: () => void }

function dollarsToCents(v: string): number {
  const n = Number(v.replace(/[^\d.]/g, ''))
  if (!isFinite(n) || n <= 0) throw new Error('Enter a valid dollar amount')
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
  const [file, setFile] = useState<File | null>(null)
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const m = useMutation({
    mutationFn: async () => {
      setError(null)
      if (label.trim().length < 3) throw new Error('Label: min 3 characters')
      if (description.trim().length < 3) throw new Error('Description: min 3 characters')
      if (!file) throw new Error('A photo is required')

      const { data: { user }, error: uerr } = await supabase.auth.getUser()
      if (uerr || !user) throw new Error('Not authenticated')

      const okTypes = ['image/jpeg','image/png','image/webp']
      if (!okTypes.includes(file.type)) throw new Error('Photo must be JPG, PNG, or WebP')
      if (file.size > 5 * 1024 * 1024) throw new Error('Photo must be ≤ 5MB')

      const estimated_value_cents = dollarsToCents(valueUSD)
      const weight_lbs  = num(weight, 'Weight (lbs)')
      const length_in   = num(length, 'Length (in)')
      const width_in    = num(width,  'Width (in)')
      const height_in   = num(height, 'Height (in)')

      const ext = file.type.split('/')[1] || 'jpg'
      const path = `${user.id}/${Date.now()}_0.${ext}`
      const { error: upErr } = await supabase.storage.from('item-photos').upload(path, file, { upsert: false })
      if (upErr) throw upErr

      const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean)

      const { data: insertedData, error: insErr } = await supabase.from('items').insert({
        user_id: user.id,
        label: label.trim(),
        description: description.trim(),
        photo_path: path,
        estimated_value_cents,
        weight_lbs, length_inches: length_in, width_inches: width_in, height_inches: height_in,
        tags: tagArr,
        details: { photos: [path] }
      })
      .select()
      .single()

      if (insErr) throw insErr

      // Log the creation event
      if (insertedData) {
        await logInventoryEventAuto(insertedData.id, 'item_created', {
          label: insertedData.label,
          value: insertedData.estimated_value_cents
        })
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['items'] })
      await qc.invalidateQueries({ queryKey: ['my-insurance'] })
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
      <div className="w-full max-w-xl rounded-lg bg-pebble-linen p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-velvet-night">Add Item</h2>
          <button onClick={onClose} className="btn-outline">×</button>
        </div>

        {error && <div className="mb-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded p-2">{error}</div>}

        <label className="block text-sm text-deep-harbor mb-1">Title *</label>
        <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g., Holiday Decor" className="form-input w-full mb-4" />

        <label className="block text-sm text-deep-harbor mb-1">Description *</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Helpful notes so you can find this later" rows={3} className="form-input w-full mb-4" />

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-deep-harbor mb-1">Estimated Value (USD) *</label>
            <input value={valueUSD} onChange={e=>setValueUSD(e.target.value)} placeholder="e.g., 200" inputMode="decimal" className="form-input w-full" />
          </div>
          <div>
            <label className="block text-sm text-deep-harbor mb-1">Tags (comma-separated)</label>
            <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="seasonal, decor" className="form-input w-full" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm text-deep-harbor mb-1">Length (in) *</label>
            <input value={length} onChange={e=>setLength(e.target.value)} inputMode="decimal" className="form-input w-full" />
          </div>
          <div>
            <label className="block text-sm text-deep-harbor mb-1">Width (in) *</label>
            <input value={width} onChange={e=>setWidth(e.target.value)} inputMode="decimal" className="form-input w-full" />
          </div>
          <div>
            <label className="block text-sm text-deep-harbor mb-1">Height (in) *</label>
            <input value={height} onChange={e=>setHeight(e.target.value)} inputMode="decimal" className="form-input w-full" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm text-deep-harbor mb-1">Weight (lbs) *</label>
            <input value={weight} onChange={e=>setWeight(e.target.value)} inputMode="decimal" className="form-input w-full" />
          </div>
          <div>
            <label className="block text-sm text-deep-harbor mb-1">Photo (JPG/PNG/WebP • ≤5MB) *</label>
            <input type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e)=>setFile((e.target.files && e.target.files[0]) || null)} className="block w-full" />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={handleSubmit} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Adding…' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
