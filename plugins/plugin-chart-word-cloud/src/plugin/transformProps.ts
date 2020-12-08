import { ChartProps } from '@superset-ui/chart';
import { WordCloudProps } from '../chart/WordCloud';
import { WordCloudFormData } from '../types';

export default function transformProps(chartProps: ChartProps): WordCloudProps {
  const { width, height, formData, queryData } = chartProps;
  const { encoding, rotation, title } = formData as WordCloudFormData;

  return {
    data: queryData.data,
    encoding,
    height,
    rotation,
    width,
    title,
  };
}
