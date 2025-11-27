import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import ItemTimeline from './ItemTimeline';
import QRCodeDisplay from './QRCodeDisplay';

interface ItemDetailModalProps {
  itemId: string;
  onClose: () => void;
}

export default function ItemDetailModal({ itemId, onClose }: ItemDetailModalProps) {
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('*').eq('id', itemId).single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-cream rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gunmetal">{item?.label || 'Loading...'}</h2>
          <button onClick={onClose} className="btn-secondary px-3 py-1">×</button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-slate mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gunmetal/70">Loading details...</p>
          </div>
        ) : item ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gunmetal mb-4">QR Code</h3>
              <QRCodeDisplay item={item} />
            </div>
            <div className="card">
              <h3 className="font-semibold text-gunmetal mb-4">Item History</h3>
              <ItemTimeline itemId={item.id} />
            </div>
          </div>
        ) : (
          <p className="text-gunmetal/70 text-center py-8">Could not load item details.</p>
        )}
      </div>
    </div>
  );
}
