/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ColumnInstance, Column, DefaultSortTypes } from 'react-table';
import { extent as d3Extent, max as d3Max } from 'd3-array';
import { FaSort, FaSortUp as FaSortAsc, FaSortDown as FaSortDesc } from 'react-icons/fa';
import { t } from '@superset-ui/translation';
import { DataRecordValue, DataRecord } from '@superset-ui/chart';
import { Modal, Button, InputGroup, FormControl, FormGroup } from 'react-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'react-datetime/css/react-datetime.css';
import Datetime from 'react-datetime';
import moment from 'moment';
import { TableChartTransformedProps, DataType, DataColumnMeta } from './types';
import DataTable, { DataTableProps, SearchInputProps, SizeOption } from './DataTable';
import Styles from './Styles';
import formatValue from './utils/formatValue';
import { PAGE_SIZE_OPTIONS } from './controlPanel';
type ValueRange = [number, number];

/**
 * Return sortType based on data type
 */
function getSortTypeByDataType(dataType: DataType): DefaultSortTypes {
  if (dataType === DataType.DateTime) {
    return 'datetime';
  }
  if (dataType === DataType.String) {
    return 'alphanumeric';
  }
  return 'basic';
}

/**
 * Cell background to render columns as horizontal bar chart
 */
/* function cellBar({
  value,
  valueRange,
  colorPositiveNegative = false,
  alignPositiveNegative,
}: {
  value: number;
  valueRange: ValueRange;
  colorPositiveNegative: boolean;
  alignPositiveNegative: boolean;
}) {
  const [minValue, maxValue] = valueRange;
  const r = colorPositiveNegative && value < 0 ? 150 : 0;
  if (alignPositiveNegative) {
    const perc = Math.abs(Math.round((value / maxValue) * 100));
    // The 0.01 to 0.001 is a workaround for what appears to be a
    // CSS rendering bug on flat, transparent colors
    return (
      `linear-gradient(to right, rgba(${r},0,0,0.2), rgba(${r},0,0,0.2) ${perc}%, ` +
      `rgba(0,0,0,0.01) ${perc}%, rgba(0,0,0,0.001) 100%)`
    );
  }
  const posExtent = Math.abs(Math.max(maxValue, 0));
  const negExtent = Math.abs(Math.min(minValue, 0));
  const tot = posExtent + negExtent;
  const perc1 = Math.round((Math.min(negExtent + value, negExtent) / tot) * 100);
  const perc2 = Math.round((Math.abs(value) / tot) * 100);
  // The 0.01 to 0.001 is a workaround for what appears to be a
  // CSS rendering bug on flat, transparent colors
  return (
    `linear-gradient(to right, rgba(0,0,0,0.01), rgba(0,0,0,0.001) ${perc1}%, ` +
    `rgba(${r},0,0,0.2) ${perc1}%, rgba(${r},0,0,0.2) ${perc1 + perc2}%, ` +
    `rgba(0,0,0,0.01) ${perc1 + perc2}%, rgba(0,0,0,0.001) 100%)`
  );
} */

function SortIcon({ column }: { column: ColumnInstance }) {
  const { isSorted, isSortedDesc } = column;
  let sortIcon = null;
  if (isSorted) {
    sortIcon = isSortedDesc ? (
      <FaSortDesc className="sort-column-icon" />
    ) : (
      <FaSortAsc className="sort-column-icon" />
    );
  }
  return sortIcon;
}

// This is a custom filter UI for selecting
// multiple option from a list
const SelectControl = ({
  column: { filterValue, id },
  globalSelectControl: GlobalSelectControl,
  appliedFilersObject,
  updateSearchInputFilterArray,
  columnLabel,
  preGlobalFilteredRows,
}) => {
  const options = React.useMemo(() => {
    const options = new Set();
    preGlobalFilteredRows.forEach(row => {
      options.add(row.values[id]);
    });
    return [...options.values()];
  }, [id, preGlobalFilteredRows]);

  return (
    <GlobalSelectControl
      className="tableFilterModalSelector"
      options={options.map((option, i) => ({ value: i, label: option }))}
      onChange={e => {
        updateSearchInputFilterArray(id, e && e.length ? e.map(i => i.label) : undefined);
      }}
      autoSize={false}
      value={
        appliedFilersObject && appliedFilersObject.value
          ? appliedFilersObject.value.map(i => ({
              value: options && options.length ? options.indexOf(i) : null,
              label: i,
            }))
          : null
      }
      isMulti
      placeholder={`Select ${columnLabel}`}
      maxMenuHeight={140}
    />
  );
};

// This is a custom date filter UI for selecting since and untill date
const BetweenDateControl = ({
  column: { filterValue, id },
  appliedFilersObject,
  updateSearchInputFilterArray,
}) => {
  const MOMENT_FORMAT = 'MM/DD/YYYY';
  const [state, setState] = useState({
    since:
      appliedFilersObject && appliedFilersObject.value && appliedFilersObject.value.length
        ? new Date(appliedFilersObject.value[0])
        : undefined,
    until:
      appliedFilersObject && appliedFilersObject.value && appliedFilersObject.value.length
        ? new Date(appliedFilersObject.value[1])
        : undefined,
    showSinceCalendar: false,
    showUntilCalendar: false,
    sinceViewMode: 'days',
    untilViewMode: 'days',
  });

  const setCustomStartEnd = (key, value) => {
    const closeCalendar =
      (key === 'since' && state.sinceViewMode === 'days') ||
      (key === 'until' && state.untilViewMode === 'days');
    setState({
      ...state,
      [key]: typeof value === 'string' ? value : value.format(MOMENT_FORMAT),
      showSinceCalendar: state.showSinceCalendar && !closeCalendar,
      showUntilCalendar: state.showUntilCalendar && !closeCalendar,
      sinceViewMode: closeCalendar ? 'days' : state.sinceViewMode,
      untilViewMode: closeCalendar ? 'days' : state.untilViewMode,
    });
    if (key === 'since') updateSearchInputFilterArray(id, [new Date(value), new Date(state.until)]);
    else if (key === 'until') {
      value.endOf('day');
      updateSearchInputFilterArray(id, [new Date(state.since), new Date(value)]);
    }
  };

  const isValidMoment = s => {
    return s === moment(s, MOMENT_FORMAT).format(MOMENT_FORMAT);
  };

  const isValidSince = date => {
    return !isValidMoment(state.until) || date <= moment(state.until, MOMENT_FORMAT);
  };

  const isValidUntil = date => {
    return !isValidMoment(state.since) || date >= moment(state.since, MOMENT_FORMAT);
  };

  const toggleCalendar = key => {
    const nextState = {};
    if (key === 'showSinceCalendar') {
      nextState.showSinceCalendar = !state.showSinceCalendar;
      if (!state.showSinceCalendar) {
        nextState.showUntilCalendar = false;
      }
    } else if (key === 'showUntilCalendar') {
      nextState.showUntilCalendar = !state.showUntilCalendar;
      if (!state.showUntilCalendar) {
        nextState.showSinceCalendar = false;
      }
    }
    setState({
      ...state,
      ...nextState,
    });
  };

  const renderInput = (props, key) => {
    return (
      <FormGroup>
        <InputGroup bsSize="small">
          <FormControl {...props} type="text" onClick={() => {}} />
          <InputGroup.Button onClick={() => toggleCalendar(key)}>
            <Button>
              <i className="fa fa-calendar" />
            </Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    );
  };

  return (
    <InputGroup
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'start',
      }}
    >
      <span
        style={{
          color: '#202C56',
          fontFamily: "'Roboto', sans-serif",
          fontWeight: '700',
          fontSize: '13px',
        }}
      >
        From
      </span>
      <div style={{ margin: '0px 20px 0px 20px', height: '30px' }}>
        <Datetime
          timeFormat={false}
          value={state.since || ''}
          defaultValue={state.since}
          viewDate={state.since}
          onChange={value => setCustomStartEnd('since', value)}
          isValidDate={isValidSince}
          renderInput={props => renderInput(props, 'showSinceCalendar')}
          open={state.showSinceCalendar}
          viewMode={state.sinceViewMode}
          onViewModeChange={sinceViewMode => setState({ ...state, sinceViewMode })}
          inputProps={{ placeholder: 'Select Date', disabled: true }}
        />
      </div>
      <span
        style={{
          color: '#202C56',
          fontFamily: "'Roboto', sans-serif",
          fontWeight: '700',
          fontSize: '13px',
        }}
      >
        To
      </span>
      <div style={{ marginLeft: '20px', height: '30px' }}>
        <Datetime
          timeFormat={false}
          value={state.until || ''}
          defaultValue={state.until}
          viewDate={state.until}
          onChange={value => setCustomStartEnd('until', value)}
          isValidDate={isValidUntil}
          renderInput={props => renderInput(props, 'showUntilCalendar')}
          open={state.showUntilCalendar}
          viewMode={state.untilViewMode}
          onViewModeChange={untilViewMode => setState({ ...state, untilViewMode })}
          inputProps={{ placeholder: 'Select Date', disabled: true }}
        />
      </div>
    </InputGroup>
  );
};

function SearchInput({
  count,
  value,
  onChange,
  setValue,
  exportCSV,
  tableHeader,
  customTableHeader,
  uniqueTableIdForPDFDownload,
  filterComponentArray,
  columnFilter,
  getKeyOrLableContent,
  globalSelectControl,
  applyColumnFilter,
  preGlobalFilteredRows,
  data,
  editMode,
}: SearchInputProps) {
  const [show, setShow] = useState(false);
  const [searchInputFilterArray, setSearchInputFilterArray] = useState(columnFilter || []);

  const updateSearchInputFilterArray = (id, value) => {
    let isValueUpdated = false;
    const tempSearchInputFilterArray = JSON.parse(JSON.stringify(searchInputFilterArray));
    tempSearchInputFilterArray.forEach(i => {
      if (i.id === id) {
        i.value = value;
        isValueUpdated = true;
      }
    });
    if (!isValueUpdated) {
      tempSearchInputFilterArray.push({ id, value });
      isValueUpdated = true;
    }
    setSearchInputFilterArray(tempSearchInputFilterArray);
  };

  return (
    <>
      <span className="dt-global-filter">
        <img
          alt="Reset"
          src={`/static/assets/images/icons/Reset Table Filter.png`}
          style={{
            width: '16px',
            height: '16px',
            margin: '8px 0px',
            cursor: 'pointer',
            marginRight: filterComponentArray && filterComponentArray.length > 0 ? '0px' : '15px',
          }}
          onClick={() => {
            setSearchInputFilterArray([]);
            applyColumnFilter([]);
            setValue('');
          }}
        />
        {filterComponentArray && filterComponentArray.length > 0 && (
          <img
            alt="Filter"
            src={`/static/assets/images/icons/Table Filter.png`}
            style={{
              width: '17px',
              height: '16px',
              margin: '8px 15px',
              cursor: 'pointer',
            }}
            onClick={() => setShow(!show)}
          />
        )}
        <div className="table-search-input-with-icon">
          <div className="table-search-input-box-icon">
            <i className="fa fa-search" />
          </div>
          <input
            className="table-search-input form-control input-sm"
            placeholder={t('Search...')}
            value={value}
            onChange={onChange}
          />
        </div>
        <img
          onClick={() => {
            html2canvas(
              document.querySelector('#' + 'custom-table' + uniqueTableIdForPDFDownload),
              {
                scrollX: 0,
                scrollY: -window.scrollY,
              },
            ).then(canvas => {
              let wid: number;
              let hgt: number;
              const imgData = canvas.toDataURL(
                'image/png',
                (wid = canvas.width),
                (hgt = canvas.height),
              );
              var hratio = hgt / wid;
              const pdf = new jsPDF('l', 'pt', 'a4');
              let width = pdf.internal.pageSize.getWidth();
              var newHeight = pdf.internal.pageSize.getHeight();
              let height = (width - 20) * hratio;
              let yOffSet = (newHeight - height) / 2;
              pdf.addImage(
                imgData,
                'PNG',
                10,
                yOffSet > 0 || yOffSet < newHeight / 2 ? yOffSet : 10,
                width - 20,
                height > newHeight ? newHeight - 20 : height,
                null,
                'MEDIUM',
              );
              pdf.save(tableHeader + '.pdf');
            });
          }}
          alt="PDF"
          src={`/static/assets/images/icons/PDF.png`}
          style={{
            width: '19px',
            height: '25px',
            margin: '0px 10px 0px 15px',
            cursor: 'pointer',
          }}
        />
        {!editMode && (
          <img
            onClick={() => {
              if (exportCSV && typeof exportCSV === 'function') {
                exportCSV();
              }
            }}
            alt="XLS"
            src={`/static/assets/images/icons/XLS.png`}
            style={{
              width: '19px',
              height: '25px',
              cursor: 'pointer',
            }}
          />
        )}
      </span>
      <Modal
        className="tableFilterModal"
        style={{ display: 'flex', alignItems: 'center' }}
        show={show}
        onHide={() => {
          setShow(false);
          setSearchInputFilterArray(columnFilter || []);
        }}
        bsStyle="large"
      >
        <Modal.Header
          style={{
            padding: '25px 23px 26px',
            borderBottom: 'none',
          }}
          closeButton
        >
          <Modal.Title
            style={{
              color: '#202C56',
              fontFamily: "'Roboto', sans-serif",
              fontWeight: '700',
              fontSize: '22px',
              margin: '0px 0px 0px 27px',
            }}
          >
            {t('Filter')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            padding: '0px 50px',
          }}
        >
          <hr style={{ margin: '0px 0px 30px 0px', borderTop: '#D3DBF6 1px solid' }} />
          {filterComponentArray &&
            filterComponentArray.map(column => {
              const appliedFilers = searchInputFilterArray.filter(i => i.id === column.id);
              const columnLabel = getKeyOrLableContent(column.Header);

              return (
                <div style={{ marginBottom: '30px', display: 'flex' }} key={column.Header}>
                  <div
                    style={{
                      fontFamily: "'Roboto', sans-serif",
                      textAlign: 'left',
                      letterSpacing: '0px',
                      color: '#202C56',
                      opacity: '1',
                      fontWeight: '700',
                      fontSize: '15px',
                      width: '25%',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {columnLabel}
                  </div>
                  <div style={{ width: '75%' }}>
                    {column.dataType == 'datetime' ? (
                      <BetweenDateControl
                        column={column}
                        appliedFilersObject={appliedFilers ? appliedFilers[0] || {} : {}}
                        updateSearchInputFilterArray={updateSearchInputFilterArray}
                      />
                    ) : (
                      <SelectControl
                        columnLabel={columnLabel}
                        globalSelectControl={globalSelectControl}
                        column={column}
                        appliedFilersObject={appliedFilers ? appliedFilers[0] || {} : {}}
                        updateSearchInputFilterArray={updateSearchInputFilterArray}
                        preGlobalFilteredRows={preGlobalFilteredRows}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          <hr style={{ margin: '0px', borderTop: '#D3DBF6 1px solid' }} />
        </Modal.Body>
        <Modal.Footer style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
          <Button
            type="button"
            className="btn"
            style={{
              textTransform: 'unset',
              height: '35px',
              width: '147px',
              background:
                'transparent linear-gradient(270deg, #B3C3EF 0%, #7C90DB 100%) 0% 0% no-repeat padding-box',
              borderRadius: '18px',
              border: 'none',
              color: 'white',
              fontWeight: '700',
              fontSize: '13px',
            }}
            onClick={() => {
              applyColumnFilter(searchInputFilterArray);
              setShow(false);
            }}
          >
            {t('Apply')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default function TableChart<D extends DataRecord = DataRecord>(
  props: TableChartTransformedProps<D> & {
    sticky?: DataTableProps<D>['sticky'];
  },
) {
  const {
    height,
    width,
    data,
    columns: columnsMeta,
    fixedColumns,
    filterColumns,
    videoPlatformMerge,
    showVideoTitleThumbnail,
    alignPositiveNegative = false,
    /* colorPositiveNegative = false, */
    includeSearch = false,
    pageSize = 0,
    showCellBars = true,
    emitFilter = false,
    sortDesc = false,
    onChangeFilter,
    filters: initialFilters,
    sticky = true, // whether to use sticky header
    tableHeader,
    customTableHeader,
    tableDescription,
    exportCSV,
    getKeyOrLableContent,
    getColorGradientArray,
    globalSelectControl,
    colorScheme,
    editMode,
  } = props;

  const [filters, setFilters] = useState(initialFilters);

  // only take relevant page size options
  const pageSizeOptions = useMemo(
    () => PAGE_SIZE_OPTIONS.filter(([n, _]) => n <= 2 * data.length) as SizeOption[],
    [data.length],
  );

  const getValueRange = useCallback(
    function getValueRange(key: string) {
      if (typeof data?.[0]?.[key] === 'number') {
        const nums = data.map(row => row[key]) as number[];
        return (alignPositiveNegative
          ? [0, d3Max(nums.map(Math.abs))]
          : d3Extent(nums)) as ValueRange;
      }
      return null;
    },
    [alignPositiveNegative, data],
  );

  const isActiveFilterValue = useCallback(
    function isActiveFilterValue(key: string, val: DataRecordValue) {
      return !!filters && filters[key]?.includes(val);
    },
    [filters],
  );

  const toggleFilter = useCallback(
    function toggleFilter(key: string, val: DataRecordValue) {
      const updatedFilters = { ...(filters || {}) };
      if (filters && isActiveFilterValue(key, val)) {
        updatedFilters[key] = filters[key].filter((x: DataRecordValue) => x !== val);
      } else {
        updatedFilters[key] = [...(filters?.[key] || []), val];
      }
      setFilters(updatedFilters);
      if (onChangeFilter) {
        onChangeFilter(updatedFilters);
      }
    },
    [filters, isActiveFilterValue, onChangeFilter],
  );

  const getColumnConfigs = useCallback(
    (column: DataColumnMeta, i: number, columnArrayJustForLengthPurpose: Array): Column<D> => {
      const timeFiltersArray = ['published_date', 'crawled_date', 'as_of_date', 'created_date'];
      const { key, dataType } = column;
      let { label } = column;
      let isDateFilterType = false;

      timeFiltersArray.map(i => {
        if (key.includes(i)) isDateFilterType = true;
      });

      const selectFilterFuction = (rows, id, filterValue) => {
        return rows.filter(row => {
          return filterValue.includes(row.values[id]);
        });
      };

      const dateFilterFunction = (rows, id, filterValue) => {
        return rows.filter(row => {
          return (
            new Date(row.values[id]) <= new Date(filterValue[1]) &&
            new Date(row.values[id]) >= new Date(filterValue[0])
          );
        });
      };

      // seaching if current column custom filter is present or not if preset addingg a key canCustomFilter true
      let isFilterColumn = null;
      let isFixedColumn = null;
      if (filterColumns && filterColumns.length) {
        const regex = /\((.*?)\)$/;
        while (regex.test(label)) {
          const resultArray = regex.exec(label);
          if (!resultArray || !resultArray.length) {
            break;
          }
          label = resultArray[1];
        }
        filterColumns.map(i => {
          if (label === i) {
            isFilterColumn = label;
          }
        });
      }
      if (fixedColumns && fixedColumns.length) {
        fixedColumns.map(i => {
          if (label.includes(i)) isFixedColumn = label;
        });
      }

      const valueRange = showCellBars && getValueRange(key);
      const cellProps: Column<D>['cellProps'] = ({ value: value_ }, sharedCellProps) => {
        let className = '';
        const value = value_ as DataRecordValue;
        if (dataType === DataType.Number) {
          className += ' dt-metric';
        } else if (emitFilter) {
          className += ' dt-is-filter';
          if (isActiveFilterValue(key, value)) {
            className += ' dt-is-active-filter';
          }
        }
        const [isHtml, text] = formatValue(column, value);
        const style = {
          ...sharedCellProps.style,
          // background: valueRange
          //   ? cellBar({
          //       value: value as number,
          //       valueRange,
          //       alignPositiveNegative,
          //       colorPositiveNegative,
          //     })
          //   : undefined,
          color: '#11172E',
          fontSize: '13px',
          fontWeight: 600,
        };
        return {
          // show raw number in title in case of numeric values
          title: typeof value === 'number' ? String(value) : undefined,
          dangerouslySetInnerHTML: isHtml ? { __html: text } : undefined,
          cellContent: text,
          onClick: emitFilter && !valueRange ? () => toggleFilter(key, value) : undefined,
          className,
          style,
        };
      };

      const columnObject = {
        id: String(i), // to allow duplicate column keys
        accessor: key,
        Header: label,
        Filter: isDateFilterType ? BetweenDateControl : SelectControl,
        filter: isDateFilterType ? dateFilterFunction : selectFilterFuction,
        SortIcon,
        sortDescFirst: sortDesc,
        sortType: getSortTypeByDataType(dataType),
        cellProps,
        canCustomFilter: isFilterColumn ? true : false,
        sticky: isFixedColumn ? 'left' : '',
        dataType: isDateFilterType ? 'datetime' : dataType,
        width: 150,
      };

      // check if columns are less and is there a black space on side if yes change the width of the column to equally distribute
      if (width / columnArrayJustForLengthPurpose.length > 150) {
        columnObject.width = width / columnArrayJustForLengthPurpose.length - 2;
      }

      if (label.toLowerCase().includes('organization'))
        columnObject.width = columnObject.width > 200 ? columnObject.width - 2 : 200;
      if (label.toLowerCase().includes('video_title'))
        columnObject.width = columnObject.width > 240 ? columnObject.width - 2 : 240;
      if (label.toLowerCase().includes('video_title_link'))
        columnObject.width = columnObject.width > 240 ? columnObject.width - 2 : 240;
      if (label.toLowerCase().includes('positive_sentiment_valence'))
        columnObject.width = columnObject.width > 240 ? columnObject.width - 2 : 240;
      if (label.toLowerCase().includes('creator_name'))
        columnObject.width = columnObject.width > 170 ? columnObject.width - 2 : 170;

      return columnObject;
    },
    [
      /* alignPositiveNegative,
      colorPositiveNegative, */
      emitFilter,
      getValueRange,
      isActiveFilterValue,
      showCellBars,
      sortDesc,
      toggleFilter,
    ],
  );

  const columns = useMemo(() => {
    // ignoring these column as they are merged into another column
    const ignoreColumnList = ['negative_sentiment_valence', 'neutral_sentiment_valence'];

    // if video tile and platform should be merged then add platform as well
    if (videoPlatformMerge) ignoreColumnList.push('platform');
    if (showVideoTitleThumbnail) ignoreColumnList.push('video_id');

    return columnsMeta
      .filter(i => {
        let column;
        ignoreColumnList.map(ignoreCol => {
          if (i.key.toLowerCase().includes(ignoreCol)) column = ignoreCol;
        });
        return column ? false : true;
      })
      .map(getColumnConfigs);
  }, [columnsMeta, getColumnConfigs]);

  return (
    <Styles>
      <DataTable<D>
        columnsMeta={columnsMeta}
        columns={columns}
        data={data}
        tableClassName="table table-striped table-condensed"
        searchInput={includeSearch && SearchInput}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        width={width}
        height={height}
        // 9 page items in > 340px works well even for 100+ pages
        maxPageItemCount={width > 340 ? 9 : 7}
        noResultsText={(filter: string) =>
          t(filter ? 'No matching records found' : 'No records found')
        }
        // not in use in Superset, but needed for unit tests
        sticky={sticky}
        tableHeader={tableHeader}
        customTableHeader={customTableHeader}
        tableDescription={tableDescription}
        exportCSV={exportCSV}
        getKeyOrLableContent={getKeyOrLableContent}
        getColorGradientArray={getColorGradientArray}
        colorScheme={colorScheme}
        fixedColumns={fixedColumns}
        filterColumns={filterColumns}
        globalSelectControl={globalSelectControl}
        editMode={editMode}
        marginLeftForHorizontalScroll={
          fixedColumns && fixedColumns.length > 0
            ? fixedColumns
                .map(i => {
                  if (i && i.toLowerCase() === 'organization')
                    return width / columns.length > 200 ? width / columns.length - 2 : 200;
                  else if (i && i.toLowerCase() === 'video_title')
                    return width / columns.length > 240 ? width / columns.length - 2 : 240;
                  else if (i && i.toLowerCase() === 'video_title_link')
                    return width / columns.length > 240 ? width / columns.length - 2 : 240;
                  else if (i && i.toLowerCase() === 'positive_sentiment_valence')
                    return width / columns.length > 240 ? width / columns.length - 2 : 240;
                  else if (i && i.toLowerCase() === 'creator_name')
                    return width / columns.length > 170 ? width / columns.length - 2 : 170;
                  else return 150;
                })
                .reduce((a, b) => a + b)
            : 0
        }
        videoPlatformMerge={videoPlatformMerge}
        showVideoTitleThumbnail={showVideoTitleThumbnail}
      />
    </Styles>
  );
}
