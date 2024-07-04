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
