// Avatar configuration for Ciudad Friki Web
// Matches the Mobile App configuration

export interface Avatar {
    id: string;
    name: string;
    file: string; // URL path for web
}

// Generate the 36 dragons array dynamically to save space, but keeping the exact IDs
const generateAvatars = (): Avatar[] => {
    const avatars: Avatar[] = [];

    // First 6 have custom names in mobile config
    const customNames: Record<string, string> = {
        'dragon_01': 'Dragon Rojo',
        'dragon_02': 'Dragon Neutral',
        'dragon_03': 'Dragon Teal',
        'dragon_04': 'Dragon Wizard',
        'dragon_05': 'Dragon Magician',
        'dragon_06': 'Dragon Green',
    };

    for (let i = 1; i <= 36; i++) {
        const id = `dragon_${i.toString().padStart(2, '0')}`;
        avatars.push({
            id,
            name: customNames[id] || `Dragon ${i.toString().padStart(2, '0')}`,
            file: `/assets/avatars/${id}.png` // Served from Vite public folder
        });
    }

    return avatars;
};

export const AVATARS: Avatar[] = generateAvatars();

export const DEFAULT_AVATAR = 'dragon_01';

/**
 * Get the image source URL for an avatar by ID
 */
export function getAvatarSource(avatarId: string | null): string {
    if (!avatarId) {
        return AVATARS[0].file;
    }

    if (avatarId.startsWith('http')) {
        return avatarId;
    }

    const avatar = AVATARS.find(a => a.id === avatarId);
    return avatar?.file || AVATARS[0].file;
}

/**
 * Get avatar name by ID
 */
export function getAvatarName(avatarId: string | null): string {
    if (!avatarId) {
        return AVATARS[0].name;
    }

    const avatar = AVATARS.find(a => a.id === avatarId);
    return avatar?.name || AVATARS[0].name;
}
