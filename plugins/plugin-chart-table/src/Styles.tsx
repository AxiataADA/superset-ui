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
    font-size: 13px;
    font-family: 'Roboto', sans-serif;
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

  .dt-controls .row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .dt-controls .row:before {
    content: none;
  }

  .dt-controls .row:after {
    content: none;
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
    display: flex;
    align-items: center;
    min-width: 380px;
    padding: 0px 10px;
  }

  .dt-pagination {
    text-align: right;
    /* use padding instead of margin so clientHeight can capture it */
    padding-top: 15px;
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

  .table-search-input-with-icon {
    position: relative;
    width: 210px;
    height: 30px;
    border: 1px solid #7c90db;
    border-radius: 16px;
    overflow: hidden;
  }

  .table-search-input-box-icon {
    height: 100%;
    position: absolute;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4f62aa;
    padding: 0px 12px;
    font-size: 13px;
    font-family: 'Roboto', sans-serif;
  }

  .table-search-input {
    border: none;
    margin-left: 25px;
    width: 205px;
    font-family: 'Roboto', sans-serif;
    &::placeholder {
      color: #7c90db;
      for-size: 13px;
      font-family: 'Roboto', sans-serif;
    }

    &:-ms-input-placeholder {
      font-family: 'Roboto', sans-serif;
      color: #7c90db;
      for-size: 13px;
    }

    &::-ms-input-placeholder {
      font-family: 'Roboto', sans-serif;
      color: #7c90db;
      for-size: 13px;
    }

    &:focus {
      outline: none;
      box-shadow: none;
    }
  }

  .sort-column-icon {
    margin: -2px 5px;
    color: #7c90db !important;
    font-size: 14px;
  }
`;
