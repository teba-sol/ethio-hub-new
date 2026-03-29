import React, { useState, useMemo } from 'react';
import { 
  Star, Search, Filter, MessageSquare, Flag, CheckCircle2, 
  MoreVertical, ThumbsUp, AlertCircle, ChevronDown, Reply
} from 'lucide-react';
import { Button, Badge } from '../UI';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell 
} from 'recharts';

// --- Types ---
interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  date: string;
  orderId: string;
  status: 'Published' | 'Reported' | 'Hidden';
  reply?: {
    text: string;
    date: string;
  };
  helpfulCount: number;
}

// --- Mock Data ---
const MOCK_REVIEWS: Review[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `rev-${i + 1}`,
  productId: `prod-${i % 5}`,
  productName: i % 2 === 0 ? 'Handwoven Gabi Scarf' : 'Traditional Clay Pot',
  productImage: i % 2 === 0 ? 'https://picsum.photos/seed/gabi/100/100' : 'https://picsum.photos/seed/pot/100/100',
  customerName: i % 3 === 0 ? 'Abebe K.' : 'Sara M.',
  customerAvatar: `https://ui-avatars.com/api/?name=${i % 3 === 0 ? 'Abebe+K' : 'Sara+M'}&background=random`,
  rating: i % 5 === 0 ? 3 : i % 4 === 0 ? 4 : 5,
  comment: i % 2 === 0 
    ? "Absolutely beautiful craftsmanship! The material is so soft and authentic. Highly recommended." 
    : "Good quality but shipping took a bit longer than expected. Overall satisfied with the purchase.",
  date: new Date(Date.now() - i * 86400000 * 2).toISOString(),
  orderId: `#ORD-${7800 + i}`,
  status: i === 5 ? 'Reported' : 'Published',
  reply: i === 0 ? { text: "Thank you so much for your kind words! We're glad you love it.", date: new Date().toISOString() } : undefined,
  helpfulCount: i * 2
}));

const RATING_DISTRIBUTION = [
  { star: '5 Star', count: 45, percentage: 60, color: '#10b981' },
  { star: '4 Star', count: 20, percentage: 25, color: '#3b82f6' },
  { star: '3 Star', count: 8, percentage: 10, color: '#f59e0b' },
  { star: '2 Star', count: 3, percentage: 3, color: '#f97316' },
  { star: '1 Star', count: 2, percentage: 2, color: '#ef4444' },
];

// --- Components ---

const StarRating: React.FC<{ rating: number; size?: string }> = ({ rating, size = "w-4 h-4" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star 
        key={star} 
        className={`${size} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} 
      />
    ))}
  </div>
);

export const ArtisanReviewManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');
  const [productFilter, setProductFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // --- Derived State ---
  const filteredReviews = useMemo(() => {
    let result = [...MOCK_REVIEWS];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.customerName.toLowerCase().includes(q) || 
        r.comment.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
      );
    }

    if (ratingFilter !== 'All') {
      result = result.filter(r => r.rating === ratingFilter);
    }

    if (productFilter !== 'All') {
      result = result.filter(r => r.productName === productFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [searchQuery, ratingFilter, productFilter, sortOrder]);

  const handleReplySubmit = (reviewId: string) => {
    // In a real app, this would call an API
    console.log(`Replying to ${reviewId}: ${replyText}`);
    setReplyingTo(null);
    setReplyText('');
    alert('Reply posted successfully!');
  };

  const handleReport = (reviewId: string) => {
    if (confirm('Are you sure you want to report this review to admin?')) {
      console.log(`Reported review ${reviewId}`);
      alert('Review reported for moderation.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary">Customer Reviews</h1>
        <p className="text-gray-500 text-sm">Manage feedback and engage with your customers.</p>
      </div>

      {/* 1. Top Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overall Rating Card */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <h2 className="text-5xl font-bold text-primary mb-2">4.8</h2>
          <StarRating rating={5} size="w-6 h-6" />
          <p className="text-gray-500 text-sm mt-2 font-medium">Based on 78 reviews</p>
        </div>

        {/* Rating Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6">Rating Distribution</h3>
          <div className="space-y-3">
            {RATING_DISTRIBUTION.map((item) => (
              <div key={item.star} className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-500 w-12">{item.star}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-primary w-8 text-right">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Filters & Controls */}
      <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by customer or product..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="h-8 w-[1px] bg-gray-100 hidden md:block"></div>
          
          {/* Rating Filter */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setRatingFilter('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                ratingFilter === 'All' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              All Stars
            </button>
            {[5, 4, 3, 2, 1].map(star => (
              <button
                key={star}
                onClick={() => setRatingFilter(star)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  ratingFilter === star ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {star} <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
          <div className="relative">
            <select 
              className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Review List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Product Thumbnail (Left) */}
              <div className="flex-shrink-0">
                <img src={review.productImage} className="w-16 h-16 rounded-xl object-cover bg-gray-100 border border-gray-100" alt="" />
              </div>

              {/* Review Content (Middle) */}
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-primary text-sm">{review.productName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-gray-400">• {new Date(review.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={review.status === 'Published' ? 'success' : review.status === 'Reported' ? 'warning' : 'secondary'} size="sm">
                    {review.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <img src={review.customerAvatar} className="w-6 h-6 rounded-full bg-gray-100" alt="" />
                  <span className="text-xs font-bold text-gray-700">{review.customerName}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">Verified Buyer</span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">"{review.comment}"</p>

                {/* Artisan Reply */}
                {review.reply && (
                  <div className="bg-gray-50 p-4 rounded-xl border-l-4 border-primary mt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary">Your Reply</span>
                      <span className="text-[10px] text-gray-400">• {new Date(review.reply.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-600">{review.reply.text}</p>
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === review.id && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <textarea 
                      className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10 mb-2"
                      rows={3}
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => handleReplySubmit(review.id)}>Post Reply</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions (Right) */}
              <div className="flex flex-row md:flex-col gap-2 justify-end md:justify-start border-t md:border-t-0 md:border-l border-gray-50 pt-4 md:pt-0 md:pl-6">
                {!review.reply && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    leftIcon={Reply} 
                    className="w-full justify-center"
                    onClick={() => setReplyingTo(review.id)}
                  >
                    Reply
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  leftIcon={Flag} 
                  className="w-full justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => handleReport(review.id)}
                >
                  Report
                </Button>
                <div className="mt-auto text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Order ID</p>
                  <p className="text-xs font-mono text-gray-600">{review.orderId}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
