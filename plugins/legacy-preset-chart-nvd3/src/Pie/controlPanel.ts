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
import { D3_FORMAT_OPTIONS } from '@superset-ui/chart-controls';
import { showLegend } from '../NVD3Controls';

export default {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [['metric'], ['adhoc_filters'], ['groupby'], ['row_limit']],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'pie_label_type',
            config: {
              type: 'SelectControl',
              label: t('Label Type'),
              default: 'key',
              renderTrigger: true,
              choices: [
                ['key', 'Category Name'],
                ['value', 'Value'],
                ['percent', 'Percentage'],
                ['key_value', 'Category and Value'],
                ['key_percent', 'Category and Percentage'],
              ],
              description: t('What should be shown on the label?'),
            },
          },
          {
            name: 'number_format',
            config: {
              type: 'SelectControl',
              freeForm: true,
              label: t('Number format for lable'),
              renderTrigger: true,
              default: 'SMART_NUMBER',
              choices: D3_FORMAT_OPTIONS,
              description: `${t('D3 format syntax: https://github.com/d3/d3-format')} ${t(
                'Only applies when the "Label Type" is not set to a percentage.',
              )}`,
            },
          },
        ],
        [
          {
            name: 'donut',
            config: {
              type: 'CheckboxControl',
              label: t('Donut'),
              default: false,
              renderTrigger: true,
              description: t('Do you want a donut or a pie?'),
            },
          },
          showLegend,
        ],
        [
          {
            name: 'show_labels',
            config: {
              type: 'CheckboxControl',
              label: t('Show Labels'),
              renderTrigger: true,
              default: true,
              description: t(
                'Whether to display the labels. Note that the label only displays when the the 5% ' +
                  'threshold.',
              ),
            },
          },
          {
            name: 'labels_outside',
            config: {
              type: 'CheckboxControl',
              label: t('Put labels outside'),
              default: true,
              renderTrigger: true,
              description: t('Put the labels outside the pie?'),
            },
          },
        ],
        ['color_scheme', 'label_colors'],
        [
          {
            name: 'donutRatio',
            config: {
              type: 'SelectControl',
              label: t('Donut Inner Radius'),
              renderTrigger: true,
              default: 17,
              clearable: false,
              // Values represent the percentage of space a subheader should take
              options: [
                {
                  label: t('Tiny'),
                  value: 19,
                },
                {
                  label: t('Small'),
                  value: 17,
                },
                {
                  label: t('Normal'),
                  value: 15,
                },
                {
                  label: t('Large'),
                  value: 13,
                },
                {
                  label: t('Huge'),
                  value: 11,
                },
              ],
              description: 'Only applied when "Donut" is selected',
            },
          },
        ],
      ],
    },
    {
      label: t('Icon Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'icon',
            config: {
              type: 'SelectControl',
              label: t('Icon'),
              renderTrigger: true,
              default: 'Youtube',
              choices: [
                ['Youtube', 'Youtube'],
                ['Instagram', 'Instagram'],
                ['Facebook', 'Facebook'],
                ['Video', 'Video'],
                ['View', 'View'],
                ['Like', 'Like'],
                ['Dislike', 'Dislike'],
                ['Share', 'Share'],
                ['Subscriber', 'Subscriber'],
                ['Comment', 'Comment'],
              ],
              description: `${t('Show icon inside donut chart')} ${t(
                'Only applies when "Donut" checkbox is selected.',
              )}`,
            },
          },
        ],
        [
          {
            name: 'iconSize',
            config: {
              type: 'SelectControl',
              label: t('Size'),
              renderTrigger: true,
              clearable: false,
              default: 0.375,
              // Values represent the percentage of space a subheader should take
              options: [
                {
                  label: t('tiny'),
                  value: 0.3,
                },
                {
                  label: t('Small'),
                  value: 0.35,
                },
                {
                  label: t('Normal'),
                  value: 0.375,
                },
                {
                  label: t('Large'),
                  value: 0.4,
                },
                {
                  label: t('Huge'),
                  value: 0.45,
                },
              ],
              description: 'Select icon size from three options default is normal',
            },
          },
        ],
      ],
    },
    {
      label: t('Total Count Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'countFormat',
            config: {
              type: 'SelectControl',
              freeForm: true,
              label: t('Format'),
              renderTrigger: true,
              default: 'SMART_NUMBER',
              choices: D3_FORMAT_OPTIONS,
            },
          },
        ],
        [
          {
            name: 'countSize',
            config: {
              type: 'SelectControl',
              label: t('Size'),
              renderTrigger: true,
              clearable: false,
              default: 0.1,
              // Values represent the percentage of space a subheader should take
              options: [
                {
                  label: t('Tiny'),
                  value: 0.05,
                },
                {
                  label: t('Small'),
                  value: 0.075,
                },
                {
                  label: t('Normal'),
                  value: 0.1,
                },
                {
                  label: t('Large'),
                  value: 0.125,
                },
                {
                  label: t('Huge'),
                  value: 0.15,
                },
              ],
              description: 'Select icon size from six options default is normal',
            },
          },
        ],
        [
          {
            name: 'countMarginTop',
            config: {
              type: 'SelectControl',
              label: t('Top Margin'),
              renderTrigger: true,
              clearable: false,
              default: 0.1,
              // Values represent the percentage of space a subheader should take
              options: [
                {
                  label: t('Tiny'),
                  value: 0,
                },
                {
                  label: t('Small'),
                  value: 0.05,
                },
                {
                  label: t('Normal'),
                  value: 0.1,
                },
                {
                  label: t('Large'),
                  value: 0.15,
                },
                {
                  label: t('Huge'),
                  value: 0.175,
                },
              ],
              description: 'Select icon size from three options default is normal',
            },
          },
        ],
      ],
    },
    {
      label: t('Bottom Text Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'bottomText',
            config: {
              type: 'TextControl',
              renderTrigger: true,
              default: 'Sample Text',
              label: t('Text'),
              description: t('Description text that shows up below your donut or pie chart'),
            },
          },
        ],
      ],
    },
  ],
  controlOverrides: {
    row_limit: {
      default: 25,
    },
  },
};
