import { google } from 'googleapis'

export function getCalendarClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/auth/callback/google'
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function createFastingEvent(
  accessToken: string,
  protocol: string,
  startTime: Date,
  endTime: Date,
  refreshToken?: string
): Promise<string> {
  const calendar = getCalendarClient(accessToken, refreshToken)

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `🔒 Jejum ${protocol}`,
      description: `Sessão de jejum intermitente — protocolo ${protocol}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      colorId: '11',
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 0 }],
      },
    },
  })

  return event.data.id ?? ''
}

export async function createTrainingEvent(
  accessToken: string,
  type: string,
  scheduledAt: Date,
  refreshToken?: string
): Promise<string> {
  const calendar = getCalendarClient(accessToken, refreshToken)

  const endTime = new Date(scheduledAt.getTime() + 60 * 60 * 1000) // +1 hour

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `🏋️ Treino — ${type}`,
      description: `Sessão de treino: ${type}`,
      start: {
        dateTime: scheduledAt.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      colorId: '2',
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 30 }],
      },
    },
  })

  return event.data.id ?? ''
}

export async function createWeeklyReview(
  accessToken: string,
  date: Date,
  refreshToken?: string
): Promise<string> {
  const calendar = getCalendarClient(accessToken, refreshToken)

  const endTime = new Date(date.getTime() + 30 * 60 * 1000) // +30 minutes

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: '📊 Revisão Semanal',
      description: 'Revisão semanal de hábitos, progresso e planeamento da próxima semana.',
      start: {
        dateTime: date.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      colorId: '3',
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 10 }],
      },
    },
  })

  return event.data.id ?? ''
}
