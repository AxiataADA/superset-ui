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
import React, { CSSProperties } from 'react';

export interface PaginationProps {
  pageCount: number; // number of pages
  currentPage?: number; // index of current page, zero-based
  maxPageItemCount?: number;
  ellipsis?: string; // content for ellipsis item
  onPageChange: (page: number) => void; // `page` is zero-based
  style?: CSSProperties;
}

// first, ..., prev, current, next, ..., last
const MINIMAL_PAGE_ITEM_COUNT = 7;

/**
 * Generate numeric page items around current page.
 *   - Always include first and last page
 *   - Add ellipsis if needed
 */
export function generatePageItems(total: number, current: number, width: number) {
  if (width < MINIMAL_PAGE_ITEM_COUNT) {
    throw new Error(`Must allow at least ${MINIMAL_PAGE_ITEM_COUNT} page items`);
  }
  if (width % 2 === 0) {
    throw new Error(`Must allow odd number of page items`);
  }
  if (total < width) {
    return [...new Array(total).keys()];
  }
  const left = Math.max(0, Math.min(total - width, current - Math.floor(width / 2)));
  const items: (string | number)[] = new Array(width);
  for (let i = 0; i < width; i += 1) {
    items[i] = i + left;
  }
  // replace non-ending items with placeholders
  if (items[0] > 0) {
    items[0] = 0;
    items[1] = 'prev-more';
  }
  if (items[items.length - 1] < total - 1) {
    items[items.length - 1] = total - 1;
    items[items.length - 2] = 'next-more';
  }
  return items;
}

export default React.memo(
  React.forwardRef(function Pagination(
    {
      style,
      pageCount,
      currentPage = 0,
      maxPageItemCount = 9,
      onPageChange,
      totalCount,
    }: PaginationProps,
    ref: React.Ref<HTMLDivElement>,
  ) {
    const pageItems = generatePageItems(pageCount, currentPage, maxPageItemCount - 2);

    return (
      <div
        ref={ref}
        className="dt-pagination"
        style={{
          ...style,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ padding: '5px 0px', fontSize: '13px', opacity: '0.5', marginRight: '30px' }}>
          {(totalCount || 0) + ' Total Videos'}
        </div>
        <button
          className="button-focus-off"
          style={{
            padding: '0px 9px',
            color: 'black',
            borderRadius: '2px',
            border: 'none',
            margin: '0px 2px',
            backgroundColor: '#F8F8F8',
          }}
          onClick={e => {
            e.preventDefault();
            onPageChange(currentPage - 1);
          }}
          disabled={currentPage === 0}
        >
          <i
            style={{ opacity: currentPage === 0 ? '0.2' : '0.6' }}
            className="fa fa-chevron-left"
          />
        </button>
        <ul className="pagination pagination-sm">
          {pageItems.map((item, i) =>
            typeof item === 'number' ? (
              // actual page number
              <li key={item} className={currentPage === item ? 'active' : undefined}>
                <a
                  href={`#page-${item}`}
                  role="button"
                  onClick={e => {
                    e.preventDefault();
                    onPageChange(item);
                  }}
                  style={{
                    color: currentPage === item ? 'white' : 'black',
                    borderRadius: '2px',
                    border: 'none',
                    margin: '0px 2px',
                    backgroundColor: currentPage === item ? '#7C90DB' : '#F8F8F8',
                  }}
                >
                  {item + 1}
                </a>
              </li>
            ) : (
              <li key={item} className="dt-pagination-ellipsis">
                <span
                  style={{
                    color: 'black',
                    borderRadius: '2px',
                    border: 'none',
                    margin: '0px 2px',
                    backgroundColor: '#F8F8F8',
                  }}
                >
                  …
                </span>
              </li>
            ),
          )}
        </ul>
        <button
          className="button-focus-off"
          style={{
            padding: '0px 9px',
            color: 'black',
            borderRadius: '2px',
            border: 'none',
            margin: '0px 2px',
            backgroundColor: '#F8F8F8',
          }}
          onClick={e => {
            e.preventDefault();
            onPageChange(currentPage + 1);
          }}
          disabled={currentPage === pageCount - 1}
        >
          <i
            style={{ opacity: currentPage === pageCount - 1 ? '0.2' : '0.6' }}
            className="fa fa-chevron-right"
          />
        </button>
      </div>
    );
  }),
);
