/**
 * Analytics service
 * TimescaleDB queries for analytics and metrics
 */

import { getDatabase } from '../db';
import {
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsMetadata,
  AnalyticsSummary,
} from '@console-capture/shared';
import { logger } from '@console-capture/shared';

/**
 * Track analytics event
 */
export async function trackEvent(
  recordingId: string,
  eventType: AnalyticsEventType,
  metadata: AnalyticsMetadata,
  userId?: string
): Promise<void> {
  const db = getDatabase();

  try {
    await db('analytics_events').insert({
      recording_id: recordingId,
      user_id: userId,
      timestamp: db.fn.now(),
      event_type: eventType,
      duration: metadata.duration,
      position: metadata.position,
      referrer: metadata.referrer,
      user_agent: metadata.userAgent,
      ip_address: metadata.ipAddress,
      country: metadata.country,
      city: metadata.city,
      device_type: metadata.deviceType,
      metadata: JSON.stringify(metadata),
    });

    logger.info('Analytics event tracked', { recordingId, eventType });
  } catch (error) {
    logger.error('Failed to track analytics event', error as Error, {
      recordingId,
      eventType,
    });
  }
}

/**
 * Get analytics summary for a recording
 */
export async function getRecordingAnalytics(
  recordingId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsSummary> {
  const db = getDatabase();

  const query = db('analytics_events').where({ recording_id: recordingId });

  if (startDate) {
    query.where('timestamp', '>=', startDate);
  }

  if (endDate) {
    query.where('timestamp', '<=', endDate);
  }

  // Total views
  const [{ totalViews }] = await query
    .clone()
    .where({ event_type: AnalyticsEventType.VIEW })
    .count('* as totalViews');

  // Unique views
  const [{ uniqueViews }] = await query
    .clone()
    .where({ event_type: AnalyticsEventType.VIEW })
    .countDistinct('ip_address as uniqueViews');

  // Completion rate
  const [{ completeCount }] = await query
    .clone()
    .where({ event_type: AnalyticsEventType.COMPLETE })
    .count('* as completeCount');

  const avgCompletionRate = parseInt(totalViews as string) > 0
    ? (parseInt(completeCount as string) / parseInt(totalViews as string)) * 100
    : 0;

  // Average watch time
  const [{ avgWatchTime }] = await query
    .clone()
    .where({ event_type: AnalyticsEventType.COMPLETE })
    .avg('duration as avgWatchTime');

  // Top referrers
  const topReferrers = await query
    .clone()
    .where({ event_type: AnalyticsEventType.VIEW })
    .whereNotNull('referrer')
    .select('referrer')
    .count('* as count')
    .groupBy('referrer')
    .orderBy('count', 'desc')
    .limit(10);

  // Device breakdown
  const deviceBreakdown = await query
    .clone()
    .where({ event_type: AnalyticsEventType.VIEW })
    .whereNotNull('device_type')
    .select('device_type')
    .count('* as count')
    .groupBy('device_type');

  // Geographic breakdown
  const geoBreakdown = await query
    .clone()
    .where({ event_type: AnalyticsEventType.VIEW })
    .whereNotNull('country')
    .select('country')
    .count('* as count')
    .groupBy('country')
    .orderBy('count', 'desc')
    .limit(20);

  return {
    recordingId,
    totalViews: parseInt(totalViews as string),
    uniqueViews: parseInt(uniqueViews as string),
    avgCompletionRate,
    avgWatchTime: parseFloat(avgWatchTime as string) || 0,
    topReferrers: topReferrers.map((r) => ({
      url: r.referrer,
      count: parseInt(r.count as string),
    })),
    deviceBreakdown: deviceBreakdown.reduce(
      (acc, d) => {
        acc[d.device_type] = parseInt(d.count as string);
        return acc;
      },
      {} as Record<string, number>
    ),
    geoBreakdown: geoBreakdown.reduce(
      (acc, g) => {
        acc[g.country] = parseInt(g.count as string);
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

/**
 * Get user analytics
 */
export async function getUserAnalytics(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRecordings: number;
  totalViews: number;
  totalWatchTime: number;
  averageViewsPerRecording: number;
}> {
  const db = getDatabase();

  // Get user's recordings
  const recordingIds = await db('recordings')
    .where({ user_id: userId })
    .whereNull('deleted_at')
    .select('id');

  const ids = recordingIds.map((r) => r.id);

  if (ids.length === 0) {
    return {
      totalRecordings: 0,
      totalViews: 0,
      totalWatchTime: 0,
      averageViewsPerRecording: 0,
    };
  }

  const query = db('analytics_events').whereIn('recording_id', ids);

  if (startDate) {
    query.where('timestamp', '>=', startDate);
  }

  if (endDate) {
    query.where('timestamp', '<=', endDate);
  }

  // Total views
  const [{ totalViews }] = await query
    .clone()
    .where({ event_type: AnalyticsEventType.VIEW })
    .count('* as totalViews');

  // Total watch time
  const [{ totalWatchTime }] = await query
    .clone()
    .where({ event_type: AnalyticsEventType.COMPLETE })
    .sum('duration as totalWatchTime');

  return {
    totalRecordings: ids.length,
    totalViews: parseInt(totalViews as string),
    totalWatchTime: parseInt(totalWatchTime as string) || 0,
    averageViewsPerRecording:
      ids.length > 0 ? parseInt(totalViews as string) / ids.length : 0,
  };
}

/**
 * Get organization analytics
 */
export async function getOrganizationAnalytics(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRecordings: number;
  totalViews: number;
  totalWatchTime: number;
  totalMembers: number;
  averageViewsPerRecording: number;
  averageViewsPerMember: number;
}> {
  const db = getDatabase();

  // Get organization's recordings
  const recordingIds = await db('recordings')
    .where({ organization_id: organizationId })
    .whereNull('deleted_at')
    .select('id');

  const ids = recordingIds.map((r) => r.id);

  // Get organization members count
  const [{ memberCount }] = await db('team_members')
    .where({ organization_id: organizationId })
    .count('* as memberCount');

  if (ids.length === 0) {
    return {
      totalRecordings: 0,
      totalViews: 0,
      totalWatchTime: 0,
      totalMembers: parseInt(memberCount as string),
      averageViewsPerRecording: 0,
      averageViewsPerMember: 0,
    };
  }

  const query = db('analytics_events').whereIn('recording_id', ids);

  if (startDate) {
    query.where('timestamp', '>=', startDate);
  }

  if (endDate) {
    query.where('timestamp', '<=', endDate);
  }

  // Total views
  const [{ totalViews }] = await query
    .clone()
    .where({ event_type: AnalyticsEventType.VIEW })
    .count('* as totalViews');

  // Total watch time
  const [{ totalWatchTime }] = await query
    .clone()
    .where({ event_type: AnalyticsEventType.COMPLETE })
    .sum('duration as totalWatchTime');

  const views = parseInt(totalViews as string);
  const members = parseInt(memberCount as string);

  return {
    totalRecordings: ids.length,
    totalViews: views,
    totalWatchTime: parseInt(totalWatchTime as string) || 0,
    totalMembers: members,
    averageViewsPerRecording: ids.length > 0 ? views / ids.length : 0,
    averageViewsPerMember: members > 0 ? views / members : 0,
  };
}

/**
 * Get time series data for recording views
 */
export async function getViewsTimeSeries(
  recordingId: string,
  startDate: Date,
  endDate: Date,
  interval: '1 hour' | '1 day' | '1 week' = '1 day'
): Promise<Array<{ timestamp: Date; count: number }>> {
  const db = getDatabase();

  const results = await db.raw(
    `
    SELECT
      time_bucket(?, timestamp) AS bucket,
      COUNT(*) as count
    FROM analytics_events
    WHERE recording_id = ?
      AND event_type = ?
      AND timestamp >= ?
      AND timestamp <= ?
    GROUP BY bucket
    ORDER BY bucket ASC
  `,
    [interval, recordingId, AnalyticsEventType.VIEW, startDate, endDate]
  );

  return results.rows.map((row: any) => ({
    timestamp: row.bucket,
    count: parseInt(row.count),
  }));
}

/**
 * Get console events for a recording
 */
export async function getConsoleEvents(
  recordingId: string,
  options?: {
    type?: string[];
    limit?: number;
    offset?: number;
  }
): Promise<{
  events: Array<{
    id: string;
    timestamp: Date;
    type: string;
    message: string;
    args?: any[];
    stackTrace?: string;
    source?: string;
    lineNumber?: number;
  }>;
  total: number;
}> {
  const db = getDatabase();

  const query = db('console_events').where({ recording_id: recordingId });

  if (options?.type && options.type.length > 0) {
    query.whereIn('type', options.type);
  }

  // Get total count
  const [{ count }] = await query.clone().count('* as count');
  const total = parseInt(count as string);

  // Pagination
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  query.orderBy('timestamp', 'asc').limit(limit).offset(offset);

  const events = await query;

  return {
    events: events.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      type: e.type,
      message: e.message,
      args: typeof e.args === 'string' ? JSON.parse(e.args) : e.args,
      stackTrace: e.stack_trace,
      source: e.source,
      lineNumber: e.line_number,
    })),
    total,
  };
}
