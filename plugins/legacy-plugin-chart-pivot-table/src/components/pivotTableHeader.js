export default function pivotTableHeader(tableId, filterColumns) {
  return `
    <img
      id="pivot-table-reset-filter-button"
      alt="Reset"
      src="/static/assets/images/icons/Reset Table Filter.png"
      style="width: 16px; height: 16px; margin: 8px ${
        filterColumns && filterColumns.length ? '0' : '15'
      }px 8px; cursor: pointer;"
    >
    ${
      filterColumns && filterColumns.length
        ? `
            <img
              id="pivot-table-popup-filter-button"
              data-toggle="modal"
              data-target="#pivot-table-filter-modal-${tableId}"
              alt="Filter"
              src="/static/assets/images/icons/Table Filter.png"
              style="width: 17px; height: 16px; margin: 8px 15px; cursor: pointer;"
            >
          `
        : ''
    }
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
    <div
      class="modal fade pivotTableFilterModal"
      id="pivot-table-filter-modal-${tableId}"
      role="dialog"
      style="margin-left: 19vw;"
    >
      <div class="modal-dialog">
        <div class="modal-content" style="overflow-y: auto;">
          <div
            class="modal-header"
            style="padding: 25px 23px 26px; border-bottom: none;"
          >
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4
              class="modal-title"
              style="color: #202C56; font-family: 'Roboto', sans-serif; font-weight: 700; font-size: 22px; margin: 0px 0px 0px 27px;"
            >
              Filter
            </h4>
          </div>
          <div class="modal-body" style="padding: 0px 50px;">
            <hr style="margin: 0px 0px 30px 0px; border-top: #D3DBF6 1px solid">
            <div id="react-filter-component-${tableId}"></div>
            <hr style="margin: 0px; border-top: #D3DBF6 1px solid">
          </div>
          <div
            class="modal-footer"
            style="padding: 40px; display: flex; justify-content: center"
          >
            <button
              id="apply-popup-filter-button"
              type="button"
              class="btn btn-default"
              data-dismiss="modal"
              style="text-transform: unset; height: 35px; width: 147px; background: transparent linear-gradient(270deg, #B3C3EF 0%, #7C90DB 100%) 0% 0% no-repeat padding-box; border-radius: 18px; border: none; color: white; font-weight: 700; font-size: 13px;"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function headingAndInfo($container, tableHeader, tableDescription) {
  $container.find('.header-description').css('display', 'flex').css('justify-content', 'flex-start')
    .append(`
      <span style="font-size: 24px">${tableHeader || 'Table Heading'}</span>
      <img
        title="${tableDescription || 'No Description provided'}"
        alt="Description"
        src="/static/assets/images/icons/Table Description.png"
        style="width: 16px; height: 16px; margin: 8px 0px 0px 7.5px;"
      >
    `);
}
