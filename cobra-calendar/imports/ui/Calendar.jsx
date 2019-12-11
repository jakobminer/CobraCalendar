import React from 'react'
import { Container, Grid, Button, Popup } from 'semantic-ui-react'
import * as _ from 'underscore';

const Calendar = (props) => {
  const days = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
  const events = props.events;
  return (
      <Container>
        <h1>
          <Button icon="angle left" onClick={props.prev}/>
          <Button icon="angle right" onClick={props.next}/>
          { titleForWeekStart(props.weekStart) }
          <Button onClick={props.goToToday}>Today</Button>
        </h1>
        <Grid celled columns={days.length}>
          {days.map( (day, index) => {
              const date = dateAddingDays(props.weekStart, index);
              return <Grid.Column key={index}>
                <Day name={day} date={date} events={ _.filter(events, startDateMatches(date)) } slotsPerHour={4} />
              </Grid.Column>;
          })}
        </Grid>
      </Container>
  );
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const startDateMatches = (referenceDate) => {
  return (candidateEvent) => matchingDate(referenceDate)(candidateEvent.start);
};

const matchingDate = (referenceDate) => {
  return (candidateDate) => {
    return candidateDate.getDate() === referenceDate.getDate()
        && candidateDate.getFullYear() === referenceDate.getFullYear()
        && candidateDate.getMonth() === referenceDate.getMonth();
  };
};

export const dateAddingDays = (date, daysOffset) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()+daysOffset)
};

const titleForWeekStart = (weekStart) => {
  const weekEndDate = dateAddingDays(weekStart, 6);
  return weekStart.getDate() + '-' + (weekEndDate.getDate()) + ' ' + months[weekStart.getMonth()] + ' ' + weekStart.getFullYear()
};

export const normalizeEvents = (events, slotsPerHour) => {
  return events.map((event)=>{
    const slotLength = 60 / slotsPerHour;
    let start = militaryTimeForDate(event.start);
    const startMin = start % 100;
    if (startMin % slotLength > 0) {
      start = start - startMin % slotLength; // Round down to nearest slot
    }
    let end = militaryTimeForDate(event.end);
    const endMin = end % 100;
    if (endMin % slotLength > 0) {
      end = end + (slotLength - endMin % slotLength); // Round up to nearest slot.
    }
    return { color: event.color, start: start, end: end, description: event.description };
  })
};

const hour = 100;

const slotStartsFor = (start, end, slotLength) => {
  let times = [];
  for (let time = start; time < end;) {
    times.push(time);
    time += slotLength;
    if (time % hour >= 60) { // Check for 61 to 100, should increment the hour.
      console.log('needs to increment hour', time);
      time = (Math.floor(time / hour) + 1) * hour;
      console.log('incremented hour', time);
    }
  }
  return times;
};

const splitEventsToSlots = (normalizedEvents, slotsPerHour) => {
  const eventSlots = _.flatten(_.map(normalizedEvents, (event)=>{
    let slotLength = 60 / slotsPerHour;
    const starts = slotStartsFor(event.start, event.end, slotLength);
    return _.map(starts, (aStart)=>{
      return { color: event.color, start: aStart, description: event.description };
    });
  }));
  return _.indexBy(eventSlots, 'start');
};

export const slotsForRawEvents = (events, slotsPerHour) => {
  return splitEventsToSlots(normalizeEvents(events, slotsPerHour), slotsPerHour);
};

const Day = (props) => {
    const eventSlots = slotsForRawEvents(props.events, props.slotsPerHour);
    const emptySlot =  { color: 'green', description: 'This slot is open' };
    const segments = ["00", "15", "30", "45"];
    const times = ["8", "9", "10", "11", "12", "1", "2", "3", "4", "5", "6", "7", "8"];
    return (
        <Grid columns={1}>
          <h1>{props.name + props.date.getDate()}</h1>
          {times.map( (time, row) => (
              <Grid.Row key={row} className='no-padding'>
                <Grid columns={4}>
                  {segments.map( (label, column) => {
                    const time = militaryTimeForIndex(row*segments.length + column);
                    const event = eventSlots[time] || emptySlot;
                    return <Grid.Column className='no-padding'>
                      <Popup content={event.description} trigger={<Button size='mini' color={event.color}/>} />
                    </Grid.Column>;
                  })}
                </Grid>
              </Grid.Row>
          ))}
        </Grid>
    );
};

export default Calendar;

function militaryTimeForDate(date) {
  return date.getHours() * 100 + date.getMinutes()
}

// Takes an index in the 4/13 array representing 8am to 8pm and returns the integer representing the 24 hour time.
// For example index 0 -> 800, index 51 -> 2045
export function militaryTimeForIndex(index) {
  const minHour = 8;
  const columnCount = 4;
  const segmentLength = 15;//60 / columnCount;
  const row = Math.floor(index / columnCount);
  const col = index % columnCount;
  return col * segmentLength + (100 * (row + minHour));
}

