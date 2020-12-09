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
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
  HTMLProps,
  MutableRefObject,
} from 'react';
import {
  useTable,
  usePagination,
  useSortBy,
  useGlobalFilter,
  useFilters,
  useBlockLayout,
  PluginHook,
  TableCellProps,
  TableOptions,
  FilterType,
  IdType,
  Row,
} from 'react-table';
import { useSticky } from 'react-table-sticky';
import styled from 'styled-components';
import matchSorter from 'match-sorter';
import { CategoricalColorNamespace } from '@superset-ui/color';
import ModalTrigger from './components/ModalTrigger';
import GlobalFilter, { GlobalFilterProps } from './components/GlobalFilter';
import { /* SelectPageSize , */ SizeOption } from './components/SelectPageSize';
import SimplePagination from './components/Pagination';
import useStickyHeader from './hooks/useSticky';
import useColumnCellProps from './hooks/useColumnCellProps';
import useMountedMemo from './utils/useMountedMemo';
let brandColorMappingObject = {};
const { getScale } = CategoricalColorNamespace;

const Styles = styled.div`
  .table {
    margin-bottom: 0px;
    .tr {
      :last-child {
        .td {
          border-bottom: 0;
        }
      }
    }

    .th,
    .td {
      border-bottom: 1px solid #cfd8db;
      border-right: 1px solid #cfd8db;
      overflow: hidden;
      font-size: 13px;
      font-family: 'Roboto', sans-serif;
      display: flex !important;
      align-items: center;

      :last-child {
        border-right: 0;
      }
    }

    .th {
      background-color: #f8f8f8;
      color: #4f62aa;
      height: 47px;
      justify-content: center;
      text-align: center;
    }

    .td {
      background-color: #fff;
      padding: 25px;
      height: 65px;
      justify-content: center;
      text-align: center;
    }

    &.sticky {
      overflow: scroll;
      .header,
      .footer {
        position: sticky;
        z-index: 1;
        width: fit-content;
      }

      .header {
        top: 0;
      }

      .footer {
        bottom: 0;
      }

      .body {
        position: relative;
        z-index: 0;
      }

      [data-sticky-td] {
        position: sticky;
      }
    }

    ::-webkit-scrollbar-track {
      margin-left: ${props => props.theme.marginLeftForHorizontalScroll}px;
      margin-top: 46px;
    }
  }
`;

function CustomsTable({
  columns,
  data,
  initialState,
  defaultGetTableSize,
  defaultGlobalFilter,
  moreUseTableOptions,
  uniqueTableIdForPDFDownload,
  tableHooks,
  paginationRef,
  maxPageItemCount,
  hasPagination,
  searchInput,
  tableHeader,
  customTableHeader,
  tableDescription,
  exportCSV,
  globalControlRef,
  hasGlobalControl,
  filterComponentArray,
  columnFilter,
  getKeyOrLableContent,
  globalSelectControl,
  setColumnFilter,
  colorScheme,
  getColorGradientArray,
  tHeadControlRef,
  tBodyControlRef,
  noResultsText,
  columnsMeta,
  marginLeftForHorizontalScroll,
  videoPlatformMerge,
  showVideoTitleThumbnail,
  initialHeight,
  initialWidth,
}) {
  const colorFunction = getScale(colorScheme);
  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 135,
      maxWidth: 400,
    }),
    [],
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    pageCount,
    gotoPage,
    preGlobalFilteredRows,
    setGlobalFilter,
    setAllFilters,
    setPageSize: setPageSize_,
    rows,
    prepareRow,
    getTableSize = () => undefined,
    state: { pageIndex, globalFilter: filterValue, filters: customFilters },
    state,
  } = useTable(
    {
      columns,
      data,
      initialState,
      getTableSize: defaultGetTableSize,
      globalFilter: defaultGlobalFilter,
      ...moreUseTableOptions,
      uniqueTableIdForPDFDownload,
      defaultColumn,
    },
    ...tableHooks,
    useBlockLayout,
    useSticky,
  );

  const [maxWidth, setMaxWidth] = useState('100%');
  const [maxHeight, setMaxHeight] = useState('80%');

  useEffect(() => {
    const sizeObject = getTableSize();
    if ((sizeObject.width, sizeObject.height)) {
      setMaxWidth(sizeObject.width);
      setMaxHeight(sizeObject.height);
    }
  }, [page, initialHeight, initialWidth, hasPagination, hasGlobalControl]);

  const applyColumnFilter = filterArray => {
    setColumnFilter(filterArray);
    setAllFilters(filterArray);
  };

  let positiveSentimentColumnName;
  let neutralSentimentColumnName;
  let negativeSentimentColumnName;
  let videoIdColumnName;
  let platformColumnName;
  let videoTitleColumnName;

  columnsMeta.forEach(i => {
    if (i && i.key.toLowerCase().includes('positive_sentiment_valence'))
      positiveSentimentColumnName = i.key;
    else if (i && i.key.toLowerCase().includes('neutral_sentiment_valence'))
      neutralSentimentColumnName = i.key;
    else if (i && i.key.toLowerCase().includes('negative_sentiment_valence'))
      negativeSentimentColumnName = i.key;
    else if (i && i.key.toLowerCase().includes('video_id')) videoIdColumnName = i.key;
    else if (i && i.key.toLowerCase().includes('platform')) platformColumnName = i.key;
    else if (i && i.key.toLowerCase().includes('video_title')) videoTitleColumnName = i.key;
    else if (i && i.key.toLowerCase().includes('video_title_link')) videoTitleColumnName = i.key;
  });

  const isVideoAndPlatformPresent = platformColumnName && videoTitleColumnName;
  const isSentimentColumnPresent =
    positiveSentimentColumnName && neutralSentimentColumnName && negativeSentimentColumnName;

  return (
    <Styles theme={{ marginLeftForHorizontalScroll }}>
      {hasGlobalControl ? (
        <div ref={globalControlRef} className="form-inline dt-controls">
          <div className="row">
            <div className="col-sm-6">
              {/* hasPagination ? (
                <SelectPageSize
                  total={data.length}
                  sizeOptions={pageSizeOptions}
                  currentSize={pageSize}
                  onChange={setPageSize}
                />
              ) : null */}
              <span style={{ fontSize: '24px' }}>{customTableHeader || tableHeader || ''}</span>
              <img
                tooltip-data-title={tableDescription || 'No description provided'}
                alt="Description"
                src={`/static/assets/images/icons/Table Description.png`}
                style={{
                  width: '16px',
                  height: '16px',
                  margin:
                    customTableHeader || tableHeader ? '-5px 0px 0px 7.5px' : '0px 0px 0px 7.5px',
                }}
              />
            </div>
            {searchInput ? (
              <div className="col-sm-6">
                <GlobalFilter
                  exportCSV={exportCSV}
                  tableHeader={tableHeader}
                  customTableHeader={customTableHeader}
                  uniqueTableIdForPDFDownload={uniqueTableIdForPDFDownload}
                  searchInput={typeof searchInput === 'boolean' ? undefined : searchInput}
                  preGlobalFilteredRows={preGlobalFilteredRows}
                  setGlobalFilter={setGlobalFilter}
                  filterValue={filterValue}
                  filterComponentArray={filterComponentArray}
                  columnFilter={columnFilter}
                  applyColumnFilter={applyColumnFilter}
                  getKeyOrLableContent={getKeyOrLableContent}
                  globalSelectControl={globalSelectControl}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div
        id={'custom-table' + uniqueTableIdForPDFDownload}
        style={{
          overflow: 'hidden',
          border: '2px solid #7C90DB',
          borderRadius: '12px',
        }}
      >
        <div
          {...getTableProps()}
          className="table sticky"
          style={{
            width: maxWidth ? maxWidth : '100%',
            height: maxHeight ? maxHeight : '100%',
          }}
        >
          <div ref={tHeadControlRef} className="header">
            {headerGroups.map(headerGroup => (
              <div {...headerGroup.getHeaderGroupProps()} className="tr">
                {headerGroup.headers.map(column => {
                  const headerRestProps = column.getHeaderProps(column.getSortByToggleProps());

                  if (column.Header.includes('organization')) {
                    return (
                      <div {...headerRestProps} className="th">
                        <span>
                          {getKeyOrLableContent(column.Header)}
                          {column.render('SortIcon')}
                        </span>
                      </div>
                    );
                  }

                  if (column.Header.includes('video_title')) {
                    return (
                      <div {...headerRestProps} className="th">
                        <span>
                          {getKeyOrLableContent(column.Header)}
                          {column.render('SortIcon')}
                        </span>
                      </div>
                    );
                  }

                  if (column.Header.includes('published_date')) {
                    return (
                      <div {...headerRestProps} className="th">
                        <span>
                          {getKeyOrLableContent(column.Header)}
                          {column.render('SortIcon')}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div {...headerRestProps} className="th">
                      <span>
                        {getKeyOrLableContent(column.Header)}
                        {column.render('SortIcon')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div ref={tBodyControlRef} {...getTableBodyProps()} className="body">
            {page && page.length > 0 ? (
              page.map((row, i) => {
                prepareRow(row);
                return (
                  <div {...row.getRowProps()} className="tr">
                    {row.cells.map(cell => {
                      const cellProps = cell.getCellProps();
                      const { key: cellKey, cellContent, ...restProps } = cellProps;
                      const key = cellKey || cell.column.id;

                      if (cellProps.dangerouslySetInnerHTML) {
                        return <div className="td" key={key} {...restProps} />;
                      }

                      if (
                        cell.column.Header === 'published_date' ||
                        cell.column.Header === 'crawled_date' ||
                        cell.column.Header === 'created_date'
                      ) {
                        return (
                          <div className="td" key={key} {...restProps}>
                            {getRequiredDateFormat(cellContent)}
                          </div>
                        );
                      }

                      if (cell.column.Header === 'organization') {
                        const color = colorFunction(cellContent);
                        const gradientArray = getColorGradientArray(color);
                        const textColor = getTextColor(color);
                        return (
                          <div className="td" key={key} {...restProps}>
                            <span
                              style={{
                                background: gradientArray
                                  ? 'transparent linear-gradient(180deg, ' +
                                    gradientArray[1] +
                                    ' 0%, ' +
                                    gradientArray[0] +
                                    ' 100%) 0% 0% no-repeat padding-box'
                                  : color,
                                padding: '7px',
                                borderRadius: '15px',
                                color: textColor ? 'black' : 'white',
                                display: 'inline-block',
                                width: '160px',
                                textAlign: 'center',
                              }}
                            >
                              {cellContent}
                            </span>
                          </div>
                        );
                      }

                      if (
                        videoPlatformMerge &&
                        isVideoAndPlatformPresent &&
                        (cell.column.Header.includes('video_title') ||
                          cell.column.Header.toLowerCase().includes('video_title_link'))
                      ) {
                        const platformName = row.original[platformColumnName] || '';
                        const videoId = row.original[videoIdColumnName] || '';
                        const platformObject = {
                          youtube: 'Youtube',
                          facebook: 'Facebook',
                          instagram: 'Instagram',
                        };
                        return (
                          <div className="td" key={key} {...restProps}>
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {platformName && (
                                <img
                                  alt="Platform"
                                  src={`/static/assets/images/Donut Chart Icon/${
                                    platformObject[platformName.toLowerCase()]
                                  }.png`}
                                  style={{
                                    height: '20px',
                                    marginRight: '20px',
                                  }}
                                />
                              )}
                              <span
                                style={{
                                  width: '150px',
                                  height: '2.4em',
                                  overflow: 'hidden',
                                  textAlign: 'left',
                                }}
                                tooltip-data-title={cellContent}
                              >
                                {videoId && platformName && showVideoTitleThumbnail ? (
                                  <ModalTrigger
                                    triggerNode={
                                      <span style={{ wordBreak: 'break-word' }}>{cellContent}</span>
                                    }
                                    className={
                                      platformName.toLowerCase() === 'instagram'
                                        ? 'popup-data-for-cell-content-modal-ig'
                                        : 'popup-data-for-cell-content-modal-yt-fb'
                                    }
                                    modalBody={
                                      <div>
                                        {platformName &&
                                          platformName.toLowerCase() === 'youtube' &&
                                          videoId && (
                                            <div style={{ '--aspect-ratio': '16/9' }}>
                                              <iframe
                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                allowTransparency="true"
                                                allowFullScreen="true"
                                              />
                                            </div>
                                          )}
                                        {platformName &&
                                          platformName.toLowerCase() === 'facebook' &&
                                          videoId && (
                                            <div style={{ '--aspect-ratio': '16/9' }}>
                                              <iframe
                                                src={`https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FPlayStation%2Fvideos%2F${videoId}%2F&show_text=0&height=290`}
                                                allowTransparency="true"
                                                allowFullScreen="true"
                                              />
                                            </div>
                                          )}
                                        {platformName &&
                                          platformName.toLowerCase() === 'instagram' &&
                                          videoId && (
                                            <div
                                              style={{
                                                height: '550px',
                                                overflowY: 'auto',
                                              }}
                                            >
                                              <iframe
                                                height="1000"
                                                id="table-viz-popup-instagram-iframe"
                                                src={`https://www.instagram.com/p/${videoId}/embed`}
                                                allowTransparency="true"
                                                allowFullScreen="true"
                                              />
                                            </div>
                                          )}
                                        {cellContent && cellContent !== 'N/A' && (
                                          <div
                                            style={{
                                              color: '#111111',
                                              margin: '10px',
                                              fontSize: '14px',
                                              fontFamily: 'Roboto',
                                              maxWidth: '500px',
                                            }}
                                          >
                                            {cellContent}
                                          </div>
                                        )}
                                        {platformName && (
                                          <div
                                            style={{
                                              textAlign: 'end',
                                              padding: '5px 5px 10px',
                                              color: '#111111',
                                              fontWeight: '500',
                                              fontSize: '11px',
                                              fontFamily: 'Roboto',
                                            }}
                                          >
                                            <img
                                              alt="Platform"
                                              src={`/static/assets/images/Donut Chart Icon/${
                                                platformObject[platformName.toLowerCase()]
                                              }.png`}
                                              style={{
                                                height: '13px',
                                                marginRight: '5px',
                                              }}
                                            />
                                            {platformObject[platformName.toLowerCase()]}
                                          </div>
                                        )}
                                      </div>
                                    }
                                  />
                                ) : (
                                  <span style={{ wordBreak: 'break-word' }}>{cellContent}</span>
                                )}
                              </span>
                            </span>
                          </div>
                        );
                      }

                      if (!videoPlatformMerge && cell.column.Header.includes('platform')) {
                        const platformObject = {
                          youtube: 'Youtube',
                          facebook: 'Facebook',
                          instagram: 'Instagram',
                        };
                        return (
                          <div className="td" key={key} {...restProps}>
                            <img
                              alt="Platform"
                              src={`/static/assets/images/Donut Chart Icon/${
                                platformObject[cellContent.toLowerCase()]
                              }.png`}
                              style={{
                                height: '20px',
                              }}
                            />
                          </div>
                        );
                      }

                      if (cell.column.Header.toLowerCase().includes('positive_sentiment_valence')) {
                        const positive = row.original[positiveSentimentColumnName] || 0;
                        const neutral = row.original[neutralSentimentColumnName] || 0;
                        const negative = row.original[negativeSentimentColumnName] || 0;
                        const totalSentiment = positive + neutral + negative;
                        const positivePercentage =
                          totalSentiment > 0
                            ? Number(((positive / totalSentiment) * 100).toFixed(1))
                            : 0;
                        const neutralPercentage =
                          totalSentiment > 0
                            ? Number(((neutral / totalSentiment) * 100).toFixed(1))
                            : 0;
                        const negativePercentage =
                          totalSentiment > 0
                            ? Number(((negative / totalSentiment) * 100).toFixed(1))
                            : 0;
                        return (
                          <div
                            className="td"
                            key={key}
                            {...restProps}
                            tooltip-data-title=""
                            style={{
                              ...restProps,
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0px 25px',
                              borderBottom: '1px solid #CFD8DB',
                            }}
                          >
                            {totalSentiment > 0 ? (
                              <div
                                style={{
                                  borderRadius: '15px',
                                  overflow: 'hidden',
                                  width: '150px',
                                  height: '15px',
                                }}
                              >
                                <span
                                  style={{
                                    background: `linear-gradient( 90deg, #2ACCB2, #2ACCB2 80%, ${getBarGradient(
                                      'positive',
                                      positivePercentage,
                                      neutralPercentage,
                                      negativePercentage,
                                    )})`,
                                    padding: '0px ' + positivePercentage / 2 + '%',
                                  }}
                                  tooltip-data-title={'Positive: ' + positivePercentage + '%'}
                                />
                                <span
                                  style={{
                                    background: '#E9DE90',
                                    padding: '0px ' + neutralPercentage / 2 + '%',
                                  }}
                                  tooltip-data-title={'Neutral: ' + neutralPercentage + '%'}
                                />
                                <span
                                  style={{
                                    background: `linear-gradient( 90deg, ${getBarGradient(
                                      'negative',
                                      positivePercentage,
                                      neutralPercentage,
                                      negativePercentage,
                                    )}, #FF4545 20%, #FF4545)`,
                                    padding: '0px ' + negativePercentage / 2 + '%',
                                  }}
                                  tooltip-data-title={'Negative: ' + negativePercentage + '%'}
                                />
                              </div>
                            ) : (
                              <span
                                style={{
                                  width: '150px',
                                  color: '#11172E',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  fontFamily: "'Roboto', sans-serif",
                                }}
                              >
                                N/A
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (cell.column.Header.toLowerCase().includes('video_title_link')) {
                        return (
                          <div
                            key={key}
                            {...restProps}
                            className="td"
                            style={{
                              ...restProps.style,
                              textAlign: 'left',
                              justifyContent: 'start',
                            }}
                          >
                            <span style={{ wordBreak: 'break-word' }}>{cellContent}</span>
                          </div>
                        );
                      }

                      if (
                        cell.column.Header.toLowerCase().includes('video_title') ||
                        cell.column.Header.toLowerCase().includes('creator_name')
                      ) {
                        return (
                          <div
                            key={key}
                            {...restProps}
                            className="td"
                            style={{
                              ...restProps.style,
                              textAlign: 'left',
                              justifyContent: 'start',
                            }}
                          >
                            {cellContent}
                          </div>
                        );
                      }

                      return (
                        <div key={key} {...restProps} className="td">
                          {cellContent}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              <div className="tr">
                <div className="dt-no-results td" colSpan={columns.length}>
                  {typeof noResultsText === 'function'
                    ? noResultsText(filterValue as string)
                    : noResultsText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {hasPagination ? (
        <SimplePagination
          ref={paginationRef}
          maxPageItemCount={maxPageItemCount}
          pageCount={pageCount}
          currentPage={pageIndex}
          onPageChange={gotoPage}
          totalCount={data.length}
        />
      ) : null}
    </Styles>
  );
}

function getBarGradient(
  barName: string,
  positivePercentage: number,
  neutralPercentage: number,
  negativePercentage: number,
): string {
  if (barName === 'positive') {
    if (neutralPercentage > 0) return '#E9DE90';
    if (negativePercentage > 0) return '#FF4545';
    return '#2ACCB2';
  } else if (barName === 'negative') {
    if (neutralPercentage > 0) return '#E9DE90';
    if (positivePercentage > 0) return '#2ACCB2';
    return '#FF4545';
  }
}

function getRequiredDateFormat(dateString: string): string {
  const newDate = new Date(new Date(dateString.trim()) + 'UTC');
  const monthsArray = [
    'Jan ',
    'Feb ',
    'Mar ',
    'Apr ',
    'May ',
    'Jun ',
    'Jul ',
    'Aug ',
    'Sep ',
    'Oct ',
    'Nov ',
    'Dec ',
  ];
  const date = newDate.getDate(),
    year = newDate.getFullYear(),
    month = newDate.getMonth();
  return monthsArray[month] + date + ', ' + year;
}

function getTextColor(color: string): object {
  const blackArray = ['#A6CEE3'];
  return blackArray.includes(color);
}

export interface DataTableProps<D extends object> extends TableOptions<D> {
  tableClassName?: string;
  tableHeader: string;
  customTableHeader: string;
  searchInput?: boolean | GlobalFilterProps<D>['searchInput'];
  pageSizeOptions?: SizeOption[]; // available page size options
  maxPageItemCount?: number;
  hooks?: PluginHook<D>[]; // any additional hooks
  width?: any;
  height?: string | number;
  pageSize?: number;
  noResultsText?: string | ((filterString: string) => ReactNode);
  sticky?: boolean;
  wrapperRef?: MutableRefObject<HTMLDivElement>;
}

export interface RenderHTMLCellProps extends HTMLProps<HTMLTableCellElement> {
  cellContent: ReactNode;
}

function createUniqueId() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Be sure to pass our updateMyData and the skipReset option
export default function DataTable<D extends object>({
  tableClassName,
  columns,
  data,
  fixedColumns,
  filterColumns,
  width: initialWidth = '100%',
  height: initialHeight = 300,
  pageSize: initialPageSize = 0,
  initialState: initialState_ = {},
  pageSizeOptions = [10, 25, 50, 100, 200],
  maxPageItemCount = 9,
  sticky: doSticky,
  searchInput = true,
  noResultsText = 'No data found',
  hooks,
  tableHeader,
  customTableHeader,
  tableDescription,
  exportCSV,
  getKeyOrLableContent,
  getColorGradientArray,
  colorScheme,
  globalSelectControl,
  columnsMeta,
  marginLeftForHorizontalScroll,
  videoPlatformMerge,
  showVideoTitleThumbnail,
  wrapperRef: userWrapperRef,
  ...moreUseTableOptions
}: DataTableProps<D>) {
  const [filterComponentArray, setFilterComponentArray] = useState([]);

  const uniqueTableIdForPDFDownload = createUniqueId();
  const colorFunction = getScale(colorScheme);
  const tableHooks: PluginHook<D>[] = [
    useGlobalFilter,
    useFilters,
    useSortBy,
    usePagination,
    useColumnCellProps,
    doSticky ? useStickyHeader : [],
    hooks || [],
  ].flat();
  const sortByRef = useRef([]); // cache initial `sortby` so sorting doesn't trigger page reset
  const pageSizeRef = useRef([initialPageSize, data.length]);
  const hasPagination = initialPageSize > 0 && data.length > 0; // pageSize == 0 means no pagination
  const hasGlobalControl = hasPagination || !!searchInput;
  const initialState = {
    ...initialState_,
    // zero length means all pages, the `usePagination` plugin does not
    // understand pageSize = 0
    sortBy: sortByRef.current,
    pageSize: initialPageSize > 0 ? initialPageSize : data.length || 10,
  };

  const defaultWrapperRef = useRef<HTMLDivElement>(null);
  const globalControlRef = useRef<HTMLDivElement>(null);
  const tHeadControlRef = useRef<HTMLDivElement>(null);
  const tBodyControlRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const wrapperRef = userWrapperRef || defaultWrapperRef;

  const defaultGetTableSize = useCallback(() => {
    if (wrapperRef.current) {
      // `initialWidth` and `initialHeight` could be also parameters like `100%`
      // `Number` reaturns `NaN` on them, then we fallback to computed size

      const width = Number(initialWidth) || wrapperRef.current.clientWidth;
      const height =
        (tHeadControlRef.current?.clientHeight || 0) +
        (tBodyControlRef.current?.clientHeight || 0) +
        6;

      const maxHeight =
        (Number(initialHeight) || wrapperRef.current.clientHeight) -
        (globalControlRef.current?.clientHeight || 0) -
        (paginationRef.current?.clientHeight || 0);
      console.log(maxHeight, height);
      return {
        width,
        height:
          height > maxHeight
            ? maxHeight - (paginationRef.current ? 0 : 4)
            : height - (paginationRef.current ? 0 : 4),
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialHeight,
    initialWidth,
    wrapperRef,
    hasPagination,
    hasGlobalControl,
    tHeadControlRef,
    tBodyControlRef,
  ]);

  const defaultGlobalFilter: FilterType<D> = useCallback(
    (rows: Row<D>[], columnIds: IdType<D>[], filterValue: string) => {
      // allow searching by "col1 col2"
      const joinedString = (row: Row<D>) => {
        return columnIds.map(x => row.values[x]).join(' ');
      };
      return matchSorter(rows, filterValue, {
        keys: [...columnIds, joinedString],
        threshold: matchSorter.rankings.ACRONYM,
      }) as typeof rows;
    },
    [],
  );

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 150,
      width: 150,
      maxWidth: 400,
    }),
    [],
  );

  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    headerGroups,
    page,
    pageCount,
    gotoPage,
    preGlobalFilteredRows,
    setGlobalFilter,
    setAllFilters,
    setPageSize: setPageSize_,
    wrapStickyTable,
    state: {
      pageIndex,
      /* pageSize, */ globalFilter: filterValue,
      sticky = {},
      filters: customFilters,
    },
    state,
  } = useTable<D>(
    {
      columns,
      data,
      initialState,
      getTableSize: defaultGetTableSize,
      globalFilter: defaultGlobalFilter,
      ...moreUseTableOptions,
      uniqueTableIdForPDFDownload,
      defaultColumn,
    },
    ...tableHooks,
    useSticky,
  );

  const [columnFilter, setColumnFilter] = useState(customFilters || []);

  const applyColumnFilter = filterArray => {
    setColumnFilter(filterArray);
    setAllFilters(filterArray);
  };

  useEffect(() => {
    const tempFilterComponentArray = [];
    headerGroups.forEach(headerGroup => {
      headerGroup.headers.forEach(column => {
        if (column.canCustomFilter) {
          columns.forEach(i => {
            let isFilterColumn = null;
            filterColumns.forEach(j => {
              if (j && i && i.Header.toLowerCase().includes(j)) isFilterColumn = i.Header;
            });

            if (isFilterColumn) {
              const filterComponent = tempFilterComponentArray.filter(i => {
                return i === column;
              });

              if (!filterComponent || !filterComponent.length) {
                tempFilterComponentArray.push(column);
              }
            }
          });
        }
      });
    });
    if (tempFilterComponentArray.length) {
      setFilterComponentArray(tempFilterComponentArray);
    }
  }, [filterColumns, headerGroups]);

  // make setPageSize accept 0
  const setPageSize = (size: number) => {
    // keep the original size if data is empty
    if (size || data.length !== 0) {
      setPageSize_(size === 0 ? data.length : size);
    }
  };

  // force upate the pageSize when it's been update from the initial state
  if (
    pageSizeRef.current[0] !== initialPageSize ||
    // when initialPageSize stays as zero, but total number of records changed,
    // we'd also need to update page size
    (initialPageSize === 0 && pageSizeRef.current[1] !== data.length)
  ) {
    pageSizeRef.current = [initialPageSize, data.length];
    setPageSize(initialPageSize);
  }

  return (
    <div ref={wrapperRef} style={{ width: initialWidth, height: initialHeight }}>
      <CustomsTable
        columns={columns}
        data={data}
        initialState={initialState}
        defaultGetTableSize={defaultGetTableSize}
        defaultGlobalFilter={defaultGlobalFilter}
        moreUseTableOptions={{ ...moreUseTableOptions }}
        uniqueTableIdForPDFDownload={uniqueTableIdForPDFDownload}
        tableHooks={tableHooks}
        paginationRef={paginationRef}
        maxPageItemCount={maxPageItemCount}
        hasPagination={hasPagination}
        hasGlobalControl={hasGlobalControl}
        searchInput={searchInput}
        tableHeader={tableHeader}
        customTableHeader={customTableHeader}
        tableDescription={tableDescription}
        exportCSV={exportCSV}
        globalControlRef={globalControlRef}
        filterComponentArray={filterComponentArray}
        columnFilter={columnFilter}
        getKeyOrLableContent={getKeyOrLableContent}
        globalSelectControl={globalSelectControl}
        setColumnFilter={setColumnFilter}
        colorScheme={colorScheme}
        getColorGradientArray={getColorGradientArray}
        tHeadControlRef={tHeadControlRef}
        tBodyControlRef={tBodyControlRef}
        noResultsText={noResultsText}
        columnsMeta={columnsMeta}
        marginLeftForHorizontalScroll={marginLeftForHorizontalScroll}
        videoPlatformMerge={videoPlatformMerge}
        showVideoTitleThumbnail={showVideoTitleThumbnail}
        initialHeight={initialHeight}
        initialWidth={initialWidth}
      />
    </div>
  );
}
