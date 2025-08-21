import { Trip, EligibilityResult } from '../types';
import { 
  REQUIRED_RESIDENCE_DAYS, 
  MAX_TOTAL_ABROAD_DAYS_COUNTED, 
  MAX_ABROAD_DAYS_IN_FINAL_YEAR, 
  CONTINUOUS_ABSENCE_YEARS_LIMIT,
  MS_IN_DAY,
  REQUIRED_RESIDENCE_YEARS
} from '../constants';

// Helper to parse date string as UTC to avoid timezone issues
const parseUTCDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

// Helper to get difference in days, rounding up
const diffInDays = (d1: Date, d2: Date): number => {
  return Math.ceil((d2.getTime() - d1.getTime()) / MS_IN_DAY);
};

const getDaysAbroadInPeriod = (periodStart: Date, periodEnd: Date, trips: Trip[]): number => {
  let total = 0;
  for (const trip of trips) {
    const tripStart = parseUTCDate(trip.startDate);
    const tripEnd = parseUTCDate(trip.endDate);
    
    const overlapStart = new Date(Math.max(periodStart.getTime(), tripStart.getTime()));
    const overlapEnd = new Date(Math.min(periodEnd.getTime(), tripEnd.getTime()));

    if (overlapStart < overlapEnd) {
      total += diffInDays(overlapStart, overlapEnd);
    }
  }
  return total;
};

export const calculateEligibility = (
  residenceStartDateStr: string | null,
  trips: Trip[]
): EligibilityResult => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const initialResult: EligibilityResult = {
    residenceStartDate: residenceStartDateStr ? parseUTCDate(residenceStartDateStr) : null,
    today,
    totalDaysInResidencePeriod: 0,
    totalDaysAbroad: 0,
    qualifyingDaysAbroad: 0,
    netQualifyingResidenceDays: 0,
    requiredResidenceDays: REQUIRED_RESIDENCE_DAYS,
    isRequirementMetToday: false,
    remainingNetDays: REQUIRED_RESIDENCE_DAYS,
    earliestApplicationDate: null,
    daysAbroadInFinalYear: null,
    warnings: [],
    progress: 0,
  };

  if (!residenceStartDateStr) {
    initialResult.warnings.push('Please set your residence start date.');
    return initialResult;
  }
  
  const residenceStartDate = parseUTCDate(residenceStartDateStr);

  if (residenceStartDate > today) {
    initialResult.warnings.push('Residence start date cannot be in the future.');
    return initialResult;
  }
  
  const sortedTrips = [...trips].sort((a, b) => parseUTCDate(a.startDate).getTime() - parseUTCDate(b.startDate).getTime());
  
  for (const trip of sortedTrips) {
      const tripDuration = diffInDays(parseUTCDate(trip.startDate), parseUTCDate(trip.endDate));
      if (tripDuration >= CONTINUOUS_ABSENCE_YEARS_LIMIT * 365.25) {
          initialResult.warnings.push(`A trip from ${trip.startDate} to ${trip.endDate} exceeds the ${CONTINUOUS_ABSENCE_YEARS_LIMIT}-year continuous absence limit, which may reset your residence period.`);
      }
  }

  const totalDaysAbroad = sortedTrips.reduce((acc, trip) => {
    const tripStart = parseUTCDate(trip.startDate);
    if(tripStart < residenceStartDate) return acc;
    return acc + diffInDays(tripStart, parseUTCDate(trip.endDate));
  }, 0);

  // --- NEW: Calculate Earliest Application Date based on penalty model ---
  let earliestApplicationDate: Date | null = null;
  let daysAbroadInFinalYear: number | null = null;

  // 1. Calculate base date: start date + 5 years
  const baseApplicationDate = new Date(residenceStartDate.getTime());
  baseApplicationDate.setUTCFullYear(baseApplicationDate.getUTCFullYear() + REQUIRED_RESIDENCE_YEARS);
  // Add fraction for leap years
  baseApplicationDate.setUTCDate(baseApplicationDate.getUTCDate() + Math.ceil(REQUIRED_RESIDENCE_YEARS * 0.25) -1);


  // 2. Calculate penalty days (days abroad over the allowance)
  const penaltyDays = Math.max(0, totalDaysAbroad - MAX_TOTAL_ABROAD_DAYS_COUNTED);
  
  // 3. Add penalty to base date
  let potentialDate = new Date(baseApplicationDate.getTime());
  potentialDate.setUTCDate(potentialDate.getUTCDate() + penaltyDays);

  // 4. Iterate forward from potential date to satisfy final year rule
  // Safety break after 10 years of iterations to prevent infinite loops
  for (let i = 0; i < 365 * 10; i++) {
      const oneYearBefore = new Date(potentialDate.getTime());
      oneYearBefore.setUTCFullYear(oneYearBefore.getUTCFullYear() - 1);
      
      const abroadDays = getDaysAbroadInPeriod(oneYearBefore, potentialDate, sortedTrips);

      if (abroadDays <= MAX_ABROAD_DAYS_IN_FINAL_YEAR) {
          earliestApplicationDate = potentialDate;
          daysAbroadInFinalYear = abroadDays;
          break;
      }
      potentialDate.setUTCDate(potentialDate.getUTCDate() + 1);
  }

  // --- Recalculate other metrics for display ---
  const totalDaysInResidencePeriod = diffInDays(residenceStartDate, today);
  const netQualifyingResidenceDays = totalDaysInResidencePeriod - totalDaysAbroad;
  
  const isRequirementMetToday = earliestApplicationDate ? earliestApplicationDate <= today : false;
  const remainingNetDays = Math.max(0, REQUIRED_RESIDENCE_DAYS - netQualifyingResidenceDays);
  
  // Update warnings based on new logic
  if (penaltyDays > 0) {
    initialResult.warnings.push(`You have ${totalDaysAbroad} total days abroad. The ${penaltyDays} days over the ${MAX_TOTAL_ABROAD_DAYS_COUNTED}-day allowance have pushed your application date forward.`);
  }

  if (earliestApplicationDate && potentialDate > new Date(baseApplicationDate.getTime())) {
     const ruleBrokenWarningExists = initialResult.warnings.some(w => w.includes('final year'));
      if (daysAbroadInFinalYear && daysAbroadInFinalYear > MAX_ABROAD_DAYS_IN_FINAL_YEAR && !ruleBrokenWarningExists) {
        initialResult.warnings.push(`The ${MAX_ABROAD_DAYS_IN_FINAL_YEAR}-day limit for travel in the final year of residence has pushed your application date forward.`);
      }
  }


  return {
    ...initialResult,
    totalDaysInResidencePeriod,
    totalDaysAbroad,
    qualifyingDaysAbroad: Math.min(totalDaysAbroad, MAX_TOTAL_ABROAD_DAYS_COUNTED),
    netQualifyingResidenceDays,
    isRequirementMetToday,
    remainingNetDays,
    earliestApplicationDate,
    daysAbroadInFinalYear,
    progress: Math.min(100, (netQualifyingResidenceDays / REQUIRED_RESIDENCE_DAYS) * 100),
  };
};
