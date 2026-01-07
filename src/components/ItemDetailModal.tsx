import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, getItemPhotoUrls } from '../lib/supabase';
import ItemTimeline from './ItemTimeline';
import QRCodeDisplay from './QRCodeDisplay';

interface ItemDetailModalProps {
  itemId: string;
  onClose: () => void;
}

export default function ItemDetailModal({ itemId, onClose }: ItemDetailModalProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      // SECURITY: Get user for double-guard filter
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // SECURITY: Explicit user_id filter (double-guard with RLS)
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Fetch photo URLs
  const { data: photoUrls = [] } = useQuery({
    queryKey: ['item-photos', item?.photo_paths],
    queryFn: () => getItemPhotoUrls(item!.photo_paths || []),
    enabled: !!item?.photo_paths && item.photo_paths.length > 0,
    staleTime: 1000 * 60 * 50, // 50 minutes
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-sv-cream rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-sv-midnight">{item?.label || 'Loading...'}</h2>
          <button onClick={onClose} className="btn-secondary px-3 py-1">×</button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-sv-slate mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sv-slate">Loading details...</p>
          </div>
        ) : item ? (
          <>
            {/* Photo Gallery Section */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Photos</h3>
              {photoUrls.length > 0 ? (
                <div className="space-y-3">
                  {/* Primary Image */}
                  <div className="w-full rounded-xl overflow-hidden bg-sv-bone">
                    <img
                      src={photoUrls[selectedPhotoIndex]}
                      alt={item.label}
                      className="w-full max-h-72 object-cover"
                    />
                  </div>
                  {/* Thumbnail Strip (if multiple photos) */}
                  {photoUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {photoUrls.map((url, index) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setSelectedPhotoIndex(index)}
                          className={`h-16 w-16 rounded-md overflow-hidden bg-sv-bone flex-shrink-0 transition-all ${
                            index === selectedPhotoIndex
                              ? 'ring-2 ring-sv-terracotta ring-offset-1'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No photos uploaded yet.</p>
              )}
            </section>

            {/* QR Code + Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-semibold text-sv-midnight mb-4">QR Code</h3>
                <QRCodeDisplay item={item} />
              </div>
              <div className="card">
                <h3 className="font-semibold text-sv-midnight mb-4">Item History</h3>
                <ItemTimeline itemId={item.id} />
              </div>
            </div>
          </>
        ) : (
          <p className="text-sv-slate text-center py-8">Could not load item details.</p>
        )}
      </div>
    </div>
  );
}
