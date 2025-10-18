import React from 'react';

type ItemStatus = 'all' | 'home' | 'in_transit' | 'stored';

interface FilterChipsProps {
  activeStatus: ItemStatus;
  onStatusChange: (status: ItemStatus) => void;
  // We can add category filters here in a future step
}

const statuses: ItemStatus[] = ['all', 'home', 'in_transit', 'stored'];

export default function FilterChips({ activeStatus, onStatusChange }: FilterChipsProps) {
  const getChipClass = (status: ItemStatus) => {
    const baseClass = 'px-3 py-1 text-sm font-medium rounded-full cursor-pointer transition-colors';
    if (status === activeStatus) {
      return `${baseClass} bg-indigo-600 text-white`;
    }
    return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`;
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-600">Filter by status:</span>
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
