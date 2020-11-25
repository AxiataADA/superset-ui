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
import React from 'react';
import ReactDOM from 'react-dom';
import dt from 'datatables.net-bs';
// import fdt from 'datatables.net-fixedcolumns';
import 'datatables.net-bs/css/dataTables.bootstrap.css';
import {
  getTimeFormatter,
  getTimeFormatterForGranularity,
  smartDateFormatter,
} from '@superset-ui/time-format';
import Header, { headingAndInfo } from './components/pivotTableHeader';
import RenderFilter from './components/filters';
import fixTableHeight from './utils/fixTableHeight';
import createDataTable from './utils/createDataTable';
import replaceCell from './utils/replaceCell';
import { createUniqueId, propTypes, downloadPivotTablePDF } from './utils';
import './style/index.css';

if (window.$) {
  //table filter fixed column handling
  // fdt( window, window.$ );

  dt(window, window.$);
}
const $ = window.$ || dt.$;

function PivotTable(element, props) {
  const {
    columnFormats,
    data,
    dateFormat,
    granularity,
    height,
    width,
    numberFormat,
    verboseMap,
    showPaginationAndSearch,
    getKeyOrLableContent,
    columnWidthArray,
    pageSize,
    columnAlignmentArray,
    showTableHeaderAndInfoIcon,
    tableHeader,
    tableDescription,
    exportCSV,
    groupby,
    globalSelectControl,
    filterColumns,
    numGroups,
  } = props;
  const uniqueTableId = createUniqueId();
  const { html, columns } = data;
  const totalNumberOfColumns = columns.length + numGroups;
  const container = element;
  const $container = $(element);

  // queryData data is a string of html with a single table element
  container.innerHTML = html;

  // replace cell data as per the requirement also seperate the rowspan in the table body as datatable does not support rowspan
  replaceCell($container, columns, verboseMap, getKeyOrLableContent, columnFormats);

  // filter data preperation ( filter column object, appliefilters )
  let originalPopupFilterArrayForDataTable = [];
  let popupFilterArrayForDataTable = [];
  const filterComponentArray =
    filterColumns &&
    filterColumns
      .map(column => {
        const id = groupby.indexOf(column);
        if (id > -1) {
          return {
            id: id,
            name: column,
            options: new Set(),
          };
        }
      })
      .filter(i => i !== undefined);

  const setPopupFilterArrayForDataTable = array => {
    popupFilterArrayForDataTable = array;
  };

  if (showPaginationAndSearch) {
    // creating column def object
    const columnDefs =
      groupby && groupby.length
        ? groupby.map((column, i) => ({
            targets: i,
            width:
              columnWidthArray &&
              columnWidthArray.length &&
              !isNaN(columnWidthArray[i]) &&
              columnWidthArray[i] > 80
                ? columnWidthArray[i]
                : 80,
            createdCell: function (td, cellData, rowData, row, col) {
              $(td).css('text-align', columnAlignmentArray[i] ? columnAlignmentArray[i] : 'center');
              if (
                filterColumns &&
                filterColumns.includes(column) &&
                !['published_date', 'as_of_date', 'crawled_date'].includes(column)
              ) {
                filterComponentArray.forEach(columnObj => {
                  if (columnObj.id === i) columnObj.options.add(cellData);
                });
              }
            },
          }))
        : [];

    // if the columns do not occupy the full width than change their default width to avoid white space in the table
    if (width / totalNumberOfColumns > 80) {
      columnDefs.push({
        targets: '_all',
        width: width / totalNumberOfColumns,
      });
    }

    container.style.overflow = 'hidden';
    const table = createDataTable($container, uniqueTableId, pageSize, height, columnDefs);
    table.column('-1').order('desc').draw();

    fixTableHeight($container.find('.dataTables_wrapper'), height - 60);

    /*
      adding following things in header with their styling
      table header,
      table description,
      reset filter button,
      filter popup show button,
      global search inputs
      pdf download button,
      xls download button
    */
    if (showTableHeaderAndInfoIcon) headingAndInfo($container, tableHeader, tableDescription);

    $container
      .find('.pivot-table-filter')
      .css('display', 'flex')
      .css('justify-content', 'flex-end')
      .append(Header(uniqueTableId, filterColumns));

    $container.find('#pivot-table-popup-filter-button').click(function () {
      // adding filters inside the filter modal body
      ReactDOM.render(
        <RenderFilter
          filterComponentArray={filterComponentArray}
          getKeyOrLableContent={getKeyOrLableContent}
          globalSelectControl={globalSelectControl}
          setPopupFilterArrayForDataTable={setPopupFilterArrayForDataTable}
          popupFilterArrayForDataTable={popupFilterArrayForDataTable}
        />,
        document.querySelector(`#react-filter-component-${uniqueTableId}`),
      );
    });

    $.fn.dataTableExt.afnFiltering.push(function (Settings, Data, DataIndex) {
      if (popupFilterArrayForDataTable && popupFilterArrayForDataTable.length === 0) {
        return true;
      }
      let isCurrentRowTrue = true;
      popupFilterArrayForDataTable.map(columnFilter => {
        const { value, id, name } = columnFilter;
        if (value?.length) {
          if (['published_date', 'as_of_date', 'crawled_date'].includes(name)) {
            isCurrentRowTrue =
              isCurrentRowTrue &&
              new Date(Data[id]) <= new Date(value[1]) &&
              new Date(Data[id]) >= new Date(value[0]);
          } else {
            isCurrentRowTrue = isCurrentRowTrue && value.includes(Data[0]);
          }
        }
      });
      originalPopupFilterArrayForDataTable = JSON.parse(
        JSON.stringify(popupFilterArrayForDataTable ? popupFilterArrayForDataTable : []),
      );
      return isCurrentRowTrue;
    });

    $container.find('.pivotTableFilterModal').on('hidden.bs.modal', function () {
      popupFilterArrayForDataTable = JSON.parse(
        JSON.stringify(
          originalPopupFilterArrayForDataTable ? originalPopupFilterArrayForDataTable : [],
        ),
      );
    });

    $container.find('#pivot-table-global-filter-input').keyup(function () {
      table.search($(this).val()).draw();
    });

    $container.find('#pivot-table-reset-filter-button').click(function () {
      popupFilterArrayForDataTable = [];
      originalPopupFilterArrayForDataTable = [];
      table.search('');
      table.draw();
      $container.find('#pivot-table-global-filter-input').val('');
    });

    $container.find('#apply-popup-filter-button').click(() => {
      table.draw();
    });

    $container
      .find('#download-pdf-button')
      .click(() => downloadPivotTablePDF(uniqueTableId, tableHeader));
    $container.find('#download-csv-button').click(exportCSV);
  } else {
    container.style.overflow = 'auto';
    container.style.height = `${height + 10}px`;
  }
}

PivotTable.displayName = 'PivotTable';
PivotTable.propTypes = propTypes;

export default PivotTable;
