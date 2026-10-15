const { v4: uuidv4 } = require('uuid');

/**
 * Generates a placeholder meeting link for local development.
 *
 * IMPORTANT: This is NOT a real Google Meet or Zoom link.
 * In production, integrate via:
 *   - Google Meet: Google Calendar API with conferencing data (requires OAuth2 service account)
 *   - Zoom: Zoom API v2 with JWT/Server-to-Server OAuth (requires ZOOM_API_KEY + ZOOM_API_SECRET)
 *
 * Set MEETING_PROVIDER=google_meet or MEETING_PROVIDER=zoom in .env
 * and add the relevant credentials to enable real integration.
 */
const generateMeetingLink = (sessionId) => {
  const provider = process.env.MEETING_PROVIDER || 'placeholder';

  if (provider === 'google_meet') {
    // TODO: implement Google Calendar API call
    // Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
    // See: https://developers.google.com/calendar/api/v3/reference/events/insert#conferenceData
    console.warn('[MeetingLink] google_meet provider not yet configured; falling back to placeholder');
  }

  if (provider === 'zoom') {
    // TODO: implement Zoom Create Meeting API call
    // Requires: ZOOM_API_KEY, ZOOM_API_SECRET
    // See: https://developers.zoom.us/docs/api/meetings/#tag/meetings/POST/users/{userId}/meetings
    console.warn('[MeetingLink] zoom provider not yet configured; falling back to placeholder');
  }

  // Placeholder — clearly identified as a demo link
  const token = uuidv4().replace(/-/g, '').substring(0, 10);
  return {
    url:  `https://meet.skillsync.demo/${token}`,
    type: 'placeholder',
  };
};

module.exports = { generateMeetingLink };
