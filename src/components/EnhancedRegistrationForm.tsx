import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { validateGmailEmail, validatePhoneNumber, formatPhoneNumber } from '@/utils/validation';
import { UserRole } from '@/types';

interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  password: string;
  age?: number;
  height?: number;
  weight?: number;
  strongFoot?: 'Left' | 'Right';
  position?: string;
  teamName?: string;
  teamAbbreviation?: string;
  teamColor?: string;
  teamLogo?: string | null;
}

interface EnhancedRegistrationFormProps {
  role: UserRole;
  onSubmit: (data: RegistrationData) => Promise<void>;
  title: string;
  subtitle: string;
  additionalFields?: React.ReactNode;
}

export const EnhancedRegistrationForm: React.FC<EnhancedRegistrationFormProps> = ({
  role,
  onSubmit,
  title,
  subtitle,
  additionalFields
}) => {
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: 18,
    height: 175,
    weight: 70,
    strongFoot: 'Right',
    position: 'CF',
    teamName: '',
    teamAbbreviation: '',
    teamColor: '#00ff9d',
    teamLogo: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const navigate = useNavigate();

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          return 'Name can only contain letters and spaces';
        }
        return null;

      case 'email':
        const emailValidation = validateGmailEmail(value);
        return emailValidation.isValid ? null : emailValidation.error;

      case 'phone':
        const phoneValidation = validatePhoneNumber(value);
        return phoneValidation.isValid ? null : phoneValidation.error;

      case 'password':
        if (!value || value.length < 8) {
          return 'Password must be at least 8 characters';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        return null;

      case 'age':
        const ageNum = parseInt(value);
        if (isNaN(ageNum) || ageNum < 16 || ageNum > 70) {
          return 'Age must be between 16 and 70';
        }
        if (role === 'captain' && ageNum < 18) {
          return 'Captains must be at least 18 years old';
        }
        return null;

      case 'teamName':
        if (role === 'captain' && (!value || value.trim().length < 2)) {
          return 'Team name must be at least 2 characters';
        }
        return null;

      case 'teamAbbreviation':
        if (role === 'captain') {
          if (!value || value.length < 2 || value.length > 4) {
            return 'Team abbreviation must be 2-4 characters';
          }
        }
        return null;

      default:
        return null;
    }
  };

  useEffect(() => {
    // Listen for input events from additional fields
    const handleGlobalInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.name && target.form) {
        const form = target.form;
        const formData = new FormData(form);
        const data: any = {};

        // Convert FormData to plain object with numeric conversion for specific fields
        for (let [key, value] of formData.entries()) {
          if (key === 'age' || key === 'height' || key === 'weight') {
            data[key] = Number(value);
          } else {
            data[key] = value;
          }
        }
        
        // Update form state with all current values
        setFormData(prev => ({ ...prev, ...data }));
      }
    };

    // Add event listener to capture all form inputs
    document.addEventListener('input', handleGlobalInput);

    return () => {
      document.removeEventListener('input', handleGlobalInput);
    };
  }, []);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || ''
      }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof RegistrationData] as string);
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Required fields for all roles
    ['name', 'email', 'phone', 'password'].forEach(field => {
      const error = validateField(field, formData[field as keyof RegistrationData] as string);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Role-specific validation
    if (role === 'player' || role === 'captain') {
      const ageError = validateField('age', formData.age?.toString() || '');
      if (ageError) {
        newErrors.age = ageError;
        isValid = false;
      }
    }

    if (role === 'captain') {
      const teamNameError = validateField('teamName', formData.teamName || '');
      const teamAbbrevError = validateField('teamAbbreviation', formData.teamAbbreviation || '');

      if (teamNameError) {
        newErrors.teamName = teamNameError;
        isValid = false;
      }
      if (teamAbbrevError) {
        newErrors.teamAbbreviation = teamAbbrevError;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setTouched(Object.keys(newErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Navigation will be handled by the parent component
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };







  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <UserPlus size={40} className="text-elkawera-accent" />
            <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">
              {title}
            </h1>
          </div>
          <p className="text-gray-400 mt-2">{subtitle}</p>
        </div>

        {/* Validation Status Bar */}
        <div className="mb-6 p-3 bg-black/30 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Registration Requirements:</span>
            <div className="flex gap-3">
              <div className={`flex items-center gap-1 ${touched.email && !errors.email ? 'text-green-400' : 'text-gray-500'
                }`}>
                {touched.email && !errors.email ? <Check size={12} /> : <X size={12} />}
                Gmail
              </div>
              <div className={`flex items-center gap-1 ${touched.phone && !errors.phone ? 'text-green-400' : 'text-gray-500'
                }`}>
                {touched.phone && !errors.phone ? <Check size={12} /> : <X size={12} />}
                11-digit Phone
              </div>
              <div className={`flex items-center gap-1 ${touched.password && !errors.password ? 'text-green-400' : 'text-gray-500'
                }`}>
                {touched.password && !errors.password ? <Check size={12} /> : <X size={12} />}
                Strong Password
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`w-full bg-black/50 border rounded-xl p-4 text-white focus:outline-none transition-colors pr-10 ${touched.name && errors.name
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/20 focus:border-elkawera-accent'
                    }`}
                  placeholder="e.g. Mohamed Salah"
                />
                {touched.name && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.name ? <X size={18} className="text-red-500" /> : <Check size={18} className="text-green-500" />}
                  </div>
                )}
              </div>
              {touched.name && errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                Gmail Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full bg-black/50 border rounded-xl p-4 text-white focus:outline-none transition-colors pr-10 ${touched.email && errors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/20 focus:border-elkawera-accent'
                    }`}
                  placeholder="username@gmail.com"
                />
                {touched.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.email ? <X size={18} className="text-red-500" /> : <Check size={18} className="text-green-500" />}
                  </div>
                )}
              </div>
              {touched.email && errors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                  onBlur={() => handleBlur('phone')}
                  className={`w-full bg-black/50 border rounded-xl p-4 text-white focus:outline-none transition-colors pr-10 ${touched.phone && errors.phone
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/20 focus:border-elkawera-accent'
                    }`}
                  placeholder="01023456789"
                  maxLength={11}
                />
                {touched.phone && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.phone ? <X size={18} className="text-red-500" /> : <Check size={18} className="text-green-500" />}
                  </div>
                )}
              </div>
              {touched.phone && errors.phone && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full bg-black/50 border rounded-xl p-4 text-white focus:outline-none transition-colors pr-20 ${touched.password && errors.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/20 focus:border-elkawera-accent'
                    }`}
                  placeholder="••••••••"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {touched.password && (
                    errors.password ? <X size={18} className="text-red-500" /> : <Check size={18} className="text-green-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Additional Fields */}
          {additionalFields}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-elkawera-accent text-black font-bold uppercase rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,157,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={20} /> Create {role.charAt(0).toUpperCase() + role.slice(1)} Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-elkawera-accent hover:underline font-bold">Sign In</Link>
        </div>

        {role !== 'player' && (
          <div className="mt-2 text-center text-sm text-gray-400">
            Want to join as a player? <Link to="/signup" className="text-elkawera-accent hover:underline font-bold">Player Sign-Up</Link>
          </div>
        )}

        {role !== 'captain' && (
          <div className="mt-2 text-center text-sm text-gray-400">
            Want to create a team? <Link to="/signup/captain" className="text-elkawera-accent hover:underline font-bold">Captain Sign-Up</Link>
          </div>
        )}

        {/* {role !== 'scout' && (
          <div className="mt-2 text-center text-sm text-gray-400">
            Are you a scout? <Link to="/signup/scout" className="text-elkawera-accent hover:underline font-bold">Scout Sign-Up</Link>
          </div>
        )} */}

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 text-center">
          <strong>Note:</strong> Only Gmail addresses (@gmail.com) and 11-digit phone numbers starting with 01 are accepted.
        </div>
      </div>
    </div>
  );
};

