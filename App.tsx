import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trip, EligibilityResult } from './types';
import { calculateEligibility } from './services/residenceCalculator';
import DashboardSummary from './components/DashboardSummary';
import TripForm from './components/TripForm';
import TripList from './components/TripList';
import { FlagIcon } from './components/icons';

const App: React.FC = () => {
    const [residenceStartDate, setResidenceStartDate] = useState<string | null>(() => {
        return localStorage.getItem('residenceStartDate');
    });
    const [trips, setTrips] = useState<Trip[]>(() => {
        const savedTrips = localStorage.getItem('trips');
        return savedTrips ? JSON.parse(savedTrips) : [];
    });

    useEffect(() => {
        if (residenceStartDate) {
            localStorage.setItem('residenceStartDate', residenceStartDate);
        } else {
            localStorage.removeItem('residenceStartDate');
        }
    }, [residenceStartDate]);

    useEffect(() => {
        localStorage.setItem('trips', JSON.stringify(trips));
    }, [trips]);

    const eligibilityResults: EligibilityResult = useMemo(() => {
        return calculateEligibility(residenceStartDate, trips);
    }, [residenceStartDate, trips]);

    const handleAddTrip = useCallback((tripData: Omit<Trip, 'id'>) => {
        const newTrip: Trip = { ...tripData, id: new Date().getTime().toString() };
        setTrips(prevTrips => [...prevTrips, newTrip]);
    }, []);

    const handleDeleteTrip = useCallback((id: string) => {
        setTrips(prevTrips => prevTrips.filter(trip => trip.id !== id));
    }, []);

    const handleClearData = () => {
        if(window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
            setResidenceStartDate(null);
            setTrips([]);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center">
                        <FlagIcon className="h-8 w-auto mr-3"/>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Finnish Citizenship Residence Tracker
                        </h1>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0 space-y-8">
                    <DashboardSummary results={eligibilityResults} />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-1 space-y-8">
                             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Residence Start Date</h3>
                                <p className="text-sm text-gray-600 mb-4">Enter the date your continuous residence period in Finland began (e.g., first residence permit start date).</p>
                                <input
                                    type="date"
                                    value={residenceStartDate || ''}
                                    onChange={(e) => setResidenceStartDate(e.target.value)}
                                    className="block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 text-gray-900"
                                />
                            </div>
                            <TripForm onAddTrip={handleAddTrip} />
                        </div>
                        <div className="lg:col-span-2">
                            <TripList trips={trips} onDeleteTrip={handleDeleteTrip} />
                        </div>
                    </div>
                    <div className="text-center pt-4">
                        <button 
                            onClick={handleClearData}
                            className="text-sm text-gray-500 hover:text-red-600 hover:underline"
                        >
                            Clear all data
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;