import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface ItemTimelineProps {
  itemId: string;
}

export default function ItemTimeline({ itemId }: ItemTimelineProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['inventory_events', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_events')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },
  });

  if (isLoading) {
    return <p className="text-sm text-sv-slate">Loading history...</p>;
  }

  if (!events || events.length === 0) {
    return <p className="text-sm text-sv-slate">No history yet for this item.</p>;
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-sv-slate/30" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-sv-slate flex items-center justify-center ring-4 ring-sv-bone">
                    <svg className="h-4 w-4 text-sv-bone" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-sv-midnight capitalize">
                      {event.event_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-sv-slate">
                    <time dateTime={event.created_at}>{format(new Date(event.created_at), 'MMM d, yyyy')}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
