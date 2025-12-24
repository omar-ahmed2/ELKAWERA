import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_supabase';

/**
 * Get Player Endpoint
 * Retrieves a player's profile by their ID
 * 
 * GET /api/player?id=<player_id>
 * Returns: Player object with all details
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        // Validate player ID
        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                error: 'Missing or invalid player ID',
                message: 'Please provide a valid player ID in the query parameter'
            });
        }

        // Fetch player from database
        const { data: player, error } = await supabaseAdmin
            .from('players')
            .select(`
        *,
        user:users(id, name, email, avatar_url),
        team:teams(id, name, logo_url)
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(404).json({
                error: 'Player not found',
                message: error.message
            });
        }

        return res.status(200).json({
            success: true,
            player
        });
    } catch (error) {
        console.error('Get player error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
