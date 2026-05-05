import React, { useState, useMemo, useEffect } from 'react';
import { 
  Star, Search, Filter, MessageSquare, Flag, CheckCircle2, 
  MoreVertical, ThumbsUp, AlertCircle, ChevronDown, Reply,
  Package
} from 'lucide-react';
import { Button, Badge } from '../UI';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell 
} from 'recharts';

// --- Types ---
interface Review {
  _id: string;
  targetId: string;
  productName: string;
  productImage: string;
  user: {
    name: string;
    profilePicture?: string;
    profileImage?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  status: string;
  isVerifiedPurchase: boolean;
  reply?: {
    text: string;
    date: string;
  };
}

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
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/artisan/reviews');
        const data = await res.json();
        if (data.reviews) {
          setReviews(data.reviews);
          setStats(data.stats);
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Error fetching artisan reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // --- Derived State ---
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.user?.name?.toLowerCase().includes(q) || 
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
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [reviews, searchQuery, ratingFilter, productFilter, sortOrder]);

  const handleReplySubmit = async (reviewId: string) => {
    try {
      // In a real app, this would call an API
      // const res = await fetch(`/api/artisan/reviews/${reviewId}/reply`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ text: replyText })
      // });
      
      // Update local state to show the reply immediately
      setReviews(prev => prev.map(r => 
        r._id === reviewId ? { 
          ...r, 
          reply: { text: replyText, date: new Date().toISOString() } 
        } : r
      ));
      setReplyingTo(null);
      setReplyText('');
      alert('Reply posted successfully!');
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply');
    }
  };

  const handleReport = (reviewId: string) => {
    if (confirm('Are you sure you want to report this review to admin?')) {
      console.log(`Reported review ${reviewId}`);
      alert('Review reported for moderation.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-500 font-medium">Loading reviews...</p>
      </div>
    );
  }

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
          <h2 className="text-5xl font-bold text-primary mb-2">{stats?.avgRating || '0.0'}</h2>
          <StarRating rating={Math.round(stats?.avgRating || 0)} size="w-6 h-6" />
          <p className="text-gray-500 text-sm mt-2 font-medium">Based on {stats?.totalReviews || 0} reviews</p>
        </div>

        {/* Rating Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6">Rating Distribution</h3>
          <div className="space-y-3">
            {stats?.distribution?.map((item: any) => (
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
          <select 
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-500 focus:ring-2 focus:ring-primary/10 px-4 py-2.5"
          >
            <option value="All">All Products</option>
            {products.map(p => (
              <option key={p._id} value={p.name}>{p.name}</option>
            ))}
          </select>

          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-500 focus:ring-2 focus:ring-primary/10 px-4 py-2.5"
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* 3. Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <div 
              key={review._id} 
              className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Customer & Product Info */}
                <div className="md:w-64 flex-shrink-0 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                      <img 
                        src={review.user?.profilePicture || review.user?.profileImage || `https://ui-avatars.com/api/?name=${review.user?.name || 'User'}&background=random`} 
                        alt={review.user?.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary text-sm truncate w-40">{review.user?.name}</h4>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" size="sm" className="bg-gray-50 text-[10px] py-0 px-2 h-5">Verified Buyer</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3 group cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200">
                      <img src={review.productImage} alt={review.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</p>
                      <p className="text-xs font-bold text-primary truncate">{review.productName}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Review Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <StarRating rating={review.rating} />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Reviewed on {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-primary">
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleReport(review._id)}
                        className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                    <p className="text-sm text-gray-600 leading-relaxed italic">"{review.comment}"</p>
                  </div>

                  {/* Artisan Reply */}
                  {review.reply ? (
                    <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <Reply className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Your Response</span>
                        <span className="text-[10px] text-gray-400">{new Date(review.reply.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed bg-primary/5 p-3 rounded-xl">
                        {review.reply.text}
                      </p>
                    </div>
                  ) : replyingTo === review._id ? (
                    <div className="ml-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <textarea 
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[100px]"
                        placeholder="Write your response to the customer..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      ></textarea>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => handleReplySubmit(review._id)} disabled={!replyText.trim()}>Post Response</Button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setReplyingTo(review._id)}
                      className="text-xs font-bold text-primary hover:text-secondary transition-colors flex items-center gap-1.5 group"
                    >
                      <MessageSquare className="w-4 h-4" /> 
                      <span className="border-b border-primary/20 group-hover:border-secondary transition-colors">Write a response</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white py-20 rounded-[32px] border border-dashed border-gray-200 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="text-lg font-bold text-primary">No reviews found</h3>
              <p className="text-gray-500 text-sm">We couldn't find any reviews matching your current filters.</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSearchQuery('');
                setRatingFilter('All');
                setProductFilter('All');
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
