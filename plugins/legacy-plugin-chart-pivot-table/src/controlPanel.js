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
import { t } from '@superset-ui/translation';
import {
  D3_FORMAT_OPTIONS,
  D3_FORMAT_DOCS,
  formatSelectOptions,
  D3_TIME_FORMAT_OPTIONS,
  ColumnOption,
} from '@superset-ui/chart-controls';

const filter_columns = {
  type: 'SelectControl',
  label: t('Filter Columns'),
  description: t('Filters to display based on column'),
  multi: true,
  freeForm: true,
  allowAll: true,
  commaChoosesOption: false,
  default: [],
  optionRenderer: c => <ColumnOption showType column={c} />,
  valueRenderer: c => <ColumnOption column={c} />,
  valueKey: 'column_name',
  mapStateToProps: ({ datasource, controls }) => {
    return {
      options: datasource?.columns || [],
    };
  },
};

export default {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        ['metrics'],
        ['adhoc_filters'],
        ['groupby'],
        ['columns'],
        ['row_limit', null],
      ],
    },
    {
      label: t('Pivot Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'pandas_aggfunc',
            config: {
              type: 'SelectControl',
              label: t('Aggregation function'),
              clearable: false,
              choices: formatSelectOptions(['sum', 'mean', 'min', 'max', 'std', 'var']),
              default: 'sum',
              description: t(
                'Aggregate function to apply when pivoting and ' +
                  'computing the total rows and columns',
              ),
            },
          },
          null,
        ],
        [
          {
            name: 'pivot_margins',
            config: {
              type: 'CheckboxControl',
              label: t('Show totals'),
              default: true,
              description: t('Display total row/column'),
            },
          },
          {
            name: 'combine_metric',
            config: {
              type: 'CheckboxControl',
              label: t('Combine Metrics'),
              default: false,
              description: t(
                'Display metrics side by side within each column, as ' +
                  'opposed to each column being displayed side by side for each metric.',
              ),
            },
          },
        ],
        [
          {
            name: 'show_pagination_and_search',
            config: {
              type: 'CheckboxControl',
              label: t('Show Pagination and Global Search'),
              default: true,
              description: t(
                'Show pagination for the current table and fixed the header also add a global search box',
              ),
            },
          },
          {
            name: 'transpose_pivot',
            config: {
              type: 'CheckboxControl',
              label: t('Transpose Pivot'),
              default: false,
              description: t('Swap Groups and Columns'),
            },
          },
        ],
        [
          {
            name: 'show_table_header_and_info_icon',
            config: {
              type: 'CheckboxControl',
              label: t('Show Table Header and Info Icon'),
              default: false,
              description: t(
                'Show table header and info iscon to provide more information about the pivot table',
              ),
            },
          },
        ],
        [
          {
            name: 'page_size',
            config: {
              type: 'SelectControl',
              freeForm: true,
              label: t('Page Size'),
              default: '10',
              description: t('Number of entris to show on each page default is 10'),
              choices: formatSelectOptions(['5', '10', '15', '20']),
            },
          },
        ],
        [
          {
            name: 'tableHeader',
            config: {
              type: 'TextControl',
              default: '',
              label: t('Table Heading'),
              description: t(
                'Pivot table heading text for to display in table header. NOte: you need to check "Show Table Header and Info Icon" display this above table.',
              ),
            },
          },
        ],
        [
          {
            name: 'tableDescription',
            config: {
              type: 'TextControl',
              default: '',
              label: t('Table Description'),
              description: t(
                'Description text that shows up when you hover over the info icon. Note: you need to check "Show Table Header and Info Icon" to display this.',
              ),
            },
          },
        ],
        [
          {
            name: 'filter_columns',
            config: filter_columns,
          },
        ],
        [
          {
            name: 'column_width_string',
            config: {
              type: 'TextControl',
              default: '',
              placeHolder: '200,100,100',
              label: t('Column width string'),
              description: t(
                'Provide a comma separated values of column width for groupby columns default width for every column is 80 provide 0 to skip a column for example. 200,100,0 for first three columns. Note: Width will only be applied to group by column',
              ),
            },
          },
        ],
        [
          {
            name: 'column_alignment_string',
            config: {
              type: 'TextControl',
              default: '',
              placeHolder: 'left,center,center',
              label: t('Column alignment string'),
              description: t(
                'Provide a comma separated values of column text alignment from the first column default alignment for every column is center. for example. left,center,right for first three columns. Note: alignment will only be applied to group by column',
              ),
            },
          },
        ],
      ],
    },
    {
      label: t('Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'number_format',
            config: {
              type: 'SelectControl',
              freeForm: true,
              label: t('Number format'),
              renderTrigger: true,
              default: 'SMART_NUMBER',
              choices: D3_FORMAT_OPTIONS,
              description: D3_FORMAT_DOCS,
            },
          },
        ],
        [
          {
            name: 'date_format',
            config: {
              type: 'SelectControl',
              freeForm: true,
              label: t('Date format'),
              renderTrigger: true,
              choices: D3_TIME_FORMAT_OPTIONS,
              default: 'smart_date',
              description: D3_FORMAT_DOCS,
            },
          },
        ],
      ],
    },
  ],
  controlOverrides: {
    groupby: { includeTime: true },
    columns: { includeTime: true },
  },
  sectionOverrides: {
    druidTimeSeries: {
      controlSetRows: [['granularity', 'druid_time_origin'], ['time_range']],
    },
    sqlaTimeSeries: {
      controlSetRows: [['granularity_sqla', 'time_grain_sqla'], ['time_range']],
    },
  },
};
