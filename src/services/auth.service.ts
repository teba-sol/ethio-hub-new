import User from '../models/User';
import { connectDB } from '../lib/mongodb';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'ethio-hub-secret-key-2025';

const ACCESS_TOKEN_EXPIRES = '1h';
const REFRESH_TOKEN_EXPIRES = '7d';

export async function generateAccessToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES)
    .sign(new TextEncoder().encode(JWT_SECRET));
}

export async function generateRefreshToken(payload: any) {
  return await new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES)
    .sign(new TextEncoder().encode(JWT_SECRET));
}

const generateToken = async (user: any) => {
  return await generateAccessToken({ 
    userId: user._id.toString(),
    email: user.email,
    role: user.role 
  });
};

const formatUserResponse = (user: any) => ({ 
  id: user._id,
  email: user.email, 
  role: user.role, 
  name: user.name,
  isVerified: !!user.isVerified,
  artisanStatus: user.artisanStatus || 'Not Submitted',
  organizerStatus: user.organizerStatus || 'Not Submitted',
  deliveryStatus: user.deliveryStatus || 'Not Submitted',
  organizerProfile: user.organizerProfile || null,
  touristProfile: user.touristProfile || null,
  deliveryProfile: user.deliveryProfile || null,
  rejectionReason: user.rejectionReason || null,
});

export const login = async (credentials: { email: string; password: string }) => {
  await connectDB();
  
  const user = await User.findOne({ email: credentials.email });
  console.log('Login - User from DB:', JSON.stringify(user?.touristProfile));
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isValidPassword = await bcrypt.compare(credentials.password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email before logging in");
  }

  if (user.adminApprovalStatus === 'PENDING_ADMIN_APPROVAL') {
    throw new Error('Your account is pending admin approval.');
  }

  if (user.adminApprovalStatus === 'REJECTED') {
    throw new Error('Your account was rejected by admin review.');
  }
  
  // Check if user is suspended or banned
  if (user.status === 'Suspended' && user.role === 'tourist') {
    throw new Error('your account is suspended');
  }
  
  if (user.status === 'Banned') {
    throw new Error('Your account has been banned. Please contact support.');
  }
  
  const accessToken = await generateAccessToken({ 
    userId: user._id.toString(),
    email: user.email,
    role: user.role 
  });

  const refreshToken = await generateRefreshToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  });
  
  // Refresh user from DB to get latest data
  const freshUser = await User.findById(user._id);

  const showSuspensionModal = freshUser.status === 'Suspended';

  return { 
    accessToken,
    refreshToken,
    user: { 
      id: freshUser._id,
      email: freshUser.email, 
      role: freshUser.role, 
      name: freshUser.name,
      status: freshUser.status,
      suspensionReason: freshUser.suspensionReason || null,
      suspendedAt: freshUser.suspendedAt ? freshUser.suspendedAt.toISOString() : null,
      isVerified: !!freshUser.isVerified,
      artisanStatus: freshUser.artisanStatus || 'Not Submitted',
      organizerStatus: freshUser.organizerStatus || 'Not Submitted',
      deliveryStatus: freshUser.deliveryStatus || 'Not Submitted',
      organizerProfile: freshUser.organizerProfile || null,
      touristProfile: freshUser.touristProfile || null,
      deliveryProfile: freshUser.deliveryProfile || null,
    },
    showSuspensionModal
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
    isVerified: false,
  };

  if (role === 'organizer') {
    newUserData.organizerStatus = 'Not Submitted';
  } else if (role === 'artisan') {
    newUserData.artisanStatus = 'Not Submitted';
  } else if (role === 'delivery') {
    newUserData.deliveryStatus = 'Not Submitted';
    newUserData.deliveryProfile = null;
  }
  
  const newUser = await User.create(newUserData);
  
  const accessToken = await generateAccessToken({
    userId: newUser._id.toString(),
    email: newUser.email,
    role: newUser.role
  });

  const refreshToken = await generateRefreshToken({
    userId: newUser._id.toString(),
    email: newUser.email,
    role: newUser.role
  });
  
  return { 
    accessToken,
    refreshToken,
    user: { 
      id: newUser._id,
      email: newUser.email, 
      role: newUser.role, 
      name: newUser.name,
      isVerified: !!newUser.isVerified,
      artisanStatus: newUser.artisanStatus || 'Not Submitted',
      organizerStatus: newUser.organizerStatus || 'Not Submitted',
      deliveryStatus: newUser.deliveryStatus || 'Not Submitted',
      deliveryProfile: null,
    } 
  };
};

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload) {
      return { valid: true, payload };
    }
    return { valid: false, payload: null };
  } catch (error) {
    return { valid: false, payload: null };
  }
}

export const logout = async () => {
  return { success: true };
};

export const googleAuth = async (googleData: { 
  googleId: string; 
  email: string; 
  name: string; 
  role?: string 
}) => {
  await connectDB();
  
  // Check if user exists with googleId
  let user = await User.findOne({ googleId: googleData.googleId });
  
  if (user) {
    // Existing Google user - log them in
    if (user.status === 'Suspended' && user.role === 'tourist') {
      throw new Error('your account is suspended');
    }
    const token = await generateToken(user);
    return { ...formatUserResponse(user), token };
  }
  
  // Check if user exists with this email (email/password user trying Google login)
  const existingEmailUser = await User.findOne({ email: googleData.email });
  
  if (existingEmailUser) {
    // Link Google account to existing user
    existingEmailUser.googleId = googleData.googleId;
    await existingEmailUser.save();
    const token = await generateToken(existingEmailUser);
    return { ...formatUserResponse(existingEmailUser), token };
  }
  
  // New user - check if role is provided
  if (!googleData.role) {
    // Needs role selection
    return { needsRole: true, email: googleData.email, name: googleData.name };
  }
  
  // Create new Google user (no password needed, verified by Google)
  const role = googleData.role?.toLowerCase() || 'tourist';
  const newUserData: any = {
    name: googleData.name,
    email: googleData.email,
    googleId: googleData.googleId,
    password: '', // Empty for Google users - they'll never use password login
    role,
    isVerified: true, // Google verifies email
  };

  if (role === 'organizer') {
    newUserData.organizerStatus = 'Not Submitted';
  } else if (role === 'artisan') {
    newUserData.artisanStatus = 'Not Submitted';
  } else if (role === 'delivery') {
    newUserData.deliveryStatus = 'Not Submitted';
  }
  
  const newUser = await User.create(newUserData);
  const token = await generateToken(newUser);
  
  return { ...formatUserResponse(newUser), token, needsRole: false };
};