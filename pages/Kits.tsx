
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Kit, KitRequest } from '../types';
import { createKitRequest, getVisibleKits, getKitRequestsByUserId, subscribeToChanges, getUserNotifications, markNotificationAsRead } from '../utils/db';
import { showToast } from '../components/Toast';
import { ShoppingBag, Upload, AlertCircle, Check, X, Shirt, Package, Clock, Mail, Phone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Kits: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [kits, setKits] = useState<Kit[]>([]);
    const [userRequests, setUserRequests] = useState<KitRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'browse' | 'requests'>('browse');
    const [unreadKitNotifications, setUnreadKitNotifications] = useState(0);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'requests') {
            setActiveTab('requests');
        }
    }, [location]);

    // Modal State
    const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
    const [size, setSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    // Custom Request State
    const [customImage, setCustomImage] = useState<string | null>(null);
    const [customNotes, setCustomNotes] = useState('');
    const [customQuantity, setCustomQuantity] = useState(1); // Default 1 for custom as well? Or separate? 
    // Wait, the "Custom Design Request" section in user prompt says: "Select sizes & quantity". 
    // And "Upload one image".
    // I will add sizes for custom request too. 
    const [customSize, setCustomSize] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadKits();
        if (user) loadUserRequests();

        const unsubscribe = subscribeToChanges(() => {
            loadKits();
            if (user) loadUserRequests();
        });

        return () => unsubscribe();
    }, [user, activeTab]);

    useEffect(() => {
        if (user && !contactEmail) {
            setContactEmail(user.email);
        }
    }, [user, contactEmail]);

    const loadUserRequests = async () => {
        if (!user) return;
        try {
            const data = await getKitRequestsByUserId(user.id);
            setUserRequests(data);

            // Fetch notifications to show badge for unread kit updates
            const allNotifications = await getUserNotifications(user.id);
            const kitNotifications = allNotifications.filter(n =>
                !n.read &&
                (n.title.includes('Kit Request') || n.actionUrl?.includes('/kits'))
            );
            setUnreadKitNotifications(kitNotifications.length);

            // If we are currently on the 'requests' tab, mark them all as read
            if (activeTab === 'requests' && kitNotifications.length > 0) {
                for (const n of kitNotifications) {
                    await markNotificationAsRead(n.id);
                }
                setUnreadKitNotifications(0);
            }
        } catch (error) {
            console.error('Error loading user requests:', error);
        }
    };

    const loadKits = async () => {
        try {
            const data = await getVisibleKits();
            setKits(data);
        } catch (error) {
            console.error('Error loading kits:', error);
            showToast('Failed to load kits', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOfficialRequest = async () => {
        if (!user) {
            showToast('You must be logged in to request a kit', 'error');
            return;
        }
        if (!selectedKit || !size) {
            showToast('Please select a size', 'error');
            return;
        }
        if (!contactEmail || !contactPhone) {
            showToast('Please provide contact details', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const request: KitRequest = {
                id: uuidv4(),
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                teamId: (user as any).teamId, // Cast just in case type isn't fully updated everywhere yet
                type: 'official_kit',
                status: 'pending',
                kitId: selectedKit.id,
                kitName: selectedKit.name,
                selectedSize: size,
                quantity: quantity,
                contactEmail,
                contactPhone,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await createKitRequest(request);
            showToast('Kit request submitted successfully!', 'success');
            setSelectedKit(null);
            setSize('');
            setQuantity(1);
            setContactEmail(user.email);
            setContactPhone('');
        } catch (error) {
            console.error('Error requesting kit:', error);
            showToast('Failed to submit request', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showToast('Image size too large (max 5MB)', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCustomRequest = async () => {
        if (!user) {
            showToast('You must be logged in to request a custom design', 'error');
            return;
        }
        if (!customImage) {
            showToast('Please upload a design image', 'error');
            return;
        }
        if (!customSize) {
            showToast('Please select a size for your custom order', 'error');
            return;
        }
        if (!contactEmail || !contactPhone) {
            showToast('Please provide contact details', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const request: KitRequest = {
                id: uuidv4(),
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                teamId: (user as any).teamId,
                type: 'custom_design',
                status: 'pending',
                quantity: customQuantity,
                selectedSize: customSize, // Reusing field for simplicity or add into notes
                customImageUrl: customImage,
                notes: customNotes,
                contactEmail,
                contactPhone,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await createKitRequest(request);
            showToast('Custom design request submitted!', 'success');
            setCustomImage(null);
            setCustomNotes('');
            setCustomQuantity(1);
            setCustomSize('');
            setContactEmail(user.email);
            setContactPhone('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Error requesting custom design:', error);
            showToast('Failed to submit custom request', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* Header */}
            <header className="bg-gradient-to-r from-elkawera-accent/10 to-transparent border-l-4 border-elkawera-accent p-6 rounded-r-xl mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-elkawera-accent/20 rounded-full">
                        <ShoppingBag className="text-elkawera-accent" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider">
                            Official Kits
                        </h1>
                        <p className="text-gray-400 mt-1 max-w-2xl">
                            Represent your team with style. Choose from our official collection or submit your own custom design for approval.
                        </p>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'browse' ? 'bg-elkawera-accent text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    Browse Collection
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-elkawera-accent text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    My Requests {unreadKitNotifications > 0 && <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-lg">{unreadKitNotifications}</span>}
                </button>
            </div>

            {activeTab === 'browse' ? (
                <>
                    {/* Official Kits Grid */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Shirt className="text-elkawera-accent" /> Available Designs
                            </h2>
                        </div>

                        {loading ? (
                            <div className="text-center py-20 text-gray-500">Loading kits...</div>
                        ) : kits.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-xl font-bold text-gray-400">No kits available yet.</p>
                                <p className="text-sm text-gray-500">Check back later for new drops.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {kits.map(kit => (
                                    <div key={kit.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-elkawera-accent/50 transition-all group hover:transform hover:scale-[1.02] shadow-lg">
                                        {/* Image Area */}
                                        <div className="aspect-[4/5] bg-black/40 relative overflow-hidden">
                                            <img
                                                src={kit.imageUrl}
                                                alt={kit.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            {kit.badge && (
                                                <div className="absolute top-4 right-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md
                                                ${kit.badge === 'Limited' ? 'bg-red-500/80 text-white' :
                                                            kit.badge === 'Special Edition' ? 'bg-purple-500/80 text-white' :
                                                                'bg-elkawera-accent/80 text-black'}`}>
                                                        {kit.badge}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 pointer-events-none" />

                                            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                <button
                                                    onClick={() => {
                                                        setSelectedKit(kit);
                                                        setSize('');
                                                        setQuantity(1);
                                                    }}
                                                    className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-elkawera-accent transition-colors shadow-lg flex items-center justify-center gap-2"
                                                >
                                                    Select Kit
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <h3 className="text-xl font-bold text-white mb-1">{kit.name}</h3>
                                            <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">{kit.description}</p>

                                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                                {kit.sizes.map(s => (
                                                    <span key={s} className="px-2 py-1 bg-white/5 rounded border border-white/10">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Custom Design Section */}
                    <section className="mt-20 pt-10 border-t border-white/10">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-display font-bold text-white mb-4">
                                    Have a <span className="text-elkawera-accent">Custom Design?</span>
                                </h2>
                                <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                                    Upload your team's custom kit design here. Our admin team will review your submission and facilitate the production process.
                                    This request is private and visible only to administrators.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                        <Upload className="text-elkawera-accent shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-white">Upload Design</h4>
                                            <p className="text-sm text-gray-400">High quality image (PNG/JPG) of your kit design.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                        <AlertCircle className="text-elkawera-accent shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-white">Admin Review</h4>
                                            <p className="text-sm text-gray-400">All custom requests are subject to approval. You will be notified of updates.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                                <div className="space-y-6">
                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">Design File</label>
                                        <div
                                            className={`border-2 border-dashed border-white/20 rounded-xl p-8 text-center transition-colors ${customImage ? 'bg-white/5' : 'hover:bg-white/5 hover:border-elkawera-accent/50 cursor-pointer'}`}
                                            onClick={() => !customImage && fileInputRef.current?.click()}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />

                                            {customImage ? (
                                                <div className="relative">
                                                    <img src={customImage} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setCustomImage(null); }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-gray-400">
                                                    <Upload className="mx-auto mb-3 text-gray-500" size={32} />
                                                    <p className="font-bold text-gray-300">Click to upload</p>
                                                    <p className="text-xs">or drag and drop</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={customQuantity}
                                                onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-elkawera-accent outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Size</label>
                                            <select
                                                value={customSize}
                                                onChange={(e) => setCustomSize(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-elkawera-accent outline-none"
                                            >
                                                <option value="">Select Size</option>
                                                <option value="S">Small</option>
                                                <option value="M">Medium</option>
                                                <option value="L">Large</option>
                                                <option value="XL">Extra Large</option>
                                                <option value="XXL">2XL</option>
                                                <option value="XXXL">3XL</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">Notes (Optional)</label>
                                        <textarea
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-elkawera-accent outline-none min-h-[100px]"
                                            placeholder="Any specific instructions..."
                                            value={customNotes}
                                            onChange={(e) => setCustomNotes(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                                                <Mail size={14} className="text-elkawera-accent" /> Contact Gmail
                                            </label>
                                            <input
                                                type="email"
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                placeholder="your@gmail.com"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-elkawera-accent outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                                                <Phone size={14} className="text-elkawera-accent" /> Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={contactPhone}
                                                onChange={(e) => setContactPhone(e.target.value)}
                                                placeholder="+20 ..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-elkawera-accent outline-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCustomRequest}
                                        disabled={submitting}
                                        className="w-full py-4 bg-elkawera-accent text-black font-bold rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Custom Request'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            ) : (
                <section className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Package className="text-elkawera-accent" /> Your Submission History
                        </h2>
                    </div>

                    {userRequests.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                            <Package size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-xl font-bold text-gray-400">No requests submitted yet.</p>
                            <button onClick={() => setActiveTab('browse')} className="mt-4 text-elkawera-accent font-bold hover:underline">Start browsing kits</button>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {userRequests.map(req => (
                                <div key={req.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-24 h-24 bg-black/40 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-white/5">
                                            {req.type === 'official_kit' ? (
                                                <Shirt className="text-elkawera-accent" size={40} />
                                            ) : (
                                                req.customImageUrl ? <img src={req.customImageUrl} alt="Custom" className="w-full h-full object-cover" /> : <Package className="text-blue-400" size={40} />
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                                                    req.status === 'processing' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                                                        req.status === 'ready' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                                                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                                <span className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                <span className="text-xs text-gray-500 text-mono px-2 py-0.5 bg-white/5 rounded uppercase">{req.id.slice(0, 8)}</span>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">
                                                    {req.type === 'official_kit' ? req.kitName : 'Custom Design Request'}
                                                </h3>
                                                <p className="text-gray-400 text-sm">
                                                    Size: <span className="text-white font-bold">{req.selectedSize}</span> | Quantity: <span className="text-white font-bold">{req.quantity}</span>
                                                </p>
                                                <div className="flex flex-wrap gap-4 mt-1">
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Mail size={10} /> {req.contactEmail}</span>
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Phone size={10} /> {req.contactPhone}</span>
                                                </div>
                                            </div>

                                            {req.adminNotes && (
                                                <div className="bg-elkawera-accent/10 border border-elkawera-accent/20 p-4 rounded-xl">
                                                    <p className="text-xs font-bold text-elkawera-accent uppercase mb-1">Admin Response</p>
                                                    <p className="text-sm text-gray-200">{req.adminNotes}</p>
                                                </div>
                                            )}

                                            {req.status === 'pending' && !req.adminNotes && (
                                                <div className="flex items-center gap-2 text-yellow-500/50 text-xs italic">
                                                    <Clock size={12} /> Awaiting admin review...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Official Kit Selection Modal */}
            {selectedKit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedKit(null)}>
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedKit(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-white mb-2">{selectedKit.name}</h3>
                        <p className="text-gray-400 mb-6 text-sm">Review your selection before submitting.</p>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Size</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedKit.sizes.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSize(s)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${size === s
                                                ? 'bg-elkawera-accent text-black border-elkawera-accent'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Quantity</label>
                                <div className="flex items-center gap-4 bg-white/5 rounded-xl border border-white/10 p-2 w-fit">
                                    <button
                                        className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        -
                                    </button>
                                    <span className="font-bold w-8 text-center">{quantity}</span>
                                    <button
                                        className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20"
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <p className="text-xs font-bold text-gray-500 uppercase">Contact Information</p>
                                <div className="space-y-3">
                                    <div className="bg-black/20 rounded-xl border border-white/5 p-3 flex items-center gap-3">
                                        <Mail size={16} className="text-elkawera-accent" />
                                        <input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="Contact Gmail"
                                            className="bg-transparent border-none outline-none text-white text-sm flex-1"
                                        />
                                    </div>
                                    <div className="bg-black/20 rounded-xl border border-white/5 p-3 flex items-center gap-3">
                                        <Phone size={16} className="text-elkawera-accent" />
                                        <input
                                            type="tel"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                            placeholder="Phone Number"
                                            className="bg-transparent border-none outline-none text-white text-sm flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleOfficialRequest}
                            disabled={submitting}
                            className="w-full py-4 bg-elkawera-accent text-black font-bold rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? 'Processing...' : 'Confirm Request'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
