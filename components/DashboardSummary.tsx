import React from 'react';
import { EligibilityResult } from '../types';
import { MAX_TOTAL_ABROAD_DAYS_COUNTED, MAX_ABROAD_DAYS_IN_FINAL_YEAR, REQUIRED_RESIDENCE_YEARS } from '../constants';
import { CalendarIcon, InfoIcon } from './icons';

interface DashboardSummaryProps {
  results: EligibilityResult;
}

const StatCard: React.FC<{ title: React.ReactNode; value: React.ReactNode; subtitle?: string; colorClass?: string }> = ({ title, value, subtitle, colorClass = 'text-gray-900' }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className={`mt-1 text-3xl font-semibold ${colorClass}`}>{value}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

const daysToYearsMonthsDays = (totalDays: number): string => {
    if (totalDays <= 0) return '0 days';
    const years = Math.floor(totalDays / 365.25);
    const remainingDaysAfterYears = totalDays % 365.25;
    const months = Math.floor(remainingDaysAfterYears / 30.44);
    const days = Math.round(remainingDaysAfterYears % 30.44);

    let parts = [];
    if (years > 0) parts.push(`${years} ${years > 1 ? 'years' : 'year'}`);
    if (months > 0) parts.push(`${months} ${months > 1 ? 'months' : 'month'}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days > 1 ? 'days' : 'day'}`);
    return parts.join(', ');
};

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ results }) => {

  const getApplicationDateSubtitle = () => {
    if (!results.residenceStartDate) {
      return "Set a start date to begin calculation.";
    }
    if (!results.earliestApplicationDate) {
      return 'Calculating...';
    }
    if (results.isRequirementMetToday) {
      return "You are eligible to apply based on your residence history!";
    }
    return "Projected earliest date based on your travel history.";
  };
  
  return (
    <div className="bg-gray-100 p-6 md:p-8 rounded-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Citizenship Progress</h2>
      
      <div className="mb-6">
        <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-blue-700">Net Time in Finland Progress</span>
            <span className="text-sm font-medium text-blue-700">{Math.round(results.progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${results.progress}%` }}></div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
            Target: Accumulate {REQUIRED_RESIDENCE_YEARS} years of time physically in Finland.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 lg:col-span-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
                <CalendarIcon className="h-10 w-10 mr-4"/>
                <div>
                    <h3 className="text-lg font-semibold">Earliest Application Date</h3>
                    <p className="text-4xl font-bold">
                        {results.earliestApplicationDate ? formatDate(results.earliestApplicationDate) : 'Calculating...'}
                    </p>
                    <p className="text-sm mt-1">
                      {getApplicationDateSubtitle()}
                    </p>
                </div>
            </div>
        </div>

        <StatCard 
            title="Net Time in Finland" 
            value={daysToYearsMonthsDays(results.netQualifyingResidenceDays)} 
            subtitle={`You need ${daysToYearsMonthsDays(results.remainingNetDays)} more.`} 
        />
        <StatCard 
            title={
                <div className="flex items-center gap-2 group relative">
                    <span>Total Days Abroad</span>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        You have an allowance of {MAX_TOTAL_ABROAD_DAYS_COUNTED} days to be spent abroad. Only travel days that exceed this limit will push your earliest application date forward.
                        <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                    </div>
                </div>
            }
            value={results.totalDaysAbroad} 
            subtitle={`Penalty applied for days over ${MAX_TOTAL_ABROAD_DAYS_COUNTED}`} 
            colorClass={results.totalDaysAbroad > MAX_TOTAL_ABROAD_DAYS_COUNTED ? 'text-orange-600' : 'text-gray-900'}
        />
        <StatCard title="Days Abroad in Final Year" value={results.daysAbroadInFinalYear ?? 'N/A'} subtitle={`Max ${MAX_ABROAD_DAYS_IN_FINAL_YEAR} days allowed`} colorClass={(results.daysAbroadInFinalYear ?? 0) > MAX_ABROAD_DAYS_IN_FINAL_YEAR ? 'text-red-600' : 'text-gray-900'} />
      </div>

      {results.warnings.length > 0 && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex">
                  <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.008a1 1 0 011 1v3.008a1 1 0 01-1 1H9a1 1 0 01-1-1V5z" clipRule="evenodd" />
                      </svg>
                  </div>
                  <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Attention needed</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                              {results.warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DashboardSummary;
