import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, ThumbsUp, Calendar, Filter, 
  ChevronDown, Search, ShieldCheck, CornerDownRight, Flag, MoreHorizontal, RefreshCw
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';

interface ReviewData {
  _id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  tourist?: {
    name: string;
    email: string;
  };
  festival?: {
    _id: string;
    name: string;
  };
}

export const OrganizerReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('All Ratings');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [sortBy, setSortBy] = useState('Newest');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [events, setEvents] = useState<{_id: string; name: string}[]>([{ _id: 'all', name: 'All Events' }]);

  useEffect(() => {
    fetchReviews();
    fetchFestivals();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizer/reviews');
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFestivals = async () => {
    try {
      const response = await fetch('/api/organizer/festivals');
      const data = await response.json();
      if (data.success && data.festivals) {
        const festivalList = data.festivals.map((f: any) => ({ _id: f._id, name: f.name }));
        setEvents([{ _id: 'all', name: 'All Events' }, ...festivalList]);
      }
    } catch (err) {
      console.error('Error fetching festivals:', err);
    }
  };

  const transformReview = (review: any) => ({
    id: review._id,
    eventId: review.festival?._id || '',
    eventName: review.festival?.name || 'Unknown Event',
    user: { 
      name: review.tourist?.name || 'Anonymous', 
      avatar: `https://i.pravatar.cc/150?u=${review.tourist?.email || review._id}` 
    },
    rating: review.rating,
    date: new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    comment: review.comment,
    verified: review.isVerified || review.isApproved || false,
    reply: review.reply || null,
    isApproved: review.isApproved
  });

  const reviewsTransformed = reviews.map(transformReview);

  // Filter logic
  const filteredReviews = reviewsTransformed.filter(review => {
    if (selectedEventId !== 'all' && review.eventId !== selectedEventId) return false;
    if (ratingFilter !== 'All Ratings' && review.rating.toString() !== ratingFilter.charAt(0)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Highest Rating') return b.rating - a.rating;
    if (sortBy === 'Lowest Rating') return a.rating - b.rating;
    return 0;
  });

  // Calculate Stats
  const totalReviews = filteredReviews.length;
  const averageRating = totalReviews > 0 
    ? (filteredReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
    : '0.0';
  const fiveStarReviews = filteredReviews.filter(r => r.rating === 5).length;
  const fiveStarRate = totalReviews > 0 ? Math.round((fiveStarReviews / totalReviews) * 100) : 0;
  const recentReviews = filteredReviews.filter(r => r.date.includes('2025')).length; // Mock recent

  // Rating Distribution
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: filteredReviews.filter(r => r.rating === star).length,
    percentage: totalReviews > 0 ? (filteredReviews.filter(r => r.rating === star).length / totalReviews) * 100 : 0
  }));

  const isGlobalView = selectedEventId === 'all';
  const currentEvent = events.find(e => e._id === selectedEventId);

  const handleReplySubmit = (reviewId: string) => {
    // In a real app, this would make an API call
    console.log(`Replying to ${reviewId}: ${replyText}`);
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary">
            {isGlobalView ? 'Reviews & Ratings' : currentEvent?.name}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isGlobalView 
              ? 'Monitor feedback across all your events.' 
              : 'Event-specific reviews and feedback.'}
          </p>
        </div>
        {!isGlobalView && (
          <div className="flex gap-2">
            <Badge className="bg-emerald-50 text-emerald-600 border-none">Completed</Badge>
            <Badge className="bg-gray-100 text-gray-600 border-none">Jan 19 - 21, 2025</Badge>
          </div>
        )}
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-500">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Average Rating</p>
            <p className="text-2xl font-bold text-primary">{averageRating} <span className="text-sm text-gray-400 font-normal">/ 5.0</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Reviews</p>
            <p className="text-2xl font-bold text-primary">{totalReviews}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">5-Star Rate</p>
            <p className="text-2xl font-bold text-primary">{fiveStarRate}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Recent (This Month)</p>
            <p className="text-2xl font-bold text-primary">{recentReviews}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rating Breakdown */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm h-fit">
          <h3 className="text-lg font-serif font-bold text-primary mb-6">Rating Breakdown</h3>
          <div className="space-y-4">
            {distribution.map((dist) => (
              <div key={dist.star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12 shrink-0">
                  <span className="text-sm font-bold text-gray-700">{dist.star}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full" 
                    style={{ width: `${dist.percentage}%` }}
                  />
                </div>
                <div className="w-8 text-right shrink-0">
                  <span className="text-xs text-gray-500">{dist.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List & Filters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
            {isGlobalView && (
              <div className="relative flex-1 min-w-[150px]">
                <select 
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                >
                  {events.map(e => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
            
            <div className="relative flex-1 min-w-[120px]">
              <select 
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option>All Ratings</option>
                <option>5 Stars</option>
                <option>4 Stars</option>
                <option>3 Stars</option>
                <option>2 Stars</option>
                <option>1 Star</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 min-w-[120px]">
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option>All Time</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 min-w-[120px]">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option>Newest</option>
                <option>Highest Rating</option>
                <option>Lowest Rating</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map(review => (
                <div key={review.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <img src={review.user.avatar} alt={review.user.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-primary">{review.user.name}</p>
                          {review.verified && (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none px-1.5 py-0 text-[9px] flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Verified Booking
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-current' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>
                      <button className="p-1 text-gray-400 hover:text-primary transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isGlobalView && (
                    <div className="inline-block px-3 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-600">
                      Event: {review.eventName}
                    </div>
                  )}

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Reply Section */}
                  {review.reply ? (
                    <div className="mt-4 pl-4 border-l-2 border-primary/20 bg-ethio-bg/30 p-4 rounded-r-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <CornerDownRight className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary">Your Reply</span>
                      </div>
                      <p className="text-sm text-gray-600">{review.reply}</p>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-50 flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="text-xs py-1.5 h-auto text-gray-500 border-gray-200" leftIcon={Flag}>Report</Button>
                      {replyingTo === review.id ? (
                        <div className="flex-1 flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Write your reply..." 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-gray-50 border-none rounded-xl py-1.5 px-3 text-sm focus:ring-2 focus:ring-primary/10"
                            autoFocus
                          />
                          <Button size="sm" className="py-1.5 h-auto" onClick={() => handleReplySubmit(review.id)}>Send</Button>
                          <Button variant="outline" size="sm" className="py-1.5 h-auto" onClick={() => setReplyingTo(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs py-1.5 h-auto" onClick={() => setReplyingTo(review.id)}>Reply</Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-[24px] border border-gray-100 text-center">
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No reviews found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
