/**
 * Trivia VS Category Icons
 * Maps the 'icon' field from triviaduels_categories DB to a local PNG path.
 * Mirrors the logic in the mobile app's utils/triviaIcons.ts
 */

const ICON_BASE = '/assets/icons/';

const TRIVIA_ICONS: Record<string, string> = {
    'icon_anime': `${ICON_BASE}icon_anime.png`,
    'icon_comic': `${ICON_BASE}icon_comic.png`,
    'icon_friki': `${ICON_BASE}icon_friki.png`,
    'icon_memes': `${ICON_BASE}icon_memes.png`,
    'icon_mitologia': `${ICON_BASE}icon_mitologia.png`,
    'icon_rol': `${ICON_BASE}icon_rol.png`,
    'icon_scifi': `${ICON_BASE}icon_scifi.png`,
    'icon_sitcoms': `${ICON_BASE}icon_sitcoms.png`,
    'icon_terror': `${ICON_BASE}icon_terror.png`,
    'icon_videogames': `${ICON_BASE}icon_videogames.png`,
    'icon_vs': `${ICON_BASE}icon_vs.png`,
};

/**
 * Returns the PNG path for a VS category icon.
 * 'random' and unknown categories fall back to icon_vs.png.
 * Mirrors getTriviaIcon() from the mobile app.
 */
export function getTriviaIcon(iconName?: string | null, categoryId?: string | null): string {
    if (!iconName || categoryId === 'random' || iconName === 'icon_vs') {
        return TRIVIA_ICONS['icon_vs'];
    }
    return TRIVIA_ICONS[iconName] ?? TRIVIA_ICONS['icon_friki'];
}
