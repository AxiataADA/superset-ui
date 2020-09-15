import styled from '@superset-ui/style';

export default styled.div`
  table {
    width: 100%;
    min-width: auto;
    max-width: none;
    margin: 0;
  }

  th,
  td {
    min-width: 4.3em;
    text-align: center;
  }

  thead > tr > th {
    position: relative;
    background: #fff;
    padding: 20px 5px;
    background-color: #f8f8f8;
    color: #4f62aa;
    border-right: 1px #cfd8db solid;
    border-bottom: none;
  }
  th svg {
    color: #ccc;
    position: absolute;
    bottom: 0.6em;
    right: 0.2em;
  }
  th.is-sorted svg {
    color: #a8a8a8;
  }
  .table > tbody > tr:first-of-type > td,
  .table > tbody > tr:first-of-type > th {
    border-top: 0;
    border-bottom: 0;
  }

  .dt-controls {
    padding-bottom: 0.65em;
  }
  .dt-metric {
    text-align: center;
  }
  td.dt-is-filter {
    cursor: pointer;
  }
  td.dt-is-filter:hover {
    background-color: linen;
  }
  td.dt-is-active-filter,
  td.dt-is-active-filter:hover {
    background-color: lightcyan;
  }

  .dt-global-filter {
    float: right;
  }

  .dt-pagination {
    text-align: right;
    /* use padding instead of margin so clientHeight can capture it */
    padding-top: 0.5em;
  }
  .dt-pagination .pagination {
    margin: 0;
  }

  .pagination > li > span.dt-pagination-ellipsis:focus,
  .pagination > li > span.dt-pagination-ellipsis:hover {
    background: #fff;
  }

  .dt-no-results {
    text-align: center;
    padding: 1em 0.6em;
  }
`;
