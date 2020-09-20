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
import GlobalFilter, { GlobalFilterProps } from './components/GlobalFilter';
import { /* SelectPageSize , */ SizeOption } from './components/SelectPageSize';
import SimplePagination from './components/Pagination';
import useSticky from './hooks/useSticky';
import useColumnCellProps from './hooks/useColumnCellProps';
let brandColorMappingObject = {};

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

function getColorObject(brand: string): object {
  const colorArray = [
    {
      background:
        'transparent linear-gradient(180deg, #9B72D2 0%, #613EA6 100%) 0% 0% no-repeat padding-box',
      color: 'white',
    },
    {
      background:
        'transparent linear-gradient(180deg, #D2E9F3 0%, #A6CEE3 100%) 0% 0% no-repeat padding-box',
    },
    {
      background:
        'transparent linear-gradient(180deg, #38A7FF 0%, #1A6EFE 100%) 0% 0% no-repeat padding-box',
      color: 'white',
    },
    {
      background:
        'transparent linear-gradient(180deg, #A6C9F3 0%, #6D99E2 100%) 0% 0% no-repeat padding-box',
      color: 'white',
    },
    {
      background:
        'transparent linear-gradient(180deg, #FF44B8 0%, #FF2182 100%) 0% 0% no-repeat padding-box',
      color: 'white',
    },
  ];

  if (brandColorMappingObject[brand]) {
    return brandColorMappingObject[brand];
  } else {
    if (!brandColorMappingObject.count) {
      brandColorMappingObject.count = 1;
      brandColorMappingObject[brand] = colorArray[0];
      return colorArray[0];
    } else if (brandColorMappingObject.count < 5) {
      brandColorMappingObject[brand] = colorArray[brandColorMappingObject.count];
      brandColorMappingObject.count++;
      return brandColorMappingObject[brand];
    } else if (brandColorMappingObject.count <= 5) {
      brandColorMappingObject.count = 1;
      brandColorMappingObject[brand] = colorArray[0];
      return colorArray[0];
    }
  }

  return colorArray[0];
}

function getTableHeaderContent(headerContent: string): string {
  let metricsName = headerContent
    .replace(
      /\b(\w*SUM\w*)\b|\b(\w*COUNT\w*)\b|\b(\w*COUNT_DISTINCT\w*)\b|\b(\w*AVG\w*)\b|\b(\w*MAX\w*)\b|\b(\w*MIN\w*)\b/g,
      '',
    )
    .replace(/\(/g, '')
    .replace(/\)/g, '');
  const headerTextMappingObject = {
    negative_sentiment_valence: 'Negative Sentiment',
    neutral_sentiment_valence: 'Neutral Sentiment',
    positive_sentiment_valence: 'Positive Sentiment',
    crawled_date: 'As of Date',
    created_date: 'As of Date',
    platform: 'Platform',
    video_platform: 'Platform',
    videos: 'Videos',
    videos_count: 'Videos',
    videos_diff: 'Videos',
    owned_videos: 'Videos',
    total_videos: 'Videos',
    earned_viewsvideos: 'Videos',
    video: 'Videos',
    video_count: 'Videos',
    video_diff: 'Videos',
    owned_video: 'Videos',
    total_video: 'Videos',
    earned_viewsvideo: 'Videos',
    views: 'Views',
    views_count: 'Views',
    views_diff: 'Views',
    owned_views: 'Views',
    total_views: 'Views',
    earned_viewsviews: 'Views',
    creators: 'Creators',
    creators_count: 'Creators',
    creators_diff: 'Creators',
    owned_creators: 'Creators',
    total_creators: 'Creators',
    earned_viewscreators: 'Creators',
    likes: 'Likes',
    likes_count: 'Likes',
    likes_diff: 'Likes',
    owned_likes: 'Likes',
    total_likes: 'Likes',
    earned_viewslikes: 'Likes',
    dislikes: 'Dislikes',
    dislikes_count: 'Dislikes',
    dislikes_diff: 'Dislikes',
    owned_dislikes: 'Dislikes',
    total_dislikes: 'Dislikes',
    earned_viewsdislikes: 'Dislikes',
    comments: 'Comments',
    comments_count: 'Comments',
    comments_diff: 'Comments',
    owned_comments: 'Comments',
    total_comments: 'Comments',
    earned_viewscomments: 'Comments',
    fb_shares: 'fb_Shares',
    fb_shares_count: 'fb_Shares',
    fb_shares_diff: 'fb_Shares',
    owned_fb_shares: 'fb_Shares',
    total_fb_shares: 'fb_Shares',
    earned_viewsfb_shares: 'fb_Shares',
    shares: 'Shares',
    shares_count: 'Shares',
    shares_diff: 'Shares',
    owned_shares: 'Shares',
    total_shares: 'Shares',
    earned_viewsshares: 'Shares',
    subscribers: 'Subscribers',
    subscribers_count: 'Subscribers',
    subscribers_diff: 'Subscribers',
    owned_subscribers: 'Subscribers',
    total_subscribers: 'Subscribers',
    earned_viewssubscribers: 'Subscribers',
    subs: 'Subscribers',
    subs_count: 'Subscribers',
    subs_diff: 'Subscribers',
    owned_subs: 'Subscribers',
    total_subs: 'Subscribers',
    earned_viewssubs: 'Subscribers',
    topic_title: 'Social Account',
    organization: 'Brand',
    published_date: 'Date Published',
    video_title: 'Video',
    video_title_link: 'Video',
    likes_per_views: 'Likes per 1000 Views',
    dislikes_per_views: 'Dislikes per 1000 Views',
    comments_per_views: 'Comments per 1000 views',
    shares_per_views: 'Shares per 1000 views',
    anticipation: 'Anticipation',
    joy: 'Joy',
    surprise: 'Surprise',
    trust: 'Trust',
    anger: 'Anger',
    disgust: 'Disgust',
    fear: 'Fear',
    sadness: 'Sadness',
    format: 'Format',
    theme: 'Theme',
    category: 'Category',
    tag: 'Tags',
    tags: 'Tags',
    creator_name: 'Creator',
    engagement_ratio: 'Engagement',
  };
  return headerTextMappingObject[metricsName ? metricsName.toLowerCase() : metricsName]
    ? headerTextMappingObject[metricsName ? metricsName.toLowerCase() : metricsName]
    : headerContent;
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
  downloadAsImage,
  wrapperRef: userWrapperRef,
  ...moreUseTableOptions
}: DataTableProps<D>) {
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

  const renderTable = () => (
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

                if (column.Header === 'organization') {
                  return (
                    <th
                      key={headerKey || column.id}
                      className={column.isSorted ? `${className || ''} is-sorted` : className}
                      {...props}
                      onClick={() => {}}
                      style={{
                        ...props.style,
                        paddingRight: '30px',
                        paddingLeft: '30px',
                      }}
                    >
                      {getTableHeaderContent(column.Header)}
                      {/* column.render('SortIcon') */}
                    </th>
                  );
                }

                return (
                  <th
                    key={headerKey || column.id}
                    className={column.isSorted ? `${className || ''} is-sorted` : className}
                    {...props}
                    onClick={() => {}}
                  >
                    {getTableHeaderContent(column.Header)}
                    {/* column.render('SortIcon') */}
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
                    const colorObject = getColorObject(cellContent);
                    return (
                      <td
                        key={key}
                        {...restProps}
                        style={{ ...restProps.style, padding: '15px 30px' }}
                      >
                        <span
                          style={{
                            background: colorObject.background,
                            padding: '7px',
                            borderRadius: '15px',
                            color: colorObject.color ? colorObject.color : '',
                            display: 'inline-block',
                            width: '90px',
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
                  downloadAsImage={downloadAsImage}
                  tableHeader={tableHeader}
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
