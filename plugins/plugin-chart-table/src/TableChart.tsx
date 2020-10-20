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
import { Modal, Button } from 'react-bootstrap';
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
      maxMenuHeight={150}
    />
  );
};

function SearchInput({
  count,
  value,
  onChange,
  setValue,
  exportCSV,
  tableHeader,
  uniqueTableIdForPDFDownload,
  filterComponentArray,
  columnFilter,
  getKeyOrLableContent,
  globalSelectControl,
  applyColumnFilter,
  preGlobalFilteredRows,
  data,
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
      <Modal
        className="tableFilterModal"
        style={{
          display: 'flex',
          alignItems: 'center',
          marginLeft: '19vw',
        }}
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
            {t('Table Filter Configuration')}
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
                    {
                      <SelectControl
                        columnLabel={columnLabel}
                        globalSelectControl={globalSelectControl}
                        column={column}
                        appliedFilersObject={appliedFilers ? appliedFilers[0] || {} : {}}
                        updateSearchInputFilterArray={updateSearchInputFilterArray}
                        preGlobalFilteredRows={preGlobalFilteredRows}
                      />
                    }
                  </div>
                </div>
              );
            })}
          <hr style={{ margin: '0px', borderTop: '#D3DBF6 1px solid' }} />
        </Modal.Body>
        <Modal.Footer style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
          <Button
            type="button"
            id="btn_modal_save"
            className="btn pull-left"
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
    getKeyOrLableContent,
    getColorGradientArray,
    globalSelectControl,
    colorScheme,
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

      // seaching if current column custom filter is present or not if preset addingg a key canCustomFilter true
      let isFilterColumn = null;
      let isFixedColumn = null;
      if (filterColumns && filterColumns.length) {
        filterColumns.map(i => {
          if (label.includes(i)) isFilterColumn = label;
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
        Filter: SelectControl,
        filter: (rows, id, filterValue) => {
          return rows.filter(row => {
            return filterValue.includes(row.values[id]);
          });
        },
        SortIcon,
        sortDescFirst: sortDesc,
        sortType: getSortTypeByDataType(dataType),
        cellProps,
        canCustomFilter: isFilterColumn ? true : false,
        sticky: isFixedColumn ? 'left' : '',
      };
      if (label.includes('organization')) {
        columnObject.width = 200;
      }
      if (label.includes('video_title')) {
        columnObject.width = 226;
      }
      if (label.includes('positive_sentiment_valence')) {
        columnObject.width = 200;
      }
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
    const ignoreColumnList = [
      'platform',
      'negative_sentiment_valence',
      'neutral_sentiment_valence',
    ];
    return columnsMeta
      .filter(i => {
        let column;
        ignoreColumnList.map(ignoreCol => {
          if (i.key.includes(ignoreCol)) column = ignoreCol;
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
        tableDescription={tableDescription}
        exportCSV={exportCSV}
        getKeyOrLableContent={getKeyOrLableContent}
        getColorGradientArray={getColorGradientArray}
        colorScheme={colorScheme}
        fixedColumns={fixedColumns}
        filterColumns={filterColumns}
        globalSelectControl={globalSelectControl}
        marginLeftForHorizontalScroll={
          fixedColumns && fixedColumns.length > 0
            ? fixedColumns
                .map(i => {
                  if (i === 'organization') {
                    return 200;
                  } else if (i === 'video_title') {
                    return 226;
                  } else if (i === 'positive_sentiment_valence') {
                    return 200;
                  } else {
                    return 150;
                  }
                })
                .reduce((a, b) => a + b)
            : 0
        }
      />
    </Styles>
  );
}
