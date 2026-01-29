import * as Notifications from 'expo-notifications';

export async function requestNotificationPermissions() {
    const { status } = await Notifications.requestPermissionsAsync({
        ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
        },
    });
    return status === 'granted';
}

export async function cancelEventNotifications(eventId: string) {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const eventNotifications = scheduled.filter(n => n.content.data?.eventId === eventId);
        
        if (eventNotifications.length > 0) {
            await Promise.all(eventNotifications.map(n => 
                Notifications.cancelScheduledNotificationAsync(n.identifier)
            ));
            console.log(`[Notifications] Cancelled ${eventNotifications.length} notifications for event ${eventId}`);
        }
    } catch (error) {
        console.warn("[Notifications] Failed to cancel notifications:", error);
        // Don't throw, so we don't block the delete/update process
    }
}

export async function scheduleEventNotifications(eventId: string, title: string, dateStr: string, isTimeCapsule: boolean = false) {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Check notification permissions again just to be safe
    // Cancel any existing notifications for this event first to avoid duplicates
    await cancelEventNotifications(eventId);

    const eventDate = new Date(dateStr);
    const now = new Date();

    // Helper to format numbers (1000 -> 1k, 1500 -> 1.5k, 1000000 -> 1M)
    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            const m = num / 1000000;
            return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
        }
        if (num >= 1000) {
            const k = num / 1000;
            return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
        }
        return num.toString();
    };

    // Store all potential notifications in memory first
    // This allows us to calculate "Lifetime" coverage but only schedule what the OS allows (next ~60)
    interface NotificationCandidate {
        triggerDate: Date;
        title: string;
        body: string;
        idSuffix: string;
    }
    const candidates: NotificationCandidate[] = [];

    const addCandidate = (triggerDate: Date, notifTitle: string, body: string, idSuffix: string, prioritizeMorning: boolean = false) => {
        const d = new Date(triggerDate);
        if (prioritizeMorning) {
            d.setHours(9, 0, 0, 0);
        }
        // Only add if it's in the future
        if (d > now) {
            candidates.push({
               triggerDate: d,
               title: notifTitle,
               body,
               idSuffix
            });
        }
    };

    // 0. Time Capsule Unlocking (Specific Event)
    if (isTimeCapsule) {
        addCandidate(
            eventDate,
            "🔐 Time Capsule Unlocked!",
            `✨ The time has come! Your time capsule "${title}" is now open. Tap to view! 🔓`,
            "capsule-open",
            false // Exact time
        );
    }

    // 1. Minutes
    // Pattern: 100, then 1k, 2k, 3k... (Every 1000)
    const minuteMilestones = [100];
    const MINUTE_LIMIT = 52560000; // ~100 years
    for (let m = 1000; m <= MINUTE_LIMIT; m += 1000) {
        minuteMilestones.push(m);
    }

    for (const mins of minuteMilestones) {
        const trigger = new Date(eventDate.getTime() + mins * 60000);
        const label = formatNumber(mins);
        addCandidate(
            trigger, 
            `✨ ${title}`,
            `⏳ ${label} Minutes passed! Time to celebrate! 🎉`, 
            `mins-${mins}`, 
            false
        );
    }

    // 2. Hours
    // Pattern: 10, 50, 100, 500, then 1k, 2k, 3k... (Every 1000)
    const hourMilestones = [10, 50, 100, 500];
    const HOUR_LIMIT = 876000; // ~100 years
    for (let h = 1000; h <= HOUR_LIMIT; h += 1000) {
        hourMilestones.push(h);
    }
    
    for (const hours of hourMilestones) {
        const trigger = new Date(eventDate.getTime() + hours * 3600000);
        const label = formatNumber(hours);
        addCandidate(
            trigger,
            `✨ ${title}`,
            `⚡ ${label} Hours passed! Time to celebrate! 🚀`, 
            `hours-${hours}`, 
            false
        );
    }

    // 3. Weeks (Replaces Days)
    // Pattern: 1 week, 2 weeks, 3 weeks...
    // Limit: ~100 years = ~5200 weeks
    const WEEK_LIMIT = 5217;
    for (let w = 1; w <= WEEK_LIMIT; w++) {
        const trigger = new Date(eventDate);
        trigger.setDate(trigger.getDate() + (w * 7));
        
        const label = formatNumber(w);
        const suffix = w === 1 ? 'Week' : 'Weeks';
        addCandidate(
            trigger,
            `✨ ${title}`,
            `🗓️ ${label} ${suffix} passed! Time to celebrate! 🥂`, 
            `weeks-${w}`, 
            true
        );
    }

    // 4. Months & Years
    // Pattern: 1 month, 2 months... (Every month)
    // Lifetime: 100 Years = 1200 months
    for (let i = 1; i <= 1200; i++) {
        const trigger = new Date(eventDate);
        const targetMonth = trigger.getMonth() + i;
        trigger.setMonth(targetMonth);
        if (trigger.getDate() !== eventDate.getDate()) {
            trigger.setDate(0); 
        }

        const years = Math.floor(i / 12);
        const months = i % 12;

        let label = "";
        let idSuffix = "";
        
        if (months === 0) {
            // It's a full year
            label = `${years} Year${years > 1 ? 's' : ''} complete`;
            idSuffix = `year-${years}`;
        } else {
            // It's a month milestone
            // User asked for "1 month, 2 month...". 
            // If we want "Total Months Passed":
            label = `${i} Month${i > 1 ? 's' : ''} passed`;
            idSuffix = `month-${i}`;
        }

        addCandidate(
            trigger,
            `✨ ${title}`,
            `🏆 ${label}! Time to celebrate! 🎂`, 
            idSuffix, 
            true
        );
    }

    // DEDUPLICATION STEP:
    // Prevent multiple notifications at the exact same time.
    // Prioritize larger units (Year > Month > Week > Hour > Minute).
    const uniqueCandidates = new Map<number, NotificationCandidate>();
    
    const getPriority = (idSuffix: string): number => {
        if (idSuffix.startsWith('capsule')) return 6;
        if (idSuffix.startsWith('year')) return 5;
        if (idSuffix.startsWith('month')) return 4;
        if (idSuffix.startsWith('weeks')) return 3;
        if (idSuffix.startsWith('hours')) return 2;
        if (idSuffix.startsWith('mins')) return 1;
        return 0;
    };

    for (const candidate of candidates) {
        const timeKey = candidate.triggerDate.getTime();
        const existing = uniqueCandidates.get(timeKey);

        if (!existing) {
            uniqueCandidates.set(timeKey, candidate);
        } else {
            // Collision! Keep the higher priority one
            if (getPriority(candidate.idSuffix) > getPriority(existing.idSuffix)) {
                uniqueCandidates.set(timeKey, candidate);
            }
        }
    }

    // Convert back to array
    const finalCandidates = Array.from(uniqueCandidates.values());

    // SORT candidates by Date (Ascending)
    finalCandidates.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());

    // TAKE the first 60 (System Limit Safeguard)
    // Most devices limit to 64. We use 60 to be safe and leave room for other apps/notifications.
    const notificationsToSchedule = finalCandidates.slice(0, 60);

    // SCHEDULE them
    for (const item of notificationsToSchedule) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: item.title,
                body: item.body,
                data: { eventId, type: item.idSuffix },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: item.triggerDate,
            },
        });
    }
}
