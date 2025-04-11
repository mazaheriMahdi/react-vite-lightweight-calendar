import cn from 'classnames';
import React, { ReactElement } from 'react';
import '../../styles/styles.scss';
import {
  formatFullDate,
  formatHour,
  formatMonthDayHour,
  prepareCalendarData,
  prepareCalendarDataInPlace,
  prepareCalendarDataWithTime,
  prepareCalendarDataWithTimeReverse,
} from '../../utils/index';
import Styleguide from '../StyleGuide/StyleGuide';
import {
  getHeaderItemInfo,
  getKeyFromDateInfo,
  initializeProps,
  shouldCollapse,
  shouldShowItem,
} from './Calendar.helper';
import {
  CalendarWrapperProps,
  CurrentView,
  DateInfoFunction,
  PreparedDataWithTimeFull,
  PreparedDataWithTimeInPlace,
  PreparedDataWithoutTime,
} from './Calendar.types';
import CalendarComponent from './CalendarComponent';

const CalendarWrapper: React.FC<CalendarWrapperProps> = ({
  data,
  renderItem,
  renderItemText,
  renderHeaderItem,
  renderHeaderItemText,
  disableHoverEffect,
  currentDate,
  setCurrentDate,
  activeTimeDateField,
  currentView,
  cellDisplayMode,
  colorDots,
  onDayNumberClick,
  onDayStringClick,
  onHourClick,
  onColorDotClick,
  onItemClick,
  onItemDrag,
  onCellClick,
  onCellHeaderClick,
  timeDateFormat,
  weekStartsOn,
  locale,
  todayLabel,
}) => {
  // Preparing the data to work for all cases
  const {
    cellDisplayModeModified,
    timeDateFormatModified,
    onDayNumberClickModified,
    onDayStringClickModified,
    onHourClickModified,
    onColorDotClickModified,
    onItemClickModified,
    onCellClickModified,
    onCellHeaderClickModified,
    weekStartsOnModified,
    currentDateModified,
    currentViewModified,
    dataModified,
    activeTimeDateFieldModified,
    localeModified,
    todayLabelModified,
  } = initializeProps({
    cellDisplayMode,
    timeDateFormat,
    onDayNumberClick,
    onDayStringClick,
    onHourClick,
    onColorDotClick,
    onCellHeaderClick,
    onItemClick,
    onCellClick,
    weekStartsOn,
    currentDate,
    currentView,
    activeTimeDateField,
    data,
    locale,
    todayLabel,
  });

  const [hoveredElement, setHoveredElement] = React.useState(0);
  const [startIntervalKey, endIntervalKey] = (activeTimeDateFieldModified ?? '')
    .split('-')
    .map((str) => str.replace(/\s/g, '')) as [string, string];

  // Prepared data based on curentView so that for each item in the array there is all needed data
  const preparedData:
    | PreparedDataWithTimeFull
    | Record<string, PreparedDataWithoutTime[]>[]
    | PreparedDataWithTimeInPlace = React.useMemo(() => {
    switch (currentViewModified) {
      case CurrentView.DAY_REVERSE:
        return prepareCalendarDataWithTimeReverse(
          dataModified,
          activeTimeDateFieldModified,
        );
      case CurrentView.DAY:
      case CurrentView.WEEK_TIME:
        return prepareCalendarDataWithTime(
          dataModified,
          activeTimeDateFieldModified,
        );
      case CurrentView.MONTH:
      case CurrentView.WEEK:
        return prepareCalendarData(
          dataModified,
          activeTimeDateFieldModified,
          weekStartsOnModified,
        );
      case CurrentView.DAY_IN_PLACE:
      case CurrentView.WEEK_IN_PLACE:
        return prepareCalendarDataInPlace(
          dataModified,
          activeTimeDateFieldModified,
        );
    }
  }, [
    dataModified,
    activeTimeDateFieldModified,
    currentViewModified,
    weekStartsOnModified,
  ]);

  // A method that will render elements for four views
  // MONTH, WEEK, WEEK_IN_PLACE and DAY_IN_PLACE views
  const renderMonthWeekDayInPlaceWeekInPlaceItems = ({
    dateInfo,
    idx,
    hour,
  }: DateInfoFunction): ReactElement[] => {
    const key =
      hour || hour === 0
        ? getKeyFromDateInfo(dateInfo, hour)
        : formatFullDate(new Date(dateInfo.date));

    const isCollapsed = shouldCollapse(
      cellDisplayModeModified,
      currentViewModified,
      key,
    );

    // If a cell is collapsed, only the last item will be displayed
    const arrayData: PreparedDataWithoutTime[] =
      (isCollapsed ? preparedData?.[key]?.slice(-1) : preparedData?.[key]) ||
      [];

    return arrayData.map((preparedDataItem, index) => {
      const shoudShow = shouldShowItem(
        preparedDataItem,
        key,
        cellDisplayModeModified,
        currentViewModified,
        preparedData,
        currentDateModified,
      );
      const rightMargin = [
        CurrentView.DAY_IN_PLACE,
        CurrentView.WEEK_IN_PLACE,
      ].includes(currentViewModified);
      return shoudShow ? (
        <div
          key={`${index}-${dateInfo.date}`}
          style={{
            gridColumn: `${idx + 1} / ${
              idx + (isCollapsed ? 1 : preparedDataItem?.length || 1) + 1
            }`,
          }}
          onMouseEnter={() =>
            !disableHoverEffect && setHoveredElement(preparedDataItem?.id)
          }
          onMouseLeave={() => !disableHoverEffect && setHoveredElement(0)}
          className={cn(
            'item',
            hoveredElement === preparedDataItem.id && 'item--hovered',
            rightMargin && 'item--right-margin',
          )} drag
          onClick={(e) => {
            e.stopPropagation();
            onItemClickModified(preparedDataItem, e);
          }}
        >
          {renderItem ? (
            renderItem(preparedDataItem, hoveredElement === preparedDataItem.id)
          ) : (
            <div
              className={cn(
                'sub-item',
                hoveredElement === preparedDataItem.id && 'sub-item--hovered',
                preparedDataItem?.isStart && 'sub-item--left-border',
              )}
              style={{
                backgroundColor: preparedDataItem?.bgColor,
                color: preparedDataItem?.textColor,
              }}
            >
              <div>
                {renderItemText ? (
                  renderItemText(preparedDataItem)
                ) : (
                  <>
                    <div>{preparedDataItem?.title}</div>
                    <div>
                      {formatMonthDayHour(
                        new Date(preparedDataItem[startIntervalKey]),
                      )}
                      {endIntervalKey &&
                        `${
                          ' - ' +
                          formatMonthDayHour(
                            new Date(preparedDataItem[endIntervalKey]),
                          )
                        }`}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <></>
      );
    });
  };

  // A method that will render elements for two views
  // DAY and WEEK_TIME views
  const renderDayWeekTimeItems = ({
    dateInfo,
  }: DateInfoFunction): ReactElement[] => {
    const key = formatFullDate(new Date(dateInfo.date));

    const isDayReverseView = currentView === CurrentView.DAY_REVERSE;
    return ((preparedData as PreparedDataWithTimeFull).day[key] || []).map(
      (preparedDataItem, index) => {
        return (
          <div
            key={`${index}-${dateInfo.date}`}
            style={{
              [!isDayReverseView
                ? 'gridRow'
                : 'gridColumn']: `${preparedDataItem.startMinute} / ${preparedDataItem.endMinute}`,
              width: !isDayReverseView && preparedDataItem.width,
              left: !isDayReverseView && preparedDataItem.left,
              margin: !isDayReverseView && preparedDataItem.margin,
            }}
            onMouseEnter={() =>
              !disableHoverEffect && setHoveredElement(preparedDataItem?.id)
            }
            onMouseLeave={() => !disableHoverEffect && setHoveredElement(0)}
            className={cn(
              'item',
              hoveredElement === preparedDataItem.id && 'item--hovered',
            )}
            onClick={(e) => onItemClickModified(preparedDataItem, e)}
          >
            {renderItem ? (
              renderItem(
                preparedDataItem,
                hoveredElement === preparedDataItem.id,
              )
            ) : (
              <div
                className={cn(
                  'sub-item',
                  hoveredElement === preparedDataItem.id && 'sub-item--hovered',
                  preparedDataItem.endMinute - preparedDataItem.startMinute <=
                    40 && 'sub-item--small-size',
                )}
                style={{
                  backgroundColor: preparedDataItem?.bgColor,
                  color: preparedDataItem?.textColor,
                }}
              >
                {renderItemText ? (
                  renderItemText(preparedDataItem)
                ) : (
                  <>
                    <div>{preparedDataItem?.title}</div>
                    <div>
                      {formatHour(new Date(preparedDataItem[startIntervalKey]))}
                      {endIntervalKey &&
                        `${
                          ' - ' +
                          formatHour(new Date(preparedDataItem[endIntervalKey]))
                        }`}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      },
    );
  };

  // The method renders the elements in the header on two views (DAY and WEEK_TIME)
  const renderHeaderItems = (
    startDate: string,
    endDate?: string,
  ): (JSX.Element | null)[] => {
    const weekItems = preparedData as PreparedDataWithTimeFull;

    return weekItems.week.map((preparedDataItem, index) => {
      // Based on the intersection of the intervals, it is decided where the element should be positioned
      const { gridColumn, isFromPrevious, isFromNext } = getHeaderItemInfo(
        startDate,
        endDate || startDate,
        preparedDataItem[startIntervalKey],
        preparedDataItem[endIntervalKey],
        weekStartsOnModified,
      );

      if (!gridColumn) {
        return null;
      }

      return (
        <div
          key={`${index}-${startDate}`}
          style={{
            gridColumn,
          }}
          className="item"
        >
          {renderHeaderItem ? (
            renderHeaderItem(preparedDataItem, {
              gridColumn,
              isFromPrevious,
              isFromNext,
            })
          ) : (
            <div
              className={cn(
                'sub-item',
                isFromPrevious && 'sub-item--left-arrow',
                isFromNext && 'sub-item--right-arrow',
              )}
              onClick={(e) => {
                e.stopPropagation();
                onItemClickModified(preparedDataItem, e);
              }}
              style={{
                backgroundColor: preparedDataItem?.bgColor,
                color: preparedDataItem?.textColor,
              }}
            >
              {renderHeaderItemText ? (
                renderHeaderItemText(preparedDataItem)
              ) : (
                <div>{preparedDataItem?.title}</div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const renderItems = React.useMemo(() => {
    switch (currentViewModified) {
      case CurrentView.DAY:
      case CurrentView.DAY_REVERSE:
      case CurrentView.WEEK_TIME:
        return renderDayWeekTimeItems;
      case CurrentView.MONTH:
      case CurrentView.WEEK:
      case CurrentView.WEEK_IN_PLACE:
      case CurrentView.DAY_IN_PLACE:
        return renderMonthWeekDayInPlaceWeekInPlaceItems;
      default:
        return renderMonthWeekDayInPlaceWeekInPlaceItems;
    }
  }, [
    currentViewModified,
    cellDisplayMode,
    hoveredElement,
    activeTimeDateFieldModified,
    disableHoverEffect,
    weekStartsOn,
    preparedData,
  ]);

  return (
    <>
      <Styleguide />
      <CalendarComponent
        renderItems={renderItems}
        renderHeaderItems={renderHeaderItems}
        setCurrentDate={setCurrentDate}
        currentView={currentViewModified}
        colorDots={colorDots}
        currentDate={currentDateModified}
        onDayNumberClick={onDayNumberClickModified}
        onDayStringClick={onDayStringClickModified}
        onHourClick={onHourClickModified}
        onColorDotClick={onColorDotClickModified}
        onCellClick={onCellClickModified}
        onCellHeaderClick={onCellHeaderClickModified}
        timeDateFormat={timeDateFormatModified}
        weekStartsOn={weekStartsOnModified}
        locale={localeModified}
        todayLabel={todayLabelModified}
      />
    </>
  );
};

export default CalendarWrapper;
