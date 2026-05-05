import { NextResponse, NextRequest } from "next/server";
import * as authService from "../../../../services/auth.service";
import { connectDB } from "../../../../lib/mongodb";
import { serialize } from "cookie";
import User from "../../../../models/User";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || 'ethio-hub-secret-key-2025';

async function generateToken(user: any) {
  const token = await new SignJWT({ 
    userId: user._id.toString(),
    email: user.email,
    role: user.role 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(JWT_SECRET));
  return token;
}

function formatUserResponse(user: any) {
  return { 
    id: user._id,
    email: user.email, 
    role: user.role, 
    name: user.name,
    isVerified: !!user.isVerified,
    artisanStatus: user.artisanStatus || 'Not Submitted',
    organizerStatus: user.organizerStatus || 'Not Submitted',
    organizerProfile: user.organizerProfile || null,
    touristProfile: user.touristProfile || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { googleId, email, name, role } = body;
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }
    
    // Check if user exists with googleId (normal flow)
    let existingUser = await User.findOne({ googleId });
    
    if (existingUser) {
      // Existing Google user - log them in
      const token = await generateToken(existingUser);
      
      const serialized = serialize("sessionToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60,
        path: "/",
      });
      
      const response = NextResponse.json({ 
        success: true, 
        user: formatUserResponse(existingUser) 
      }, { status: 200 });
      
      response.headers.set("Set-Cookie", serialized);
      return response;
    }
    
    // Check if user exists with this email (linking account)
    existingUser = await User.findOne({ email });
    
    if (existingUser) {
      // Link Google account to existing user
      existingUser.googleId = googleId;
      await existingUser.save();
      const token = await generateToken(existingUser);
      
      const serialized = serialize("sessionToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60,
        path: "/",
      });
      
      const response = NextResponse.json({ 
        success: true, 
        user: formatUserResponse(existingUser) 
      }, { status: 200 });
      
      response.headers.set("Set-Cookie", serialized);
      return response;
    }
    
    // New user - check if role is provided
    if (!role) {
      return NextResponse.json({ 
        success: true, 
        needsRole: true, 
        email, 
        name: name || '' 
      }, { status: 200 });
    }
    
    // Create new Google user
    const userRole = role?.toLowerCase() || 'tourist';
    const newUserData: any = {
      name: name || 'Google User',
      email,
      googleId,
      password: '', // Empty for Google users
      role: userRole,
      isVerified: true, // Google verifies email
    };

    if (userRole === 'organizer') {
      newUserData.organizerStatus = 'Not Submitted';
    } else if (userRole === 'artisan') {
      newUserData.artisanStatus = 'Not Submitted';
    }
    
    const newUser = await User.create(newUserData);
    const token = await generateToken(newUser);
    
    const serialized = serialize("sessionToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60,
      path: "/",
    });
    
    const response = NextResponse.json({ 
      success: true, 
      user: formatUserResponse(newUser) 
    }, { status: 201 });
    
    response.headers.set("Set-Cookie", serialized);
    return response;
  } catch (error: any) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Google authentication failed' },
      { status: 400 }
    );
  }
}