export const EPOCH = 1734307200_000; // Monday, Dec 16, 2024 @ 00:00 UTC+0; should logically be the start of winter in 1999 iteration 0
export const KAHL_EPOCH = 1391990400_000; // Monday, Feb 10, 2014 @ 00:00 UTC+0; should logically be WeekCount 0 for KahlSyndicate

const millisecondsPerSecond = 1000;
const secondsPerMinute = 60;
const minutesPerHour = 60;
const hoursPerDay = 24;
const daysPerWeek = 7;

const unixSecond = millisecondsPerSecond;
const unixMinute = secondsPerMinute * millisecondsPerSecond;
const unixHour = unixMinute * minutesPerHour;
const unixDay = hoursPerDay * unixHour;
const unixWeek = daysPerWeek * unixDay;

export const unixTimesInMs = {
    second: unixSecond,
    minute: unixMinute,
    hour: unixHour,
    day: unixDay,
    week: unixWeek
};
