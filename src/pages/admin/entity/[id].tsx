import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { User, Calendar, Mail, Phone, MapPin, AlertTriangle, Badge } from 'lucide-react';

const EntityProfilePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const fetchEntity = async () => {
      setLoading(true);
      try {
        // Try to fetch as User first
        let res = await fetch(`/api/admin/users/${id}`);
        let data = await res.json();
        
        if (data.success && data.user) {
          setEntity({ ...data.user, type: 'User' });
          setLoading(false);
          return;
        }

        // Try as Event
        res = await fetch(`/api/events/${id}`);
        data = await res.json();
        
        if (data.success && data.event) {
          setEntity({ ...data.event, type: 'Event' });
          setLoading(false);
          return;
        }

        // Try as Product
        res = await fetch(`/api/products/${id}`);
        data = await res.json();
        
        if (data.success && data.product) {
          setEntity({ ...data.product, type: 'Product' });
          setLoading(false);
          return;
        }

        setError('Entity not found');
      } catch (err: any) {
        setError(err.message || 'Failed to fetch entity details');
      } finally {
        setLoading(false);
      }
    };

    fetchEntity();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800">Entity Not Found</h2>
          <p className="text-red-600 mt-2">{error || 'The requested entity could not be found.'}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
            {entity.type === 'User' ? <User className="w-8 h-8 text-gray-600" /> :
             entity.type === 'Event' ? <Calendar className="w-8 h-8 text-gray-600" /> :
             <AlertTriangle className="w-8 h-8 text-gray-600" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{entity.name || entity.title || 'Unknown'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold">{entity.type}</span>
              {entity.status && <span className={`px-2 py-1 rounded-md text-xs font-bold ${entity.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{entity.status}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entity.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{entity.email}</p>
              </div>
            </div>
          )}

          {entity.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{entity.phone}</p>
              </div>
            </div>
          )}

          {entity.location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{entity.location}</p>
              </div>
            </div>
          )}
        </div>

        {entity.type === 'Event' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
            <h3 className="font-bold text-gray-700 mb-2">Event Details</h3>
            <p><strong>Organizer:</strong> {entity.organizer?.name || 'Unknown'}</p>
            <p><strong>Date:</strong> {new Date(entity.startDate || entity.date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {entity.status}</p>
          </div>
        )}

        {entity.type === 'Product' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
            <h3 className="font-bold text-gray-700 mb-2">Product Details</h3>
            <p><strong>Artisan:</strong> {entity.artisanId?.name || 'Unknown'}</p>
            <p><strong>Price:</strong> ${entity.price}</p>
            <p><strong>Status:</strong> {entity.status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityProfilePage;
