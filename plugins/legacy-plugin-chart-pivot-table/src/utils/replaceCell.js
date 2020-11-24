import { platformObject, getRequiredDateFormat } from './index.js';
import { formatNumber } from '@superset-ui/number-format';

export default (
  $container,
  columns,
  verboseMap,
  getKeyOrLableContent,
  columnFormats,
  numberFormat,
) => {
  const cols = Array.isArray(columns[0]) ? columns.map(col => col[0]) : columns;
  // regex to parse dates
  const dateRegex = /^__timestamp:(-?\d*\.?\d*)$/;

  // jQuery hack to set verbose names in headers
  // eslint-disable-next-line func-name-matching
  const replaceCell = function replaceCellFunction(element) {
    return function replace() {
      const s = $(this)[0].textContent;
      let isThUpdated = false;

      // checking if th is a platform if yes then adding a image instate of text also to prevent further updation making isThUpdated true
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
        isThUpdated = true;
      }

      // checking if th is updated if not updated following the normal procedure to update
      if (!isThUpdated) {
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
      }

      // checking if th has row span attribute if yes seperating those rowspan and removing the attr
      if (element === 'body') {
        const rowSpan = $(this).attr('rowspan');
        if (rowSpan && rowSpan > 1) {
          $(this).removeAttr('rowspan');
          let currentRow = $(this).parent();
          for (let i = 1; i < rowSpan; i++) {
            currentRow = currentRow.next();
            currentRow.prepend($(this).clone(true));
          }
        }
      }
    };
  };

  $container.find('thead tr th').each(replaceCell('head'));
  $container.find('tbody tr th').each(replaceCell('body'));

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
};
