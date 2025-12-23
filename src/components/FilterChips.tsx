type ItemStatus = 'all' | 'home' | 'scheduled' | 'stored';

interface FilterChipsProps {
  activeStatus: ItemStatus;
  onStatusChange: (status: ItemStatus) => void;
  // We can add category filters here in a future step
}

const statuses: ItemStatus[] = ['all', 'home', 'scheduled', 'stored'];

export default function FilterChips({ activeStatus, onStatusChange }: FilterChipsProps) {
  const getChipClass = (status: ItemStatus) => {
    const baseClass = 'px-3 py-1 text-sm font-medium rounded-full cursor-pointer transition-colors';
    if (status === activeStatus) {
      return `${baseClass} bg-sv-terracotta text-white`;
    }
    return `${baseClass} bg-sv-bone text-sv-slate hover:bg-sv-sand`;
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-sv-slate">Filter by status:</span>
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={getChipClass(status)}
        >
          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
        </button>
      ))}
    </div>
  );
}
