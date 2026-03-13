import i18n from '../i18n';

/**
 * shareContent.ts
 * Centralized share logic for Ciudad Friki web.
 * Uses the Web Share API (navigator.share) when available,
 * with a rich OG-style message. Falls back to clipboard + toast.
 */

const APP_NAME = 'Ciudad Friki';
const WEB_ORIGIN = window.location.origin;

export interface ShareOptions {
    title: string;
    text: string;        // Rich description / message
    url: string;
    imageUrl?: string;   // Used only for platforms that accept files
    file?: File;         // Direct file object (new)
}

/** Shared state for the copy-feedback toast */
let _copiedCallback: (() => void) | null = null;
export function registerCopiedCallback(cb: () => void) {
    _copiedCallback = cb;
}

/**
 * Attempt Web Share API first (supports image as File on mobile browsers).
 * On desktop / unsupported browsers falls back to clipboard write + toast.
 */
export async function shareContent(opts: ShareOptions): Promise<void> {
    const { title, text, url, imageUrl, file: directFile } = opts;

    // Build the share payload
    const shareData: ShareData = { title, text, url };

    // Try to attach the image as a File
    if (navigator.canShare) {
        try {
            let fileToShare = directFile;

            // If no direct file but we have a URL, try to fetch it
            if (!fileToShare && imageUrl) {
                const resp = await fetch(imageUrl);
                const blob = await resp.blob();
                const ext = blob.type.split('/')[1] || 'jpg';
                fileToShare = new File([blob], `ciudad-friki.${ext}`, { type: blob.type });
            }

            if (fileToShare) {
                const withFile: ShareData = { ...shareData, files: [fileToShare] };
                if (navigator.canShare(withFile)) {
                    await navigator.share(withFile);
                    return;
                }
            }
        } catch {
            // Sharing or fetching failed — fall through
        }
    }

    // Standard share without file
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return;
        } catch (err: any) {
            // User cancelled (AbortError) — don't show error
            if (err?.name === 'AbortError') return;
        }
    }

    // Clipboard fallback
    try {
        await navigator.clipboard.writeText(`${text}\n\n${url} `);
    } catch {
        // Clipboard also unavailable
    }
    _copiedCallback?.();
}

// ─── BUILDERS ──────────────────────────────────────────────────────────────────

/** Build share payload for an event card */
export function buildEventShare(event: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    date?: string | null;
    start_time?: string | null;
    banner_url?: string | null;
    image_url?: string | null;
}): ShareOptions {
    const url = `${WEB_ORIGIN}/events?id=${event.id}`;
    const dateStr = event.date
        ? new Date(event.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
        : '';
    const timeStr = event.start_time ? ` a las ${event.start_time}` : '';
    const locationStr = event.location ? `📍 ${event.location}` : '';

    const text = [
        `🎉 *${event.title}*`,
        dateStr ? `📅 ${dateStr}${timeStr}` : '',
        locationStr,
        event.description ? event.description.substring(0, 120).trim() + (event.description.length > 120 ? '…' : '') : '',
        '',
        i18n.t('share.events.watchOn'),
    ].filter(Boolean).join('\n');

    return {
        title: `${event.title} — ${APP_NAME}`,
        text,
        url,
        imageUrl: event.banner_url || event.image_url || undefined,
    };
}

/** Build share payload for a tavern thread */
export function buildThreadShare(thread: {
    id: string;
    title: string;
    content: string;
    author_username?: string | null;
    tag?: string | null;
}): ShareOptions {
    const url = `${WEB_ORIGIN}/tavern?thread=${thread.id}`;
    const preview = thread.content.replace(/<[^>]*>/g, '').substring(0, 180).trim();
    const tag = thread.tag ? `#${thread.tag.replace('/', '_')}` : '';

    const text = [
        `🏰 *${thread.title}*`,
        thread.author_username ? `por @${thread.author_username}` : '',
        tag,
        '',
        preview + (preview.length >= 180 ? '…' : ''),
        '',
        i18n.t('share.tavern.joinConversation'),
    ].filter(Boolean).join('\n');

    return {
        title: `${thread.title} — ${i18n.t('share.tavern.title')}`,
        text,
        url,
    };
}

/** Build share payload for a specific reply */
export function buildReplyShare(opts: {
    threadId: string;
    replyId: string;
    author_username?: string | null;
    content: string;
    threadTitle: string;
}): ShareOptions {
    const url = `${WEB_ORIGIN}/tavern?thread=${opts.threadId}&reply=${opts.replyId}`;
    const preview = opts.content.replace(/<[^>]*>/g, '').substring(0, 180).trim();
    const by = opts.author_username ? `@${opts.author_username}` : i18n.t('share.tavern.someone');

    const text = [
        i18n.t('share.tavern.userResponded', { author: by, title: opts.threadTitle }),
        '',
        preview + (preview.length >= 180 ? '…' : ''),
        '',
        i18n.t('share.tavern.readFullResponse'),
    ].filter(Boolean).join('\n');

    return {
        title: `${i18n.t('share.tavern.responseBy', { author: by })} — ${APP_NAME}`,
        text,
        url,
    };
}
