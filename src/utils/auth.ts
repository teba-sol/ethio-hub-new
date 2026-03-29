import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function generateToken(userId: string, role: string) {

  const token = jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return token;
}
