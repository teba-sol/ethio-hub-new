import mongoose from "mongoose";
import { seedAdminUser } from "./seedAdmin";

const MONGO_URI = process.env.atlas_URL as string;
let adminSeeded = false;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGO_URI) {
    console.log('MongoDB: No atlas_URL found, using mock mode');
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      dbName: "ethio-craft-hub"
    });
  }

  cached.conn = await cached.promise;
  
  // Seed admin user on first connection
  if (!adminSeeded) {
    adminSeeded = true;
    try {
      await seedAdminUser();
    } catch (error) {
      console.error('Failed to seed admin user:', error);
    }
  }
  
  return cached.conn;
}

export async function getDB() {
  return mongoose.connection.db;
}

export async function closeDB() {
  if (cached.conn) {
    await mongoose.connection.close();
  }
}