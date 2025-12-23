// Simple test to verify 24-hour repeat logic
// This can be run in the browser console or as a Node script

// Mock data for testing
const mockShows = [
  {
    id: '1',
    title: 'Morning Show',
    hostName: 'DJ Morning',
    dayOfWeek: 1, // Monday
    startTime: '08:00',
    endTime: '10:00',
    published: true,
    repeat24h: true
  },
  {
    id: '2', 
    title: 'Afternoon Show',
    hostName: 'DJ Afternoon',
    dayOfWeek: 1, // Monday
    startTime: '14:00',
    endTime: '16:00',
    published: true,
    repeat24h: true
  },
  {
    id: '3',
    title: 'Evening Show', 
    hostName: 'DJ Evening',
    dayOfWeek: 1, // Monday
    startTime: '20:00',
    endTime: '22:00',
    published: true,
    repeat24h: true
  }
];

// Simulate the getShowStatus function logic
function parseTimeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function getShowStatus(show, allShows = []) {
  const now = new Date();
  const currentDay = now.getDay();

  // Check if this show is part of a 24-hour repeat day
  const dayShows = allShows.filter((s) => s.dayOfWeek === show.dayOfWeek && s.published);
  const is24hRepeatDay = dayShows.length > 0 && dayShows.every((s) => s.repeat24h);

  // For 24-hour repeat days, all shows are considered "live" throughout the day
  if (is24hRepeatDay && currentDay === show.dayOfWeek && show.published) {
    return { status: 'live', label: 'Live (24h Repeat)' };
  }

  if (show.dayOfWeek !== undefined && show.startTime && show.endTime && !is24hRepeatDay) {
    const startMins = parseTimeToMinutes(show.startTime);
    const endMins = parseTimeToMinutes(show.endTime);
    const nowMins = now.getHours() * 60 + now.getMinutes();

    let isCurrentlyLive = false;
    if (endMins > startMins) {
      isCurrentlyLive = currentDay === show.dayOfWeek && nowMins >= startMins && nowMins < endMins;
    } else {
      const isShowDay = currentDay === show.dayOfWeek && nowMins >= startMins;
      const isNextDay = currentDay === ((show.dayOfWeek + 1) % 7) && nowMins < endMins;
      isCurrentlyLive = isShowDay || isNextDay;
    }

    if (isCurrentlyLive) {
      return { status: 'live', label: 'Live' };
    }

    const daysUntilShow = (show.dayOfWeek - currentDay + 7) % 7;
    if (daysUntilShow > 0 || (daysUntilShow === 0 && nowMins < startMins)) {
      return { status: 'scheduled', label: 'Scheduled' };
    }
  }

  return { status: 'scheduled', label: 'Scheduled' };
}

// Test the functionality
console.log('Testing 24-hour repeat functionality...');
console.log('Current day:', new Date().getDay()); // 0 = Sunday, 1 = Monday, etc.

mockShows.forEach(show => {
  const status = getShowStatus(show, mockShows);
  console.log(`Show: ${show.title} - Status: ${status.label}`);
});

// Test with different day (non-Monday)
const tuesdayShow = {
  id: '4',
  title: 'Tuesday Show',
  hostName: 'DJ Tuesday',
  dayOfWeek: 2, // Tuesday
  startTime: '10:00',
  endTime: '12:00',
  published: true,
  repeat24h: false
};

console.log('\nTesting non-24h repeat show:');
const tuesdayStatus = getShowStatus(tuesdayShow, mockShows);
console.log(`Show: ${tuesdayShow.title} - Status: ${tuesdayStatus.label}`);

console.log('\nTest completed!');
