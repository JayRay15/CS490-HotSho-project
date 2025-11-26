import ical from 'ical-generator';

/**
 * Generate an iCalendar (.ics) file for an interview
 * @param {Object} interview - Interview document
 * @param {Object} user - User document (for organizer info)
 * @returns {string} - iCalendar file content
 */
export const generateICSFile = (interview, user) => {
  try {
    const calendar = ical({
      name: 'HotSho Interview',
      prodId: {
        company: 'HotSho',
        product: 'Interview Scheduler',
      },
      timezone: 'America/New_York' // TODO: Use user's timezone preference
    });

    // Calculate end time
    const startDate = new Date(interview.scheduledDate);
    const endDate = new Date(startDate.getTime() + interview.duration * 60000);

    // Build description
    let description = `Interview for ${interview.title} position at ${interview.company}\n\n`;
    
    if (interview.interviewer?.name) {
      description += `Interviewer: ${interview.interviewer.name}\n`;
      if (interview.interviewer.email) description += `Email: ${interview.interviewer.email}\n`;
      if (interview.interviewer.phone) description += `Phone: ${interview.interviewer.phone}\n`;
    }
    
    if (interview.meetingLink) {
      description += `\nMeeting Link: ${interview.meetingLink}\n`;
    }
    
    if (interview.notes) {
      description += `\nNotes:\n${interview.notes}`;
    }

    // Create event
    const event = calendar.createEvent({
      start: startDate,
      end: endDate,
      summary: `${interview.interviewType} Interview - ${interview.company}`,
      description: description.trim(),
      location: interview.location || interview.meetingLink || 'Virtual',
      url: interview.meetingLink || undefined,
      organizer: {
        name: user.name || 'HotSho User',
        email: user.email
      },
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      categories: [{ name: 'Interview' }, { name: interview.interviewType }]
    });

    // Add alarms/reminders
    event.createAlarm({
      type: 'display',
      trigger: 60 * 60 * 24, // 24 hours before
      description: `Interview reminder: ${interview.company}`
    });

    event.createAlarm({
      type: 'display',
      trigger: 60 * 2, // 2 hours before
      description: `Interview starting in 2 hours: ${interview.company}`
    });

    event.createAlarm({
      type: 'display',
      trigger: 60, // 1 hour before
      description: `Interview starting in 1 hour: ${interview.company}`
    });

    // Add interviewer as attendee if email is provided
    if (interview.interviewer?.email) {
      event.createAttendee({
        email: interview.interviewer.email,
        name: interview.interviewer.name || undefined,
        role: 'REQ-PARTICIPANT',
        status: 'NEEDS-ACTION'
      });
    }

    return calendar.toString();
  } catch (error) {
    console.error('Error generating ICS file:', error);
    throw new Error('Failed to generate ICS file');
  }
};

/**
 * Generate filename for ICS download
 * @param {Object} interview - Interview document
 * @returns {string} - Filename
 */
export const getICSFilename = (interview) => {
  const company = interview.company.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const type = interview.interviewType.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const date = new Date(interview.scheduledDate).toISOString().split('T')[0];
  
  return `interview_${company}_${type}_${date}.ics`;
};
