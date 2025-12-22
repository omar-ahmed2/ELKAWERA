
import React, { useState, useEffect, useRef } from 'react';
import { Kit } from '../types';
import { getAllKits, saveKit, deleteKit } from '../utils/db';
import { showToast } from '../components/Toast';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Upload, Shirt, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminKits: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [kits, setKits] = useState<Kit[]>([]);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKit, setEditingKit] = useState<Kit | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']); // Default
    const [badge, setBadge] = useState<Kit['badge'] | undefined>(undefined);
    const [isVisible, setIsVisible] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadKits();
    }, []);

    const loadKits = async () => {
        try {
            const data = await getAllKits();
            setKits(data.sort((a, b) => b.createdAt - a.createdAt));
        } catch (error) {
            console.error('Error loading kits:', error);
            showToast('Failed to load kits', 'error');
        }
    };

    const handleOpenModal = (kit?: Kit) => {
        if (kit) {
            setEditingKit(kit);
            setName(kit.name);
            setDescription(kit.description);
            setImageUrl(kit.imageUrl);
            setSizes(kit.sizes);
            setBadge(kit.badge);
            setIsVisible(kit.isVisible);
        } else {
            setEditingKit(null);
            setName('');
            setDescription('');
            setImageUrl('');
            setSizes(['S', 'M', 'L', 'XL']);
            setBadge(undefined);
            setIsVisible(true);
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!name || !description || !imageUrl) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const kit: Kit = {
            id: editingKit ? editingKit.id : uuidv4(),
            name,
            description,
            imageUrl,
            sizes,
            badge: badge || undefined,
            isVisible,
            createdAt: editingKit ? editingKit.createdAt : Date.now()
        };

        try {
            await saveKit(kit);
            showToast('Kit saved successfully', 'success');
            setIsModalOpen(false);
            loadKits();
        } catch (error) {
            console.error('Error saving kit:', error);
            showToast('Failed to save kit', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteKit(id);
            showToast('Kit deleted', 'success');
            setConfirmingDeleteId(null);
            loadKits();
        } catch (error) {
            showToast('Failed to delete kit', 'error');
        }
    };

    const toggleVisibility = async (kit: Kit) => {
        try {
            await saveKit({ ...kit, isVisible: !kit.isVisible });
            loadKits();
            showToast(`Kit is now ${!kit.isVisible ? 'Visible' : 'Hidden'}`, 'success');
        } catch (error) {
            showToast('Failed to update visibility', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                    <Shirt className="text-elkawera-accent" /> Kit Management
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-elkawera-accent text-black font-bold rounded-xl hover:bg-white transition-colors"
                >
                    <Plus size={18} /> Add New Kit
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {kits.map(kit => (
                    <div key={kit.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                        <div className="w-20 h-24 bg-black/40 rounded-lg overflow-hidden shrink-0">
                            <img src={kit.imageUrl} alt={kit.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-white truncate">{kit.name}</h3>
                                {kit.badge && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-elkawera-accent/20 text-elkawera-accent border border-elkawera-accent/30">
                                        {kit.badge}
                                    </span>
                                )}
                                {!kit.isVisible && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-500 border border-red-500/30">
                                        Hidden
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-1">{kit.description}</p>
                            <div className="flex gap-2 mt-2">
                                {kit.sizes.map(s => (
                                    <span key={s} className="text-xs px-1.5 py-0.5 bg-white/5 rounded text-gray-400">{s}</span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {confirmingDeleteId === kit.id ? (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                                    <span className="text-[10px] font-bold text-red-500 uppercase">Sure?</span>
                                    <button
                                        onClick={() => handleDelete(kit.id)}
                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => setConfirmingDeleteId(null)}
                                        className="p-2 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => toggleVisibility(kit)}
                                        className={`p-2 rounded-lg transition-colors ${kit.isVisible ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-white/10'}`}
                                        title="Toggle Visibility"
                                    >
                                        {kit.isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(kit)}
                                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => setConfirmingDeleteId(kit.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {kits.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No kits added yet.
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">{editingKit ? 'Edit Kit' : 'New Kit'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-xl hover:bg-white/5 cursor-pointer transition-colors" onClick={() => fileInputRef.current?.click()}>
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Preview" className="h-48 rounded object-contain" />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <Upload className="mx-auto mb-2" size={32} />
                                        <p>Click to upload image</p>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Kit Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-elkawera-accent outline-none"
                                        placeholder="e.g. Home Kit 2025"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Sizes (comma separated)</label>
                                    <input
                                        type="text"
                                        value={sizes.join(', ')}
                                        onChange={e => setSizes(e.target.value.split(',').map(s => s.trim()))}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-elkawera-accent outline-none"
                                        placeholder="S, M, L, XL"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-elkawera-accent outline-none min-h-[100px]"
                                    placeholder="Kit details..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Badge Type</label>
                                    <select
                                        value={badge || ''}
                                        onChange={e => setBadge(e.target.value as any || undefined)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-elkawera-accent outline-none"
                                    >
                                        <option value="">None</option>
                                        <option value="Official">Official</option>
                                        <option value="Limited">Limited</option>
                                        <option value="Special Edition">Special Edition</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-8">
                                    <input
                                        type="checkbox"
                                        id="isVisible"
                                        checked={isVisible}
                                        onChange={e => setIsVisible(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-600 text-elkawera-accent focus:ring-elkawera-accent bg-gray-700"
                                    />
                                    <label htmlFor="isVisible" className="text-gray-300 font-bold select-none cursor-pointer">Visibile to Users</label>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full py-4 bg-elkawera-accent text-black font-bold rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={20} /> Save Kit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
