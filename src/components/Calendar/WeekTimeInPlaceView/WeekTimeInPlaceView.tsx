import cn from 'classnames';
import React, { useMemo, FC } from 'react';
import {
  add,
  getDate,
  getMonth,
  getYear,
  isToday,
  startOfWeek,
  format,
} from 'date-fns';
import { DateInfo } from '../Calendar.types';
import { formatFullDate } from '../../../utils/index';
import {
  getKeyFromDateInfo,
  getTimeUnitString,
  onDayStringClickHandler,
} from '../Calendar.helper';
import { WeekInPlaceViewProps } from './WeekTimeInPlaceView.types';

const getDateInfo = (date: Date, currentMonth: number): DateInfo => {
  return {
    day: getDate(date),
    month: getMonth(date),
    year: getYear(date),
    isCurrentMonth: getMonth(date) === currentMonth,
    isCurrentDay: isToday(date),
    date: formatFullDate(date),
    timeDate: '',
    timeDateUTC: '',
  };
};

const WeekTimeInPlaceView: FC<WeekInPlaceViewProps> = ({
  renderItems,
  currentDate,
  onDayNumberClick,
  onDayStringClick,
  onHourClick,
  onColorDotClick,
  onCellClick,
  onCellHeaderClick,
  timeDateFormat,
  preparedColorDots,
  weekStartsOn,
  locale,
}) => {
  // Returns every day of the week
  const getCurrentWeek = useMemo(() => {
    const startOfWeekOptions = { weekStartsOn } as const;
    const startDate = startOfWeek(new Date(currentDate), startOfWeekOptions);

    const nextTimeUnit = getDate(add(startDate, { weeks: 1 }));

    const weekDates: DateInfo[] = [];
    let day = 0;

    while (
      getDate(
        startOfWeek(add(startDate, { days: day }), startOfWeekOptions),
      ) !== nextTimeUnit
    ) {
      weekDates.push(
        getDateInfo(
          add(startDate, { days: day }),
          getMonth(new Date(currentDate)),
        ),
      );
      day++;
    }

    return weekDates;
  }, [currentDate, weekStartsOn]);

  return (
    <>
      <div data-cy="StringDays" className="days-component">
        {Array.from(Array(7)).map((_, i) => (
          <div
            key={i}
            className="days-component__day"
            onClick={(e) =>
              onDayStringClick(
                onDayStringClickHandler(currentDate, i, weekStartsOn),
                e,
              )
            }
          >
            {format(
              add(startOfWeek(new Date(currentDate), { weekStartsOn }), {
                days: i,
              }),
              timeDateFormat.day,
              { locale },
            )}
          </div>
        ))}
      </div>
      <div
        data-cy="WeekTimeInPlaceViewInside"
        className="week-time-in-place-view-inside"
      >
        <div className="vertical-borders-container">
          {Array.from(Array(7)).map((_, key) => (
            <div
              key={key}
              data-cy="CellsBorder"
              className={cn(
                'vertical-borders-container',
                'vertical-borders-container__border',
              )}
            />
          ))}
        </div>
        <div className="week-in-place-header">
          {Array.from(Array(7)).map((_, i) => (
            <div
              key={i}
              className="week-in-place-cell-header"
              onClick={(e) => {
                const timeDate = getKeyFromDateInfo(getCurrentWeek[i], 0);
                onCellHeaderClick(
                  {
                    ...getCurrentWeek[i],
                    hour: 0,
                    timeDate,
                    timeDateUTC: new Date(timeDate).toISOString(),
                  },
                  e,
                );
              }}
            >
              <p
                data-cy="DayNumber"
                data-day-type={
                  getCurrentWeek[i].isCurrentDay
                    ? 'current'
                    : !getCurrentWeek[i].isCurrentMonth && 'disabled'
                }
                className={cn(
                  'week-in-place-cell-header__number',
                  !getCurrentWeek[i].isCurrentMonth &&
                    'week-in-place-cell-header__number--disabled',
                  getCurrentWeek[i].isCurrentDay &&
                    'week-in-place-cell-header__number--current-day',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onDayNumberClick(getCurrentWeek[i].date, e);
                }}
              >
                {getCurrentWeek[i].day}
              </p>
              {preparedColorDots.dateKeys?.[getCurrentWeek[i].date] && (
                <p
                  data-cy="ColorDot"
                  data-date={getCurrentWeek[i].date}
                  style={{
                    backgroundColor:
                      preparedColorDots.dateKeys[getCurrentWeek[i].date]?.color,
                  }}
                  className="week-in-place-cell-header__color-dot"
                  onClick={(e) => {
                    e.stopPropagation();
                    onColorDotClick(
                      preparedColorDots.dateKeys[getCurrentWeek[i].date],
                      e,
                    );
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div data-cy="Cells" className="week-in-place-row">
          {Array.from(Array(24)).map((_, hour) =>
            getCurrentWeek.map((dateInfo, idx) => (
              <div
                className={cn(
                  'week-in-place-row__hour-cell',
                  hour !== 23 && 'week-in-place-row__hour-cell--border-bottom',
                )}
                key={dateInfo.date}
                onClick={(e) => {
                  const timeDate = getKeyFromDateInfo(dateInfo, hour);
                  onCellClick(
                    {
                      ...dateInfo,
                      hour,
                      timeDate,
                      timeDateUTC: new Date(timeDate).toISOString(),
                    },
                    e,
                  );
                }}
              >
                {idx === 0 && (
                  <div
                    data-cy="Hours"
                    className="week-in-place-row__hour-cell-hour-number"
                    onClick={(e) => {
                      e.stopPropagation();
                      onHourClick(hour, e);
                    }}
                  >
                    {getTimeUnitString(hour - 1, timeDateFormat)}
                  </div>
                )}
                {renderItems({ dateInfo, hour, idx })}
              </div>
            )),
          )}
        </div>
      </div>
    </>
  );
};

export default WeekTimeInPlaceView;
