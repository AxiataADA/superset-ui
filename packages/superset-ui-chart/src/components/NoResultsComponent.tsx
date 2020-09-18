import React, { CSSProperties, useMemo } from 'react';

const MESSAGE_STYLES: CSSProperties = { maxWidth: 800 };
const TITLE_STYLES: CSSProperties = { fontSize: 16, fontWeight: 'bold', paddingBottom: 8 };
const BODY_STYLES: CSSProperties = { fontSize: 14 };
const MIN_WIDTH_FOR_BODY = 250;
const BODY_STRING =
  'No results were returned for this query. If you expected results to be returned, ensure any filters are configured properly and the datasource contains data for the selected time range.';

const generateContainerStyles: (
  height: number | string,
  width: number | string,
) => CSSProperties = (height: number | string, width: number | string) => ({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  height,
  justifyContent: 'center',
  padding: 16,
  textAlign: 'center',
  width,
});

type Props = {
  className?: string;
  height: number | string;
  id?: string;
  width: number | string;
};

const NoResultsComponent = ({ className, height, id, width }: Props) => {
  const containerStyles = useMemo(() => generateContainerStyles(height, width), [height, width]);

  // render the body if the width is auto/100% or greater than 250 pixels
  const shouldRenderBody = typeof width === 'string' || width > MIN_WIDTH_FOR_BODY;

  return (
    <div style={{ height, textAlign: 'center' }}>
      <div>
        <img
          alt="Icon"
          src={`/static/assets/images/icons/No Data.png`}
          style={{
            height: 0.55 * height,
            marginBottom: 0.075 * height + 'px',
            marginTop: 0.075 * height + 'px',
          }}
        />
      </div>
      <div
        style={{
          color: '#11172e',
          fontFamily: "'Roboto', sans-serif",
          fontSize: 0.15 * height + 'px',
          fontWeight: 700,
          height: 0.15 * height,
          fontWeight: 600,
        }}
      >
        No Data
      </div>
    </div>
  );
};

export default NoResultsComponent;
