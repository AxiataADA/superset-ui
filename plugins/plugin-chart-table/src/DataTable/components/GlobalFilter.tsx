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
import React, { ComponentType, ChangeEventHandler } from 'react';
import { Row, FilterValue } from 'react-table';
import useAsyncState from '../utils/useAsyncState';

export interface SearchInputProps {
  count: number;
  value: string;
  tableHeader: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  exportCSV: ChangeEventHandler<HTMLInputElement>;
  downloadAsImage: ChangeEventHandler<HTMLInputElement>;
}

export interface GlobalFilterProps<D extends object> {
  preGlobalFilteredRows: Row<D>[];
  // filter value cannot be `undefined` otherwise React will report component
  // control type undefined error
  filterValue: string;
  tableHeader: string;
  setGlobalFilter: (filterValue: FilterValue) => void;
  searchInput?: ComponentType<SearchInputProps>;
  exportCSV: ChangeEventHandler<HTMLInputElement>;
  downloadAsImage: ChangeEventHandler<HTMLInputElement>;
}

function DefaultSearchInput({ count, value, onChange, exportCSV }: SearchInputProps) {
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
      <input
        className="form-control input-sm"
        placeholder={`${count} records...`}
        value={value}
        onChange={onChange}
      />
      <img
        alt="Filter"
        src={`/static/assets/images/icons/PDF.png`}
        style={{
          width: '24px',
          height: '30px',
          margin: '0px 15px 0px 25px',
        }}
      />
      <img
        alt="Filter"
        src={`/static/assets/images/icons/XLS.png`}
        style={{
          width: '24px',
          height: '30px',
        }}
      />
    </span>
  );
}

export default (React.memo as <T>(fn: T) => T)(function GlobalFilter<D extends object>({
  preGlobalFilteredRows,
  filterValue = '',
  searchInput,
  setGlobalFilter,
  exportCSV,
  downloadAsImage,
  tableHeader,
}: GlobalFilterProps<D>) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = useAsyncState(
    filterValue,
    (newValue: string) => {
      setGlobalFilter(newValue || undefined);
    },
    200,
  );

  const SearchInput = searchInput || DefaultSearchInput;

  return (
    <SearchInput
      count={count}
      value={value}
      onChange={e => {
        const target = e.target as HTMLInputElement;
        e.preventDefault();
        setValue(target.value);
      }}
      exportCSV={exportCSV}
      downloadAsImage={downloadAsImage}
      tableHeader={tableHeader}
    />
  );
});
