
import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Mail, Phone, MapPin, Send, Instagram, Facebook, Twitter, MessageSquare, CheckCircle2 } from 'lucide-react';

export const Contact: React.FC = () => {
  const { dir } = useSettings();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Simulate API call
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-16" dir={dir}>
      {/* Header */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold tracking-wider uppercase">
          <MessageSquare size={16} /> Contact Us
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter italic">
          LET'S START A <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">CONVERSATION</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-400 font-medium">
          Have questions about the platform? Interested in partnership? Or just want to say hi? We'd love to hear from you.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Info */}
        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold italic tracking-tight">GET IN TOUCH</h2>
            <div className="space-y-6">
              {[
                { icon: <Mail className="text-blue-400" />, label: "Email Us", value: "support@elkawera.com" },
                { icon: <Phone className="text-blue-400" />, label: "Call Us", value: "+20 (123) 456-7890" },
                { icon: <MapPin className="text-blue-400" />, label: "Visit Us", value: "Cairo, Egypt - ELKAWERA HQ" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-blue-400/30 transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-blue-400/10 transition-all">
                    {React.cloneElement(item.icon, { size: 24 })}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className="text-lg font-bold text-white tracking-tight">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Connect with us</h3>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center hover:bg-blue-400 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-xl">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="p-8 md:p-12 rounded-[2.5rem] bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full"></div>
            
            {submitted ? (
              <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-4">
                  <CheckCircle2 size={48} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-bold">Message Sent!</h3>
                <p className="text-gray-400 max-w-sm">Thank you for reaching out. Our team will get back to you within 24-48 hours.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="John Doe"
                      className="w-full bg-black/50 border border-[var(--border-color)] rounded-2xl px-6 py-4 outline-none focus:border-blue-400 focus:ring-4 ring-blue-400/10 transition-all placeholder:text-gray-600 font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full bg-black/50 border border-[var(--border-color)] rounded-2xl px-6 py-4 outline-none focus:border-blue-400 focus:ring-4 ring-blue-400/10 transition-all placeholder:text-gray-600 font-medium"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                  <input 
                    required
                    type="text" 
                    placeholder="How can we help you?"
                    className="w-full bg-black/50 border border-[var(--border-color)] rounded-2xl px-6 py-4 outline-none focus:border-blue-400 focus:ring-4 ring-blue-400/10 transition-all placeholder:text-gray-600 font-medium"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Your Message</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="Write your message here..."
                    className="w-full bg-black/50 border border-[var(--border-color)] rounded-2xl px-6 py-4 outline-none focus:border-blue-400 focus:ring-4 ring-blue-400/10 transition-all placeholder:text-gray-600 font-medium resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-5 rounded-2xl shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
                >
                  Send Message
                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
