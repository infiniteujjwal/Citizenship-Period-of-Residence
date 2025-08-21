
import React from 'react';
import { Trip } from '../types';
import { TrashIcon, CalendarIcon } from './icons';

interface TripListProps {
  trips: Trip[];
  onDeleteTrip: (id: string) => void;
}

const TripList: React.FC<TripListProps> = ({ trips, onDeleteTrip }) => {
  const sortedTrips = [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  const diffInDays = (d1Str: string, d2Str: string): number => {
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Trips Abroad ({trips.length})</h3>
      {trips.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No trips added yet. Add your trips to start calculating.</p>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {sortedTrips.map(trip => (
            <li key={trip.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <CalendarIcon className="h-6 w-6 text-gray-400 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{trip.startDate} to {trip.endDate}</p>
                  <p className="text-sm text-gray-500">
                    {trip.purpose || 'General Travel'} - <span className="font-semibold">{diffInDays(trip.startDate, trip.endDate)} days</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDeleteTrip(trip.id)}
                className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label={`Delete trip from ${trip.startDate}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TripList;
