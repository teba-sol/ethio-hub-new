import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    console.log("Creating compound indexes...");
    const collection = User.collection;

    await collection.createIndex({ role: 1, createdAt: -1 });
    await collection.createIndex({ role: 1, artisanStatus: 1, createdAt: -1 });
    await collection.createIndex({ role: 1, organizerStatus: 1, createdAt: -1 });
    await collection.createIndex({ role: 1, deliveryStatus: 1, createdAt: -1 });

    console.log("Indexes created successfully!");

    return NextResponse.json({ success: true, message: 'Indexes created successfully!' });
  } catch (error: any) {
    console.error('Error creating indexes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
