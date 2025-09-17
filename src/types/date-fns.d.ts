// Type declarations for date-fns v4.1.0
// Since @types/date-fns is not available for v4.1.0, we provide basic types

declare module 'date-fns' {
  export function format(date: Date | number | string, formatStr: string): string;
  export function parseISO(dateString: string): Date;
  export function isValid(date: Date | number | string): boolean;
  export function addDays(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function startOfDay(date: Date | number): Date;
  export function endOfDay(date: Date | number): Date;
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
}
