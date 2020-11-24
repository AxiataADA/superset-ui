import React, { useState, useEffect } from 'react';
import Datetime from 'react-datetime';
import moment from 'moment';
import { Button, InputGroup, FormControl, FormGroup } from 'react-bootstrap';

// This is a custom filter UI for selecting
// multiple option from a list
const SelectControl = ({
  column: { options, id, name },
  globalSelectControl: GlobalSelectControl,
  appliedFilersObject,
  updatePopupFilterArray,
  columnLabel,
}) => {
  return (
    <GlobalSelectControl
      className="tableFilterModalSelector"
      options={[...options].map((option, i) => ({ value: i, label: option }))}
      onChange={e => {
        updatePopupFilterArray(id, e && e.length ? e.map(i => i.label) : undefined, name);
      }}
      autoSize={false}
      value={
        appliedFilersObject && appliedFilersObject.value
          ? appliedFilersObject.value.map(i => ({
              value: options && [...options].length ? [...options].indexOf(i) : null,
              label: i,
            }))
          : null
      }
      isMulti
      placeholder={`Select ${columnLabel}`}
      maxMenuHeight={140}
    />
  );
};

// This is a custom date filter UI for selecting since and untill date
const BetweenDateControl = ({
  column: { id, name },
  appliedFilersObject,
  updatePopupFilterArray,
}) => {
  const MOMENT_FORMAT = 'MM/DD/YYYY';
  const [state, setState] = useState({
    since: new Date(
      appliedFilersObject && appliedFilersObject.value && appliedFilersObject.value.length
        ? appliedFilersObject.value[0]
        : Date.now(),
    ),
    until: new Date(
      appliedFilersObject && appliedFilersObject.value && appliedFilersObject.value.length
        ? appliedFilersObject.value[1]
        : Date.now(),
    ),
    showSinceCalendar: false,
    showUntilCalendar: false,
    sinceViewMode: 'days',
    untilViewMode: 'days',
  });

  const setCustomStartEnd = (key, value) => {
    const closeCalendar =
      (key === 'since' && state.sinceViewMode === 'days') ||
      (key === 'until' && state.untilViewMode === 'days');

    setState({
      ...state,
      [key]: typeof value === 'string' ? value : value.format(MOMENT_FORMAT),
      showSinceCalendar: state.showSinceCalendar && !closeCalendar,
      showUntilCalendar: state.showUntilCalendar && !closeCalendar,
      sinceViewMode: closeCalendar ? 'days' : state.sinceViewMode,
      untilViewMode: closeCalendar ? 'days' : state.untilViewMode,
    });
    if (key === 'since') updatePopupFilterArray(id, [new Date(value), new Date(state.until)], name);
    else if (key === 'until')
      updatePopupFilterArray(id, [new Date(state.since), new Date(value)], name);
  };

  const isValidMoment = s => {
    return s === moment(s, MOMENT_FORMAT).format(MOMENT_FORMAT);
  };

  const isValidSince = date => {
    return !isValidMoment(state.until) || date <= moment(state.until, MOMENT_FORMAT);
  };

  const isValidUntil = date => {
    return !isValidMoment(state.since) || date >= moment(state.since, MOMENT_FORMAT);
  };

  const toggleCalendar = key => {
    const nextState = {};
    if (key === 'showSinceCalendar') {
      nextState.showSinceCalendar = !state.showSinceCalendar;
      if (!state.showSinceCalendar) {
        nextState.showUntilCalendar = false;
      }
    } else if (key === 'showUntilCalendar') {
      nextState.showUntilCalendar = !state.showUntilCalendar;
      if (!state.showUntilCalendar) {
        nextState.showSinceCalendar = false;
      }
    }
    setState({
      ...state,
      ...nextState,
    });
  };

  const renderInput = (props, key) => {
    return (
      <FormGroup>
        <InputGroup bsSize="small">
          <FormControl {...props} type="text" onClick={() => {}} />
          <InputGroup.Button onClick={() => toggleCalendar(key)}>
            <Button>
              <i className="fa fa-calendar" />
            </Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    );
  };

  return (
    <InputGroup
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'start',
      }}
    >
      <span
        style={{
          color: '#202C56',
          fontFamily: "'Roboto', sans-serif",
          fontWeight: '700',
          fontSize: '13px',
        }}
      >
        From
      </span>
      <div style={{ margin: '0px 20px 0px 20px', height: '30px' }}>
        <Datetime
          timeFormat={false}
          value={state.since}
          defaultValue={state.since}
          viewDate={state.since}
          onChange={value => setCustomStartEnd('since', value)}
          isValidDate={isValidSince}
          renderInput={props => renderInput(props, 'showSinceCalendar')}
          open={state.showSinceCalendar}
          viewMode={state.sinceViewMode}
          onViewModeChange={sinceViewMode => setState({ ...state, sinceViewMode })}
          inputProps={{ placeholder: 'Select From Date', disabled: true }}
        />
      </div>
      <span
        style={{
          color: '#202C56',
          fontFamily: "'Roboto', sans-serif",
          fontWeight: '700',
          fontSize: '13px',
        }}
      >
        To
      </span>
      <div style={{ marginLeft: '20px', height: '30px' }}>
        <Datetime
          timeFormat={false}
          value={state.until}
          defaultValue={state.until}
          viewDate={state.until}
          onChange={value => setCustomStartEnd('until', value)}
          isValidDate={isValidUntil}
          renderInput={props => renderInput(props, 'showUntilCalendar')}
          open={state.showUntilCalendar}
          viewMode={state.untilViewMode}
          onViewModeChange={untilViewMode => setState({ ...state, untilViewMode })}
          inputProps={{ placeholder: 'Select To Date', disabled: true }}
        />
      </div>
    </InputGroup>
  );
};

const RenderFilter = ({
  filterComponentArray,
  getKeyOrLableContent,
  globalSelectControl,
  setPopupFilterArrayForDataTable,
  popupFilterArrayForDataTable,
}) => {
  const [popupFilterArray, setPopupFilterArray] = useState(popupFilterArrayForDataTable);

  useEffect(() => {
    setPopupFilterArray(popupFilterArrayForDataTable);
  }, [popupFilterArrayForDataTable]);

  useEffect(() => {
    setPopupFilterArrayForDataTable(popupFilterArray);
  }, [popupFilterArray]);

  const updatePopupFilterArray = (id, value, name) => {
    let isValueUpdated = false;
    const tempPopupFilterArray = JSON.parse(JSON.stringify(popupFilterArray));
    tempPopupFilterArray.forEach(i => {
      if (i.id === id) {
        i.value = value;
        isValueUpdated = true;
      }
    });
    if (!isValueUpdated) {
      tempPopupFilterArray.push({ id, value, name });
      isValueUpdated = true;
    }
    setPopupFilterArray(tempPopupFilterArray);
  };

  return (
    <div>
      {filterComponentArray &&
        filterComponentArray.map(column => {
          const appliedFilers = popupFilterArray.filter(i => i.id === column.id);
          const columnLabel = getKeyOrLableContent(column.name);

          return (
            <div style={{ marginBottom: '30px', display: 'flex' }} key={column.name}>
              <div
                style={{
                  fontFamily: "'Roboto', sans-serif",
                  textAlign: 'left',
                  letterSpacing: '0px',
                  color: '#202C56',
                  opacity: '1',
                  fontWeight: '700',
                  fontSize: '15px',
                  width: '25%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {columnLabel}
              </div>
              <div style={{ width: '75%' }}>
                {['published_date', 'as_of_date', 'crawled_date'].includes(column.name) ? (
                  <BetweenDateControl
                    column={column}
                    appliedFilersObject={appliedFilers ? appliedFilers[0] || {} : {}}
                    updatePopupFilterArray={updatePopupFilterArray}
                  />
                ) : (
                  <SelectControl
                    columnLabel={columnLabel}
                    globalSelectControl={globalSelectControl}
                    column={column}
                    appliedFilersObject={appliedFilers ? appliedFilers[0] || {} : {}}
                    updatePopupFilterArray={updatePopupFilterArray}
                  />
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};
export default RenderFilter;
