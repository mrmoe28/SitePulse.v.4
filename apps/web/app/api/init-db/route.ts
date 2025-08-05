import { NextRequest, NextResponse } from 'next/server';
import { ensureTablesExist } from '../../../lib/db/init';

export async function GET(request: NextRequest) {
    try {
        console.log('Starting database initialization...');
        const result = await ensureTablesExist();
        
        return NextResponse.json({
            success: true,
            message: 'Database initialized successfully',
            result
        });
    } catch (error) {
        console.error('Database initialization failed:', error);
        
        return NextResponse.json({
            success: false,
            message: 'Database initialization failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return GET(request);
}