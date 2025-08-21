
export interface Trip {
  id: string;
  startDate: string; // ISO string format YYYY-MM-DD
  endDate: string;   // ISO string format YYYY-MM-DD
  purpose: string;
}

export interface EligibilityResult {
  residenceStartDate: Date | null;
  today: Date;
  totalDaysInResidencePeriod: number;
  totalDaysAbroad: number;
  qualifyingDaysAbroad: number;
  netQualifyingResidenceDays: number;
  requiredResidenceDays: number;
  isRequirementMetToday: boolean;
  remainingNetDays: number;
  earliestApplicationDate: Date | null;
  daysAbroadInFinalYear: number | null;
  warnings: string[];
  progress: number;
}
