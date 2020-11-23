import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const platformObject = {
  youtube: 'Youtube',
  facebook: 'Facebook',
  instagram: 'Instagram',
};

export function createUniqueId() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function getRequiredDateFormat(dateString) {
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

export const propTypes = {
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
  verboseMap: PropTypes.objectOf(PropTypes.string),
};

// function to create and download pivot table
export const downloadPivotTablePDF = function downloadPDF(uniqueTableId, tableHeader) {
  html2canvas(document.querySelector(`.pivot-table-${uniqueTableId}`), {
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
