export default function createDataTable($container, uniqueTableId, pageSize, height, columnDefs) {
  return $container.find('table').DataTable({
    // dom is used for managing the layout
    dom:
      "<'row'<'col-sm-12 pivot-table-header'<'header-description'><'pivot-table-filter'>>>" +
      `<'row pivot-table-${uniqueTableId}'<'col-sm-12't>>` +
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
    fixedColumns: {
      leftColumns: 2,
    },
  });
}
