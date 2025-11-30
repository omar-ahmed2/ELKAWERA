import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingPlayerRegistrationRequests, getAllPlayerRegistrationRequests, updatePlayerRegistrationRequest, getPlayerRegistrationRequestById, addNotificationToUser } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { PlayerRegistrationRequest } from '../types';
import { User, CheckCircle, XCircle, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NewPlayers: React.FC = () => {
  const [requests, setRequests] = useState<PlayerRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only admins can access this page
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadRequests();
  }, [user, navigate]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Load all requests, not just pending, so we can show confirmed ones
      const allRequests = await getAllPlayerRegistrationRequests();
      // Sort by status (pending first) then by date
      const sorted = allRequests.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return b.createdAt - a.createdAt;
      });
      setRequests(sorted);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = (request: PlayerRegistrationRequest) => {
    // Navigate to create player page with request data
    navigate(`/create?requestId=${request.id}`);
  };

  const handleReject = async (requestId: string) => {
    try {
      const request = await getPlayerRegistrationRequestById(requestId);
      if (request) {
        await updatePlayerRegistrationRequest({
          ...request,
          status: 'rejected'
        });

        // Add notification
        await addNotificationToUser(request.userId, {
          id: uuidv4(),
          type: 'card_rejected',
          message: 'Your player card request was rejected. Please review and submit a new request.',
          timestamp: Date.now(),
          read: false
        });

        loadRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading registration requests...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight flex items-center gap-3">
            <User className="text-elkawera-accent" /> New Players
          </h1>
          <p className="text-gray-400 mt-1">Review and create player cards for new registrations.</p>
        </div>
        <div className="bg-white/10 px-6 py-3 rounded-xl border border-white/20">
          <span className="text-xs uppercase font-bold text-gray-400 block">Total Requests</span>
          <span className="text-3xl font-display font-bold text-white">{requests.length}</span>
          <span className="text-xs text-gray-500 block mt-1">
            {requests.filter(r => r.status === 'pending').length} Pending
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <Clock size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-500 text-lg">No pending registration requests.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-elkawera-accent/20 flex items-center justify-center border-2 border-elkawera-accent">
                      <User size={32} className="text-elkawera-accent" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white uppercase">{request.name}</h3>
                      <p className="text-gray-400 text-sm">{request.email}</p>
                    </div>
                    <div className={`ml-auto flex items-center gap-2 px-3 py-1 rounded-full border ${request.status === 'approved'
                        ? 'bg-green-500/20 border-green-500/30'
                        : request.status === 'rejected'
                          ? 'bg-red-500/20 border-red-500/30'
                          : 'bg-yellow-500/20 border-yellow-500/30'
                      }`}>
                      {request.status === 'approved' ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : request.status === 'rejected' ? (
                        <XCircle size={14} className="text-red-400" />
                      ) : (
                        <Clock size={14} className="text-yellow-400" />
                      )}
                      <span className={`text-xs font-bold uppercase ${request.status === 'approved'
                          ? 'text-green-400'
                          : request.status === 'rejected'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}>
                        {request.status === 'approved' ? 'Confirmed' : request.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                      <span className="text-xs uppercase text-gray-400 block mb-1">Age</span>
                      <span className="text-lg font-bold text-white">{request.age}</span>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                      <span className="text-xs uppercase text-gray-400 block mb-1">Height</span>
                      <span className="text-lg font-bold text-white">{request.height} cm</span>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                      <span className="text-xs uppercase text-gray-400 block mb-1">Weight</span>
                      <span className="text-lg font-bold text-white">{request.weight} kg</span>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                      <span className="text-xs uppercase text-gray-400 block mb-1">Foot</span>
                      <span className="text-lg font-bold text-white">{request.strongFoot}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="bg-black/30 rounded-lg px-4 py-2 border border-white/10">
                      <span className="text-xs uppercase text-gray-400 block">Position</span>
                      <span className="text-xl font-bold text-elkawera-accent">{request.position}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Registered: {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 ml-6">
                  {request.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleCreateCard(request)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-lg hover:bg-white transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                      >
                        <CheckCircle size={18} /> Open Card Builder
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 font-bold rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        <XCircle size={18} /> Reject
                      </button>
                    </>
                  ) : request.status === 'approved' ? (
                    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500/10 text-green-400 border border-green-500/30 font-bold rounded-lg">
                      <CheckCircle size={18} /> Confirmed
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 font-bold rounded-lg">
                      <XCircle size={18} /> Rejected
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

