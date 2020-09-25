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
import React, { useState, useMemo, useCallback } from 'react';
import { ColumnInstance, Column, DefaultSortTypes } from 'react-table';
import { extent as d3Extent, max as d3Max } from 'd3-array';
import { FaSort, FaSortUp as FaSortAsc, FaSortDown as FaSortDesc } from 'react-icons/fa';
import { t } from '@superset-ui/translation';
import { DataRecordValue, DataRecord } from '@superset-ui/chart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

function SearchInput({
  count,
  value,
  onChange,
  exportCSV,
  tableHeader,
  uniqueTableIdForPDFDownload,
}: SearchInputProps) {
  return (
    <span className="dt-global-filter">
      {/*<img
        alt="Reset"
        src={`/static/assets/images/icons/Reset Table Filter.png`}
        style={{
          width: '16px',
          height: '16px',
        }}
      />
      <img
        alt="Filter"
        src={`/static/assets/images/icons/Table Filter.png`}
        style={{
          width: '16px',
          height: '16px',
          margin: '0px 15px',
        }}
      />*/}
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
          width: '24px',
          height: '30px',
          margin: '0px 10px 0px 25px',
          cursor: 'pointer',
        }}
      />
      <img
        onClick={() => {
          if (exportCSV && typeof exportCSV === 'function') {
            exportCSV();
          }
        }}
        alt="XLS"
        src={`/static/assets/images/icons/XLS.png`}
        style={{
          width: '24px',
          height: '30px',
          cursor: 'pointer',
        }}
      />
    </span>
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
    tableDescription,
    exportCSV,
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
    (column: DataColumnMeta, i: number): Column<D> => {
      const { key, label, dataType } = column;
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
          padding: '23px 5px',
          borderRight: '1px #CFD8DB solid',
          borderTop: '1px #CFD8DB solid',
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
      return {
        id: String(i), // to allow duplicate column keys
        accessor: key,
        Header: label,
        SortIcon,
        sortDescFirst: sortDesc,
        sortType: getSortTypeByDataType(dataType),
        cellProps,
      };
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
    return columnsMeta.map(getColumnConfigs);
  }, [columnsMeta, getColumnConfigs]);

  return (
    <Styles>
      <DataTable<D>
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
        tableDescription={tableDescription}
        exportCSV={exportCSV}
      />
    </Styles>
  );
}
