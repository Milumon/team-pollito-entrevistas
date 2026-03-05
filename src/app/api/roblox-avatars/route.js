import { NextResponse } from 'next/server';

// In-memory cache to avoid repeated calls to Roblox APIs
// Key: lowercase username, Value: { avatarUrl, resolvedAt }
const avatarCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// POST /api/roblox-avatars
// Body: { usernames: ["user1", "user2", ...] }
// Returns: { "user1": "https://tr.rbxcdn.com/...", "user2": "..." }
export async function POST(request) {
    try {
        const { usernames } = await request.json();

        if (!Array.isArray(usernames) || usernames.length === 0) {
            return NextResponse.json({ error: 'usernames array required' }, { status: 400 });
        }

        // Clean usernames (remove @)
        const cleanNames = usernames
            .map(u => (u || '').replace(/^@+/, '').trim())
            .filter(Boolean);

        if (cleanNames.length === 0) {
            return NextResponse.json({});
        }

        const now = Date.now();
        const result = {};
        const toResolve = [];

        // Check cache first
        for (const name of cleanNames) {
            const key = name.toLowerCase();
            const cached = avatarCache.get(key);
            if (cached && (now - cached.resolvedAt) < CACHE_TTL) {
                result[name] = cached.avatarUrl;
            } else {
                toResolve.push(name);
            }
        }

        // If everything was cached, return immediately
        if (toResolve.length === 0) {
            return NextResponse.json(result);
        }

        // Step 1: Resolve usernames → userIds
        const usersRes = await fetch('https://users.roblox.com/v1/usernames/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usernames: toResolve,
                excludeBannedUsers: false,
            }),
        });

        if (!usersRes.ok) {
            console.error('Roblox Users API error:', usersRes.status);
            return NextResponse.json(result); // Return whatever we had cached
        }

        const usersJson = await usersRes.json();
        const userData = usersJson.data || [];

        // Build username → userId map
        const userIdMap = {};
        for (const entry of userData) {
            userIdMap[entry.requestedUsername] = entry.id;
        }

        // Get the list of resolved userIds
        const userIds = Object.values(userIdMap).filter(Boolean);

        if (userIds.length === 0) {
            return NextResponse.json(result);
        }

        // Step 2: Resolve userIds → avatar headshots
        const thumbRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(',')}&size=150x150&format=Png&isCircular=true`
        );

        if (!thumbRes.ok) {
            console.error('Roblox Thumbnails API error:', thumbRes.status);
            return NextResponse.json(result);
        }

        const thumbJson = await thumbRes.json();
        const thumbData = thumbJson.data || [];

        // Build userId → imageUrl map
        const thumbMap = {};
        for (const entry of thumbData) {
            if (entry.state === 'Completed' && entry.imageUrl) {
                thumbMap[entry.targetId] = entry.imageUrl;
            }
        }

        // Combine: username → avatarUrl
        for (const name of toResolve) {
            const userId = userIdMap[name];
            const avatarUrl = userId ? thumbMap[userId] : null;
            if (avatarUrl) {
                result[name] = avatarUrl;
                avatarCache.set(name.toLowerCase(), { avatarUrl, resolvedAt: now });
            }
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error('Roblox avatar resolution error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
