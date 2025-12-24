import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_supabase';

/**
 * Health Check Endpoint
 * Tests if the backend API and Supabase connection are working
 * 
 * GET /api/health
 * Returns: { status: 'ok', message: string, timestamp: string }
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
        // Test database connection by querying users table
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('count')
            .limit(1);

        if (error) {
            console.error('Database connection error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Database connection failed',
                error: error.message
            });
        }

        return res.status(200).json({
            status: 'ok',
            message: 'Backend API is running and connected to Supabase',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
