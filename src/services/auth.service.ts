import User from '../models/User';
import { connectDB } from '../lib/mongodb';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'ethio-hub-secret-key-2025';

export const login = async (credentials: { email: string; password: string }) => {
  await connectDB();
  
  const user = await User.findOne({ email: credentials.email });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isValidPassword = await bcrypt.compare(credentials.password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  const token = await new SignJWT({ 
    userId: user._id.toString(),
    email: user.email,
    role: user.role 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(JWT_SECRET));
  
  return { 
    token, 
    user: { 
      id: user._id,
      email: user.email, 
      role: user.role, 
      name: user.name,
      artisanStatus: user.artisanStatus || 'Not Submitted',
      organizerStatus: user.organizerStatus || 'Not Submitted',
      organizerProfile: user.organizerProfile || null,
    } 
  };
};

export const register = async (userData: { email: string; password: string; name: string; role?: string }) => {
  await connectDB();
  
  const exists = await User.findOne({ email: userData.email });
  if (exists) {
    throw new Error('User already exists');
  }
  
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const role = userData.role?.toLowerCase() || 'tourist';
  
  const newUserData: any = {
    ...userData,
    password: hashedPassword,
    role,
  };

  if (role === 'organizer') {
    newUserData.organizerStatus = 'Not Submitted';
  } else if (role === 'artisan') {
    newUserData.artisanStatus = 'Not Submitted';
  }
  
  const newUser = await User.create(newUserData);
  
  const token = await new SignJWT({ 
    userId: newUser._id.toString(),
    email: newUser.email,
    role: newUser.role 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(JWT_SECRET));
  
  return { 
    token, 
    user: { 
      id: newUser._id,
      email: newUser.email, 
      role: newUser.role, 
      name: newUser.name,
      artisanStatus: newUser.artisanStatus || 'Not Submitted',
      organizerStatus: newUser.organizerStatus || 'Not Submitted',
    } 
  };
};

export const verifyToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
};

export const logout = async () => {
  return { success: true };
};