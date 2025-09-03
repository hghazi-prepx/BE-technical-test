import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import calendar from 'dayjs/plugin/calendar';
import duration from 'dayjs/plugin/duration';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(weekday);
dayjs.extend(calendar);
dayjs.extend(duration);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

export const myDayjs = dayjs;

export const getMonthSpanDates = (year: number, month: number) => {
  if (!year || !month) return [myDayjs().format(), myDayjs().format()];

  const fromDate = myDayjs()
    .set('year', year)
    .set('month', month - 1)
    .startOf('month')
    .format();
  const toDate = myDayjs()
    .set('year', year)
    .set('month', month - 1)
    .endOf('month')
    .format();
  return [fromDate, toDate];
};

export const getYearSpanDates = (year: number) => {
  if (!year) return [myDayjs().format(), myDayjs().format()];

  const fromDate = myDayjs().set('year', year).startOf('year').format();
  const toDate = myDayjs().set('year', year).endOf('year').format();
  return [fromDate, toDate];
};

export const formatDate = (date: Date) => {
  return myDayjs(date).format('DD MMMM YYYY');
};
