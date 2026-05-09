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
    const opts = {
      dbName: "ethio-craft-hub",
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      console.log('MongoDB: Connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB: Connection error:', error);
      cached.promise = null;
      throw error;
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