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
import d3 from 'd3';
import d3tip from 'd3-tip';
import dompurify from 'dompurify';
import { getNumberFormatter } from '@superset-ui/number-format';
import { smartDateFormatter } from '@superset-ui/time-format';

// Regexp for the label added to time shifted series
// (1 hour offset, 2 days offset, etc.)
const TIME_SHIFT_PATTERN = /\d+ \w+ offset/;

const ANIMATION_TIME = 1000;

/*
  get Color gradiant array for the charts and tooltipbelow is the global object and after that there is a functions
*/
const gradientobject = {
  'rgb(97, 62, 166)': ['rgb(97,62,166)', 'rgb(155,114,210)'],
  'rgb(26, 110, 254)': ['rgb(26,110,254)', 'rgb(56,167,255)'],
  'rgb(255, 33, 130)': ['rgb(255,33,130)', 'rgb(255,68,184)'],
  'rgb(109, 153, 226)': ['rgb(109,153,226)', 'rgb(166,201,243)'],
  'rgb(32, 187, 191)': ['rgb(32,187,191)', 'rgb(99,217,220)'],
  'rgb(175, 72, 155)': ['rgb(175,72,155)', 'rgb(223,96,250)'],
  'rgb(188, 202, 252)': ['rgb(188,202,252)', 'rgb(208,218,253)'],
  'rgb(147, 171, 254)': ['rgb(147,171,254)', 'rgb(179,196,254)'],
  'rgb(115, 145, 243)': ['rgb(115,145,243)', 'rgb(156,177,246)'],
  'rgb(92, 127, 236)': ['rgb(92,127,236)', 'rgb(140,165,241)'],
  'rgb(61, 94, 203)': ['rgb(61,94,203)', 'rgb(118,142,218)'],
  'rgb(30, 62, 172)': ['rgb(30,62,172)', 'rgb(97,119,196)'],
  'rgb(17, 45, 141)': ['rgb(17,45,141)', 'rgb(87,107,175)'],
  'rgb(226, 154, 43)': ['rgb(226,154,43)', 'rgb(254,183,74)'],
  '#613EA6': ['#613EA6', '#9B72D2'],
  '#1A6EFE': ['#1A6EFE', '#38A7FF'],
  '#FF2182': ['#FF2182', '#FF44B8'],
  '#6D99E2': ['#6D99E2', '#A6C9F3'],
  '#20BBBF': ['#20BBBF', '#63D9DC'],
  '#AF489B': ['#AF489B', '#DF60FA'],
  '#BCCAFC': ['#BCCAFC', '#D0DAFD'],
  '#93ABFE': ['#93ABFE', '#B3C4FE'],
  '#7391F3': ['#7391F3', '#9CB1F6'],
  '#5C7FEC': ['#5C7FEC', '#8CA5F1'],
  '#3D5ECB': ['#3D5ECB', '#768EDA'],
  '#1E3EAC': ['#1E3EAC', '#6177C4'],
  '#112D8D': ['#112D8D', '#576BAF'],
  '#E29A2B': ['#E29A2B', '#FEB74A'],
};

export function getColorGradiant(color) {
  return color ? gradientobject[color] : color;
}

export function cleanColorInput(value) {
  // for superset series that should have the same color
  return String(value)
    .trim()
    .replace(' (right axis)', '')
    .split(', ')
    .filter(k => !TIME_SHIFT_PATTERN.test(k))
    .join(', ');
}

/**
 * If format is smart_date, format date
 * Otherwise, format number with the given format name
 * @param {*} format
 */
export function getTimeOrNumberFormatter(format) {
  return format === 'smart_date' ? smartDateFormatter : getNumberFormatter(format);
}

export function drawBarValues(svg, data, stacked, axisFormat) {
  const format = getNumberFormatter(axisFormat);
  const countSeriesDisplayed = data.filter(d => !d.disabled).length;

  const totalStackedValues =
    stacked && data.length !== 0
      ? data[0].values.map((bar, iBar) => {
          const bars = data.filter(series => !series.disabled).map(series => series.values[iBar]);

          return d3.sum(bars, d => d.y);
        })
      : [];

  svg.selectAll('.bar-chart-label-group').remove();
  setTimeout(() => {
    const groupLabels = svg
      .select('g.nv-barsWrap')
      .append('g')
      .attr('class', 'bar-chart-label-group');
    svg
      .selectAll('g.nv-group')
      .filter((d, i) => !stacked || i === countSeriesDisplayed - 1)
      .selectAll('rect')
      .each(function each(d, index) {
        const rectObj = d3.select(this);
        const transformAttr = rectObj.attr('transform');
        const xPos = parseFloat(rectObj.attr('x'));
        const yPos = parseFloat(rectObj.attr('y'));
        const rectWidth = parseFloat(rectObj.attr('width'));
        const rectHeight = parseFloat(rectObj.attr('height'));
        const textEls = groupLabels
          .append('text')
          .text(format(stacked ? totalStackedValues[index] : d.y))
          .attr('transform', transformAttr)
          .attr('class', 'bar-chart-label');

        // fine tune text position
        const bbox = textEls.node().getBBox();
        const labelWidth = bbox.width;
        const labelHeight = bbox.height;
        textEls.attr('x', xPos + rectWidth / 2 - labelWidth / 2);
        if (rectObj.attr('class').includes('positive')) {
          textEls.attr('y', yPos - 5);
        } else {
          textEls.attr('y', yPos + rectHeight + labelHeight);
        }
      });
  }, ANIMATION_TIME);
}

// Formats the series key to account for a possible NULL value
function getFormattedKey(seriesKey, shouldDompurify) {
  if (seriesKey === '<NULL>') {
    return `&lt;${seriesKey.slice(1, -1)}&gt;`;
  }

  return shouldDompurify ? dompurify.sanitize(seriesKey) : seriesKey;
}

// Custom sorted tooltip
// use a verbose formatter for times
export function generateRichLineTooltipContent(d, timeFormatter, valueFormatter) {
  let tooltip = '';
  tooltip +=
    "<table><thead><tr><td colspan='3'>" +
    `<strong class='x-value'>${timeFormatter(d.value)}</strong>` +
    '</td></tr></thead><tbody>';
  d.series.sort((a, b) => (a.value >= b.value ? -1 : 1));
  d.series.forEach(series => {
    const key = getFormattedKey(series.key, true);
    const colorGradiantArray = getColorGradiant(series.color);
    tooltip +=
      `<tr class="${series.highlight ? 'emph' : ''}">` +
      `<td class='legend-color-guide' style="opacity: ${series.highlight ? '1' : '0.75'};"">` +
      '<div ' +
      `style="border: 2px solid ${series.highlight ? 'black' : 'transparent'};
      width: ${colorGradiantArray && colorGradiantArray.length ? '16px' : '14px'};
      height: ${colorGradiantArray && colorGradiantArray.length ? '16px' : '14px'};
      border-radius: ${colorGradiantArray && colorGradiantArray.length ? '8px' : '7px'};
      background: ${
        colorGradiantArray && colorGradiantArray.length
          ? `linear-gradient(${colorGradiantArray[1]} 0%, ${colorGradiantArray[0]} 100%) 0% 0% no-repeat padding-box padding-box transparent`
          : series.color
      };"` +
      '></div>' +
      '</td>' +
      `<td>${key}</td>` +
      `<td>${valueFormatter(series.value === 'null' || !series.value ? 0 : series.value)}</td>` +
      '</tr>';
  });
  tooltip += '</tbody></table>';

  return dompurify.sanitize(tooltip);
}

export function generateAreaChartTooltipContent(d, timeFormatter, valueFormatter) {
  const total = d.series[d.series.length - 1].value;
  let tooltip = '';
  tooltip +=
    "<table><thead><tr><td colspan='4'>" +
    `<strong class='x-value'>${timeFormatter(d.value)}</strong>` +
    '</td></tr></thead><tbody>' +
    '<tr class="tooltip-header"><td></td><td>Category</td><td>Value</td><td>% to total</td></tr>';
  d.series.forEach(series => {
    const key = getFormattedKey(series.key, true);
    let trClass = '';
    if (series.highlight) {
      trClass = 'superset-legacy-chart-nvd3-tr-highlight';
    } else if (series.key === 'TOTAL') {
      trClass = 'superset-legacy-chart-nvd3-tr-total';
    }
    tooltip +=
      `<tr class="${trClass}" style="border-color: ${series.color}">` +
      `<td style="color: ${series.color}">${series.key === 'TOTAL' ? '' : '&#9724;'}</td>` +
      `<td>${key}</td>` +
      `<td>${valueFormatter(series.value === 'null' || !series.value ? 0 : series.value)}</td>` +
      `<td>${(
        (100 * (series.value === 'null' || !series.value ? 0 : series.value)) /
        total
      ).toFixed(2)}%</td>` +
      '</tr>';
  });
  tooltip += '</tbody></table>';

  return dompurify.sanitize(tooltip);
}

export function generateMultiLineTooltipContent(d, xFormatter, yFormatters) {
  const tooltipTitle = xFormatter(d.value);
  let tooltip = '';

  tooltip +=
    "<table><thead><tr><td colspan='3'>" +
    `<strong class='x-value'>${tooltipTitle}</strong>` +
    '</td></tr></thead><tbody>';

  d.series.forEach((series, i) => {
    const yFormatter = yFormatters[i];
    const key = getFormattedKey(series.key, false);
    tooltip +=
      "<tr><td class='legend-color-guide'>" +
      `<div style="background-color: ${series.color};"></div></td>` +
      `<td class='key'>${key}</td>` +
      `<td class='value'>${yFormatter(
        series.value === 'null' || !series.value ? 0 : series.value,
      )}</td></tr>`;
  });

  tooltip += '</tbody></table>';

  return tooltip;
}

export function generateTimePivotTooltip(d, xFormatter, yFormatter) {
  const tooltipTitle = xFormatter(d.value);
  let tooltip = '';

  tooltip +=
    "<table><thead><tr><td colspan='3'>" +
    `<strong class='x-value'>${tooltipTitle}</strong>` +
    '</td></tr></thead><tbody>';

  d.series.forEach(series => {
    if (series.highlight) {
      let label = '';
      if (series.key === 'current') {
        label = series.key;
      } else {
        label = `${series.key} of the selected frequency:`;
      }
      tooltip +=
        "<tr><td class='legend-color-guide'>" +
        `<div style="background-color: ${series.color};"></div></td>` +
        `<td class='key'>${label}</td>` +
        `<td class='value'>${yFormatter(
          series.value === 'null' || !series.value ? 0 : series.value,
        )}</td></tr>`;
    }
  });

  tooltip += '</tbody></table>';

  return dompurify.sanitize(tooltip);
}

function getLabel(stringOrObjectWithLabel) {
  return stringOrObjectWithLabel.label || stringOrObjectWithLabel;
}

function createHTMLRow(col1, col2) {
  return `<tr><td>${col1}</td><td>${col2}</td></tr>`;
}

export function generateBubbleTooltipContent({
  point,
  entity,
  xField,
  yField,
  sizeField,
  xFormatter,
  yFormatter,
  sizeFormatter,
}) {
  let s = '<table>';
  s +=
    `<tr><td style="color: ${point.color};">` +
    `<strong>${point[entity]}</strong> (${point.group})` +
    '</td></tr>';
  s += createHTMLRow(getLabel(xField), xFormatter(point.x));
  s += createHTMLRow(getLabel(yField), yFormatter(point.y));
  s += createHTMLRow(getLabel(sizeField), sizeFormatter(point.size));
  s += '</table>';

  return s;
}

// shouldRemove indicates whether the nvtooltips should be removed from the DOM
export function hideTooltips(shouldRemove) {
  const targets = document.querySelectorAll('.nvtooltip');
  if (targets.length > 0) {
    // Only set opacity to 0 when hiding tooltips so they would reappear
    // on hover, which sets the opacity to 1
    targets.forEach(t => {
      if (shouldRemove) {
        t.remove();
      } else {
        // eslint-disable-next-line no-param-reassign
        t.style.opacity = 0;
      }
    });
  }
}

export function generateTooltipClassName(uuid) {
  return `tooltip-${uuid}`;
}

export function removeTooltip(uuid) {
  const classSelector = `.${generateTooltipClassName(uuid)}`;
  const target = document.querySelector(classSelector);
  if (target) {
    target.remove();
  }
}

export function wrapTooltip(chart, maxWidth) {
  const tooltipLayer =
    chart.useInteractiveGuideline && chart.useInteractiveGuideline()
      ? chart.interactiveLayer
      : chart;
  const tooltipGeneratorFunc = tooltipLayer.tooltip.contentGenerator();
  tooltipLayer.tooltip.contentGenerator(d => {
    let tooltip = `<div style="max-width: ${maxWidth * 0.8}px">`;
    // let tooltip = `<div style="max-width: ${maxWidth * 0.5}px">`;
    tooltip += tooltipGeneratorFunc(d);
    tooltip += '</div>';

    return tooltip;
  });
}

export function tipFactory(layer) {
  return d3tip()
    .attr('class', `d3-tip ${layer.annotationTipClass || ''}`)
    .direction('n')
    .offset([-5, 0])
    .html(d => {
      if (!d) {
        return '';
      }
      const title =
        d[layer.titleColumn] && d[layer.titleColumn].length > 0
          ? `${d[layer.titleColumn]} - ${layer.name}`
          : layer.name;
      const body = Array.isArray(layer.descriptionColumns)
        ? layer.descriptionColumns.map(c => d[c])
        : Object.values(d);

      return `<div><strong>${title}</strong></div><br/><div>${body.join(', ')}</div>`;
    });
}

export function getMaxLabelSize(svg, axisClass) {
  // axis class = .nv-y2  // second y axis on dual line chart
  // axis class = .nv-x  // x axis on time series line chart
  const tickTexts = svg.selectAll(`.${axisClass} g.tick text`);
  if (tickTexts.length > 0) {
    const lengths = tickTexts[0].map(text => text.getComputedTextLength());

    return Math.ceil(Math.max(0, ...lengths));
  }

  return 0;
}

export function formatLabel(input, verboseMap = {}) {
  // The input for label may be a string or an array of string
  // When using the time shift feature, the label contains a '---' in the array
  const verboseLookup = s => verboseMap[s] || s;

  return Array.isArray(input) && input.length > 0
    ? input.map(l => (TIME_SHIFT_PATTERN.test(l) ? l : verboseLookup(l))).join(', ')
    : verboseLookup(input);
}

const MIN_BAR_WIDTH = 18;

export function computeBarChartWidth(data, stacked, maxWidth) {
  const barCount = stacked
    ? d3.max(data, d => d.values.length)
    : d3.sum(data, d => d.values.length);

  const barWidth = barCount * MIN_BAR_WIDTH;

  return Math.max(barWidth, maxWidth);
}

export function tryNumify(s) {
  // Attempts casting to Number, returns string when failing
  const n = Number(s);

  return Number.isNaN(n) ? s : n;
}

export function stringifyTimeRange(extent) {
  if (extent.some(d => d.toISOString === undefined)) {
    return null;
  }

  return extent.map(d => d.toISOString().slice(0, -1)).join(' : ');
}

export function setAxisShowMaxMin(axis, showminmax) {
  if (axis && axis.showMaxMin && showminmax !== undefined) {
    axis.showMaxMin(showminmax);
  }
}

export function computeYDomain(data) {
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].values)) {
    const extents = data.filter(d => !d.disabled).map(row => d3.extent(row.values, v => v.y));
    const minOfMin = d3.min(extents, ([min]) => min);
    const maxOfMax = d3.max(extents, ([, max]) => max);

    return [minOfMin, maxOfMax];
  }

  return [0, 1];
}

export function computeStackedYDomain(data) {
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].values)) {
    const series = data.filter(d => !d.disabled).map(d => d.values.map(v => v.y));
    const stackedValues = series[0].map((_, i) => series.reduce((acc, cur) => acc + cur[i], 0));

    return [Math.min(0, ...stackedValues), Math.max(0, ...stackedValues)];
  }

  return [0, 1];
}
