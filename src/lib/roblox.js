/**
 * Utility to interact with Roblox public APIs
 */

/**
 * Resolves a single Roblox username to its avatar headshot URL.
 * @param {string} username 
 * @returns {Promise<string|null>}
 */
export async function getRobloxAvatar(username) {
    if (!username) return null;

    const cleanUsername = username.replace(/^@+/, '').trim();
    if (!cleanUsername) return null;

    try {
        // 1. Username -> userId
        const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usernames: [cleanUsername],
                excludeBannedUsers: false,
            }),
        });

        if (!userRes.ok) return null;
        const userData = await userRes.json();
        const userId = userData.data?.[0]?.id;

        if (!userId) return null;

        // 2. userId -> avatarUrl
        const thumbRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`
        );

        if (!thumbRes.ok) return null;
        const thumbData = await thumbRes.json();
        const result = thumbData.data?.[0];

        if (result && result.state === 'Completed') {
            return result.imageUrl;
        }

        return null;
    } catch (err) {
        console.error('Error in getRobloxAvatar:', err);
        return null;
    }
}
