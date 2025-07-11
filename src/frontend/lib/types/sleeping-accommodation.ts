export enum AccommodationType {
  Room = 0,
  Tent = 1,
  Camper = 2,
  Other = 3
}

export interface SleepingAccommodation {
  id: string;
  name: string;
  type: AccommodationType;
  maxCapacity: number;
  isActive: boolean;
  createdAt: string;
  changedAt?: string;
}

export interface CreateSleepingAccommodationDto {
  name: string;
  type: AccommodationType;
  maxCapacity: number;
}

export interface UpdateSleepingAccommodationDto {
  name: string;
  type: AccommodationType;
  maxCapacity: number;
  isActive: boolean;
}