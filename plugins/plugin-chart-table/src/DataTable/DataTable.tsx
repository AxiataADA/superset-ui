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
import React, { useCallback, useRef, ReactNode, HTMLProps, MutableRefObject } from 'react';
import {
  useTable,
  usePagination,
  useSortBy,
  useGlobalFilter,
  PluginHook,
  TableCellProps,
  TableOptions,
  FilterType,
  IdType,
  Row,
} from 'react-table';
import matchSorter from 'match-sorter';
import { CategoricalColorNamespace } from '@superset-ui/color';
import GlobalFilter, { GlobalFilterProps } from './components/GlobalFilter';
import { /* SelectPageSize , */ SizeOption } from './components/SelectPageSize';
import SimplePagination from './components/Pagination';
import useSticky from './hooks/useSticky';
import useColumnCellProps from './hooks/useColumnCellProps';
let brandColorMappingObject = {};
const { getScale } = CategoricalColorNamespace;

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
  tableDescription,
  exportCSV,
  getKeyOrLableContent,
  getColorGradientArray,
  colorScheme,
  wrapperRef: userWrapperRef,
  ...moreUseTableOptions
}: DataTableProps<D>) {
  const uniqueTableIdForPDFDownload = createUniqueId();
  const colorFunction = getScale(colorScheme);
  const tableHooks: PluginHook<D>[] = [
    useGlobalFilter,
    useSortBy,
    usePagination,
    useColumnCellProps,
    doSticky ? useSticky : [],
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
  const paginationRef = useRef<HTMLDivElement>(null);
  const wrapperRef = userWrapperRef || defaultWrapperRef;

  const defaultGetTableSize = useCallback(() => {
    if (wrapperRef.current) {
      // `initialWidth` and `initialHeight` could be also parameters like `100%`
      // `Number` reaturns `NaN` on them, then we fallback to computed size
      const width = Number(initialWidth) || wrapperRef.current.clientWidth;
      const height =
        (Number(initialHeight) || wrapperRef.current.clientHeight) -
        (globalControlRef.current?.clientHeight || 0) -
        (paginationRef.current?.clientHeight || 0);
      return { width, height };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHeight, initialWidth, wrapperRef, hasPagination, hasGlobalControl]);

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
    setPageSize: setPageSize_,
    wrapStickyTable,
    state: { pageIndex, /* pageSize, */ globalFilter: filterValue, sticky = {} },
  } = useTable<D>(
    {
      columns,
      data,
      initialState,
      getTableSize: defaultGetTableSize,
      globalFilter: defaultGlobalFilter,
      ...moreUseTableOptions,
      uniqueTableIdForPDFDownload,
    },
    ...tableHooks,
  );

  // make setPageSize accept 0
  const setPageSize = (size: number) => {
    // keep the original size if data is empty
    if (size || data.length !== 0) {
      setPageSize_(size === 0 ? data.length : size);
    }
  };

  const renderTable = () => {
    let positiveSentimentColumnName;
    let neutralSentimentColumnName;
    let negativeSentimentColumnName;

    columns.forEach(i => {
      if (i && i.Header.toLowerCase().includes('positive_sentiment_valence'))
        positiveSentimentColumnName = i.Header;
      else if (i && i.Header.toLowerCase().includes('neutral_sentiment_valence'))
        neutralSentimentColumnName = i.Header;
      else if (i && i.Header.toLowerCase().includes('negative_sentiment_valence'))
        negativeSentimentColumnName = i.Header;
    });

    const isSentimentColumnPresent =
      positiveSentimentColumnName && neutralSentimentColumnName && negativeSentimentColumnName;
    return (
      <table {...getTableProps({ className: tableClassName })}>
        <thead>
          {headerGroups.map(headerGroup => {
            const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              <tr key={headerGroupKey || headerGroup.id} {...headerGroupProps}>
                {headerGroup.headers.map(column => {
                  const { key: headerKey, className, ...props } = column.getHeaderProps(
                    column.getSortByToggleProps(),
                  );

                  if (column.Header.includes('platform')) {
                    return (
                      <th
                        key={headerKey || column.id}
                        className={column.isSorted ? `${className || ''} is-sorted` : className}
                        {...props}
                        style={{
                          ...props.style,
                          borderRight: 'none',
                          padding: '20px 0px',
                        }}
                        onClick={() => {}}
                        title=""
                      />
                    );
                  }

                  // hide all the sentiment cell except positive which will show colored bar will have to change this functinality fior dynamic usage
                  if (
                    isSentimentColumnPresent &&
                    (column.Header.toLowerCase().includes('negative_sentiment_valence') ||
                      column.Header.toLowerCase().includes('neutral_sentiment_valence'))
                  ) {
                    return null;
                  }

                  if (column.Header === 'organization') {
                    return (
                      <th
                        key={headerKey || column.id}
                        className={column.isSorted ? `${className || ''} is-sorted` : className}
                        {...props}
                        style={{
                          ...props.style,
                          paddingRight: '30px',
                          paddingLeft: '30px',
                        }}
                      >
                        {getKeyOrLableContent(column.Header)}
                        {column.render('SortIcon')}
                      </th>
                    );
                  }

                  if (column.Header.toLowerCase().includes('positive_sentiment_valence')) {
                    return (
                      <th
                        key={headerKey || column.id}
                        className={column.isSorted ? `${className || ''} is-sorted` : className}
                        {...props}
                        style={{
                          ...props.style,
                          paddingRight: '20px',
                          paddingLeft: '20px',
                        }}
                      >
                        {getKeyOrLableContent(column.Header)}
                        {column.render('SortIcon')}
                      </th>
                    );
                  }

                  return (
                    <th
                      key={headerKey || column.id}
                      className={column.isSorted ? `${className || ''} is-sorted` : className}
                      {...props}
                    >
                      {getKeyOrLableContent(column.Header)}
                      {column.render('SortIcon')}
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page && page.length > 0 ? (
            page.map(row => {
              prepareRow(row);
              const { key: rowKey, ...rowProps } = row.getRowProps();
              return (
                <tr key={rowKey || row.id} {...rowProps}>
                  {row.cells.map(cell => {
                    const cellProps = cell.getCellProps() as TableCellProps & RenderHTMLCellProps;
                    const { key: cellKey, cellContent, ...restProps } = cellProps;
                    const key = cellKey || cell.column.id;
                    if (cellProps.dangerouslySetInnerHTML) {
                      return <td key={key} {...restProps} />;
                    }

                    if (cell.column.Header === 'published_date') {
                      return (
                        <td width={200} key={key} {...restProps}>
                          {getRequiredDateFormat(cellContent)}
                        </td>
                      );
                    }

                    if (cell.column.Header === 'organization') {
                      const color = colorFunction(cellContent);
                      const gradientArray = getColorGradientArray(color);
                      const textColor = getTextColor(color);
                      return (
                        <td
                          key={key}
                          {...restProps}
                          style={{ ...restProps.style, padding: '15px 30px' }}
                        >
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
                              width: '150px',
                            }}
                          >
                            {cellContent}
                          </span>
                        </td>
                      );
                    }

                    if (cell.column.Header.includes('platform')) {
                      const platformObject = {
                        youtube: 'Youtube',
                        facebook: 'Facebook',
                        instagram: 'Instagram',
                      };
                      return (
                        <td
                          key={key}
                          {...restProps}
                          style={{
                            ...restProps.style,
                            padding: '22px 0px',
                            borderRight: 'none',
                          }}
                        >
                          <img
                            alt="Platform"
                            src={`/static/assets/images/Donut Chart Icon/${
                              platformObject[cellContent.toLowerCase()]
                            }.png`}
                            style={{
                              height: '20px',
                            }}
                          />
                        </td>
                      );
                    }

                    // hide all the sentiment cell except positive which will show colored bar will have to change this functinality fior dynamic usage
                    if (
                      isSentimentColumnPresent &&
                      (cell.column.Header.toLowerCase().includes('negative_sentiment_valence') ||
                        cell.column.Header.toLowerCase().includes('neutral_sentiment_valence'))
                    ) {
                      return null;
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
                        <td
                          key={key}
                          {...restProps}
                          style={{ ...restProps.style, padding: '24px 20px' }}
                          title=""
                        >
                          {totalSentiment > 0 ? (
                            <div
                              style={{
                                borderRadius: '15px',
                                overflow: 'hidden',
                                width: '100%',
                                minWidth: '150px',
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
                                title={'Positive: ' + positivePercentage + '%'}
                              />
                              <span
                                style={{
                                  background: '#E9DE90',
                                  padding: '0px ' + neutralPercentage / 2 + '%',
                                }}
                                title={'Neutral: ' + neutralPercentage + '%'}
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
                                title={'Negative: ' + negativePercentage + '%'}
                              />
                            </div>
                          ) : (
                            <span>N/A</span>
                          )}
                        </td>
                      );
                    }

                    // If cellProps renderes textContent already, then we don't have to
                    // render `Cell`. This saves some time for large tables.
                    return (
                      <td key={key} {...restProps}>
                        {cellContent || cell.render('Cell')}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="dt-no-results" colSpan={columns.length}>
                {typeof noResultsText === 'function'
                  ? noResultsText(filterValue as string)
                  : noResultsText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
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
              <span style={{ fontSize: '24px' }}>{tableHeader || ''}</span>
              <img
                title={tableDescription || ''}
                alt="Description"
                src={`/static/assets/images/icons/Table Description.png`}
                style={{
                  width: '16px',
                  height: '16px',
                  margin: tableHeader ? '-5px 0px 0px 7.5px' : '0px 0px 0px 7.5px',
                }}
              />
            </div>
            {searchInput ? (
              <div className="col-sm-6">
                <GlobalFilter<D>
                  exportCSV={exportCSV}
                  tableHeader={tableHeader}
                  uniqueTableIdForPDFDownload={uniqueTableIdForPDFDownload}
                  searchInput={typeof searchInput === 'boolean' ? undefined : searchInput}
                  preGlobalFilteredRows={preGlobalFilteredRows}
                  setGlobalFilter={setGlobalFilter}
                  filterValue={filterValue}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {wrapStickyTable ? wrapStickyTable(renderTable) : renderTable()}
      {hasPagination ? (
        <SimplePagination
          ref={paginationRef}
          style={sticky.height ? undefined : { visibility: 'hidden' }}
          maxPageItemCount={maxPageItemCount}
          pageCount={pageCount}
          currentPage={pageIndex}
          onPageChange={gotoPage}
          totalCount={data.length}
        />
      ) : null}
    </div>
  );
}
