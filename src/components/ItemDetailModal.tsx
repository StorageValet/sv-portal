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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gunmetal-2 border border-slate rounded-lg shadow-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-cream">{item?.label || 'Loading...'}</h2>
            <button onClick={onClose} className="text-bone/70 hover:text-cream">&times;</button>
        </div>

        {isLoading ? <p>Loading details...</p> : item ? (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Details & QR Code</h3>
                    <QRCodeDisplay item={item} />
                </div>
                 <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Item History</h3>
                    <ItemTimeline itemId={item.id} />
                </div>
            </div>
        ) : <p>Could not load item details.</p>}
      </div>
    </div>
  );
}
