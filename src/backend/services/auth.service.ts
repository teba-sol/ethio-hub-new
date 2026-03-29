const mockUsers: Array<{ email: string; password: string; role: string; name: string }> = [
  { email: 'admin@ethiohub.com', password: 'admin123', role: 'ADMIN', name: 'Admin User' },
  { email: 'artisan@test.com', password: 'artisan123', role: 'ARTISAN', name: 'Test Artisan' },
  { email: 'organizer@test.com', password: 'organizer123', role: 'ORGANIZER', name: 'Test Organizer' },
  { email: 'tourist@test.com', password: 'tourist123', role: 'TOURIST', name: 'Test Tourist' },
];

const JWT_SECRET = process.env.JWT_SECRET || 'ethio-hub-secret-key-2025';

function generateToken(user: any): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ ...user, iat: Date.now() }));
  const signature = btoa(JWT_SECRET + user.email);
  return `${header}.${payload}.${signature}`;
}

export const login = async (credentials: { email: string; password: string }) => {
  const user = mockUsers.find(u => u.email === credentials.email && u.password === credentials.password);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  const token = generateToken(user);
  return { token, user: { email: user.email, role: user.role, name: user.name } };
};

export const register = async (userData: { email: string; password: string; name: string; role?: string }) => {
  const exists = mockUsers.find(u => u.email === userData.email);
  if (exists) {
    throw new Error('User already exists');
  }
  const newUser = { ...userData, role: userData.role || 'TOURIST' };
  mockUsers.push(newUser);
  const token = generateToken(newUser);
  return { token, user: { email: newUser.email, role: newUser.role, name: newUser.name } };
};

export const verifyToken = async (token: string) => {
  return { valid: true };
};

export const logout = async () => {
  return { success: true };
};