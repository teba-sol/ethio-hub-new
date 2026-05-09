export interface Review {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  targetId: string; // Product or Festival ID
  targetName: string;
  rating: number;
  comment: string;
  date: string;
  isVerified: boolean;
}
