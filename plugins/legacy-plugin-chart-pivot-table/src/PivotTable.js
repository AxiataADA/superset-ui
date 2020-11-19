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
/* eslint-disable react/sort-prop-types */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import dt from 'datatables.net-bs';
import PropTypes from 'prop-types';
import { formatNumber } from '@superset-ui/number-format';
import {
  getTimeFormatter,
  getTimeFormatterForGranularity,
  smartDateFormatter,
} from '@superset-ui/time-format';
import fixTableHeight from './utils/fixTableHeight';
import 'datatables.net-bs/css/dataTables.bootstrap.css';
import './PivotTable.css';

const platformObject = {
  youtube: 'Youtube',
  facebook: 'Facebook',
  instagram: 'Instagram',
};

function createUniqueId() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getRequiredDateFormat(dateString) {
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

if (window.$) {
  dt(window, window.$);
}
const $ = window.$ || dt.$;

const propTypes = {
  data: PropTypes.shape({
    // TODO: replace this with raw data in SIP-6
    html: PropTypes.string,
    columns: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    ),
  }),
  height: PropTypes.number,
  columnFormats: PropTypes.objectOf(PropTypes.string),
  numberFormat: PropTypes.string,
  numGroups: PropTypes.number,
  verboseMap: PropTypes.objectOf(PropTypes.string),
};

function PivotTable(element, props) {
  const {
    columnFormats,
    data,
    dateFormat,
    granularity,
    height,
    numberFormat,
    numGroups,
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
  } = props;
  const uniqueTableIdForPDFDownload = createUniqueId();
  const { html, columns } = data;
  const container = element;
  const $container = $(element);
  let dateFormatter;

  if (dateFormat === smartDateFormatter.id && granularity) {
    dateFormatter = getTimeFormatterForGranularity(granularity);
  } else if (dateFormat) {
    dateFormatter = getTimeFormatter(dateFormat);
  } else {
    dateFormatter = String;
  }

  // queryData data is a string of html with a single table element
  container.innerHTML = html;

  const cols = Array.isArray(columns[0]) ? columns.map(col => col[0]) : columns;
  // regex to parse dates
  const dateRegex = /^__timestamp:(-?\d*\.?\d*)$/;

  // jQuery hack to set verbose names in headers
  // eslint-disable-next-line func-name-matching
  const replaceCell = function replace() {
    const s = $(this)[0].textContent;

    if (
      s &&
      typeof s === 'string' &&
      ['youtube', 'facebook', 'instagram'].includes(s.toLowerCase())
    ) {
      $(this)[0].innerHTML = `
        <img
          alt="Platform"
          src='/static/assets/images/Donut Chart Icon/${platformObject[s.toLowerCase()]}.png'
          style="height: 20px;"
        >
      `;
      return;
    }

    const regexMatch = dateRegex.exec(s);
    let cellValue;
    if (regexMatch) {
      const date = new Date(parseFloat(regexMatch[1]));
      cellValue = getRequiredDateFormat(date);
    } else {
      cellValue = verboseMap[s] || s;
    }
    if (cellValue) {
      cellValue = getKeyOrLableContent(cellValue);
      const date = new Date(cellValue);
      if (date instanceof Date && !isNaN(date.getTime())) {
        cellValue = getRequiredDateFormat(cellValue);
      }
    }
    $(this)[0].textContent = cellValue;
  };
  $container.find('thead tr th').each(replaceCell);
  $container.find('tbody tr th').each(replaceCell);

  // jQuery hack to format number
  $container.find('tbody tr').each(function eachRow() {
    $(this)
      .find('td')
      .each(function each(i) {
        const metric = cols[i];
        const format = columnFormats[metric] || numberFormat || '.3s';
        const tdText = $(this)[0].textContent;
        const parsedValue = parseFloat(tdText);
        if (Number.isNaN(parsedValue)) {
          const regexMatch = dateRegex.exec(tdText);
          if (regexMatch) {
            const date = new Date(parseFloat(regexMatch[1]));
            $(this)[0].textContent = getRequiredDateFormat(date);
            $(this).attr('data-sort', date);
          }
          if (tdText === 'null' || tdText === null) {
            $(this)[0].textContent = 'N/A';
            $(this).attr('data-sort', parsedValue);
          }
        } else {
          $(this)[0].textContent = formatNumber(format, parsedValue);
          $(this).attr('data-sort', parsedValue);
        }
      });
  });

  // function to create and download pivot table
  const downloadPivotTablePDF = function downloadPDF() {
    html2canvas(document.querySelector('.' + 'pivot-table-' + uniqueTableIdForPDFDownload), {
      scrollX: 0,
      scrollY: -window.scrollY,
    }).then(canvas => {
      let wid;
      let hgt;
      const imgData = canvas.toDataURL('image/png', (wid = canvas.width), (hgt = canvas.height));
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
      pdf.save(tableHeader || 'Agilebi Pivot Table' + '.pdf');
    });
  };

  // if (numGroups === 1) { commenting this default condition provided by superset
  // When there is only 1 group by column,
  // we use the DataTable plugin to make the header fixed.
  // The plugin takes care of the scrolling so we don't need
  // overflow: 'auto' on the table.
  if (showPaginationAndSearch) {
    // creating column def object
    const columnDefs =
      columnWidthArray && columnWidthArray.length
        ? columnWidthArray.map((width, index) => ({
            targets: index,
            width: !isNaN(width) && width > 50 ? width : 50,
            align: 'left',
            createdCell: function (td, cellData, rowData, row, col) {
              $(td).css(
                'text-align',
                columnAlignmentArray[index] ? columnAlignmentArray[index] : 'center',
              );
            },
          }))
        : [];

    container.style.overflow = 'hidden';
    const table = $container.find('table').DataTable({
      // dom is used for managing the layout
      dom:
        "<'row'<'col-sm-12 pivot-table-header'<'header-description'><'pivot-table-filter'>>>" +
        `<'row pivot-table-${uniqueTableIdForPDFDownload}'<'col-sm-12't>>` +
        "<'row'<'col-sm-12 pivot-table-footer'<'page-number-div-info'i><'pagination-div'p>>>",
      renderer: 'bootstrap',
      paging: true,
      pageLength: !isNaN(Number(pageSize)) && Number(pageSize) > 0 ? Number(pageSize) : 10,
      lengthChange: false,
      searching: true,
      bInfo: false,
      scrollY: `${height - 30}px`,
      scrollCollapse: true,
      scrollX: true,
      info: true,
      columnDefs,
      language: {
        paginate: {
          previous: "<i class='fa fa-chevron-left'></i>",
          next: "<i class='fa fa-chevron-right'></i>",
        },
        info: '_TOTAL_ Total Videos',
      },
    });
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
    if (showTableHeaderAndInfoIcon) {
      $container
        .find('.header-description')
        .css('display', 'flex')
        .css('justify-content', 'flex-start').append(`
        <span style="font-size: 24px">${tableHeader || 'Table Heading'}</span>
        <img
          title="${tableDescription || 'No Description provided'}"
          alt="Description"
          src="/static/assets/images/icons/Table Description.png"
          style="width: 16px; height: 16px; margin: 8px 0px 0px 7.5px;"
        >
        `);
    }
    $container.find('.pivot-table-filter').css('display', 'flex').css('justify-content', 'flex-end')
      .append(`
        <img
          alt="Reset"
          src="/static/assets/images/icons/Reset Table Filter.png"
          style="width: 16px; height: 16px; margin: 8px 0px; cursor: pointer;"
          onClick=""
        />
        <img
          alt="Filter"
          src="/static/assets/images/icons/Table Filter.png"
          style="width: 17px; height: 16px; margin: 8px 15px; cursor: pointer;"
          onClick=""
        />
        <div class="pivot-table-search-input-with-icon">
          <div class="pivot-table-search-input-box-icon">
            <div class="fa fa-search"></div>
          </div>
          <input
            id="pivot-table-global-filter-input"
            class="pivot-table-search-input form-control input-sm"
            placeholder="Search..."
          />
        </div>
        <img
          id="download-pdf-button"
          alt="PDF"
          src='/static/assets/images/icons/PDF.png'
          style='width: 24px; height: 30px; margin: 0px 10px 0px 25px; cursor: pointer;'
        >
        <img
          id="download-csv-button"
          alt="XLS"
          src='/static/assets/images/icons/XLS.png'
          style='width: 24px; height: 30px; cursor: pointer;'
        >
      `);

    $container.find('#pivot-table-global-filter-input').keyup(function () {
      table.search($(this).val()).draw();
    });

    $container.find('#download-pdf-button').click(downloadPivotTablePDF);
    $container.find('#download-csv-button').click(exportCSV);
  } else {
    // When there is more than 1 group by column we just render the table, without using
    // the DataTable plugin, so we need to handle the scrolling ourselves.
    // In this case the header is not fixed.
    container.style.overflow = 'auto';
    container.style.height = `${height + 10}px`;
  }
}

PivotTable.displayName = 'PivotTable';
PivotTable.propTypes = propTypes;

export default PivotTable;
