import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_supabase';

/**
 * Create Player Endpoint
 * Creates a new player profile in the database
 * 
 * POST /api/create-player
 * Body: { userId, position, jerseyNumber, overallRating, ... }
 * Returns: Created player object
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            userId,
            teamId,
            position,
            jerseyNumber,
            overallRating,
            cardType,
            height,
            weight,
            preferredFoot,
            nationality,
            dateOfBirth
        } = req.body;

        // Validate required fields
        if (!userId || !position) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'userId and position are required'
            });
        }

        // Validate position
        const validPositions = ['GK', 'DEF', 'MID', 'ATT'];
        if (!validPositions.includes(position)) {
            return res.status(400).json({
                error: 'Invalid position',
                message: `Position must be one of: ${validPositions.join(', ')}`
            });
        }

        // Check if player already exists for this user
        const { data: existingPlayer } = await supabaseAdmin
            .from('players')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existingPlayer) {
            return res.status(409).json({
                error: 'Player already exists',
                message: 'This user already has a player profile'
            });
        }

        // Create player
        const { data: player, error } = await supabaseAdmin
            .from('players')
            .insert({
                user_id: userId,
                team_id: teamId || null,
                position,
                jersey_number: jerseyNumber || null,
                overall_rating: overallRating || 50,
                card_type: cardType || 'silver',
                height: height || null,
                weight: weight || null,
                preferred_foot: preferredFoot || null,
                nationality: nationality || null,
                date_of_birth: dateOfBirth || null
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                error: 'Failed to create player',
                message: error.message
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Player created successfully',
            player
        });
    } catch (error) {
        console.error('Create player error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
