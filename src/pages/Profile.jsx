import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Loader2, Lock, Eye, EyeOff, Camera, 
  LogOut, ShieldCheck, UserCircle, ChevronDown, 
  ChevronRight, Type, AlignLeft 
} from 'lucide-react';

// API & Store
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';

// UI Components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Field, FieldGroup, FieldLabel, FieldError } from '../components/ui/field';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeSelector } from '../components/ThemeSelector';

// --- Configuration ---
const passwordRequirements = [
  { label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
];

export default function Profile() {
  const navigate = useNavigate();

  // Global State (Zustand)
  const user = useAuthStore(state => state.user);
  const updateProfile = useAuthStore(state => state.updateProfile); 
  const signout = useAuthStore(state => state.signout);
  
  // UI State
  const [openSection, setOpenSection] = useState(null); // 'profile' | 'security' | null
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', avatar_url: '' });

  // Security Form State
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', bio: user.bio || '', avatar_url: user.avatar_url || '' });
    }
  }, [user]);

  // --- Helpers ---
  const setProf = (key) => (e) => setProfileForm(prev => ({ ...prev, [key]: e.target.value }));
  const setPass = (key) => (e) => setPassForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
    setError('');
    setSuccess('');
  };

  // --- Handlers ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // Only send fields that actually changed. Resending unchanged fields (e.g.
    // a legacy/Google name that the backend now validates more strictly) would
    // block an otherwise-valid bio edit. avatar_url is only sent when non-empty
    // (an empty string fails the URL validator).
    const payload = {};
    const name = profileForm.name.trim();
    const avatarUrl = profileForm.avatar_url.trim();
    if (name && name !== (user?.name || '')) payload.name = name;
    if (profileForm.bio !== (user?.bio || '')) payload.bio = profileForm.bio;
    if (avatarUrl && avatarUrl !== (user?.avatar_url || '')) payload.avatar_url = avatarUrl;

    if (Object.keys(payload).length === 0) {
      setSuccess('No changes to save.');
      setTimeout(() => setOpenSection(null), 1200);
      return;
    }

    setLoading(true);
    try {
      await updateProfile(payload);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setOpenSection(null), 1500);
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map(e => e.msg).join(' · ') : err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (passForm.newPassword !== passForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      setSuccess('Password changed. Signing out...');
      setTimeout(() => signout(), 2000);
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map(e => e.msg).join(' · ') : err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col border-none shrink-0 bg-sidebar text-sidebar-foreground overflow-y-auto" data-testid="sidebar">
      
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-sidebar z-10">
        <h1 className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Settings
        </h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <ThemeSelector />
        </div>
      </div>

      {/* --- Avatar & Status --- */}
      <div className="flex flex-col items-center py-6 px-4">
        <button
          type="button"
          onClick={() => setOpenSection('profile')}
          className="relative group cursor-pointer"
          aria-label="Edit profile picture"
        >
          <Avatar className="h-28 w-28 border-2 border-primary/20 shadow-xl">
            <AvatarImage src={user?.avatar_url || undefined} alt={user?.name} className="object-cover" loading="lazy" />
            <AvatarFallback className="text-3xl bg-primary/10">{user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full border-4 border-sidebar shadow-lg transition-transform group-hover:scale-110">
            <Camera size={16} />
          </div>
        </button>
        <h2 className="mt-4 text-xl font-bold">{user?.name || 'Anonymous'}</h2>
        <p className="text-sm text-green-500 font-medium">Online</p>
      </div>

      <div className="px-4 space-y-1 pb-6">
        
        {/* --- Read-Only Information --- */}
        <div className="w-full flex items-center gap-4 p-3 rounded-xl transition-all group">
          <UserCircle className="text-muted-foreground shrink-0" size={24} />
          <div className="text-left overflow-hidden">
            <p className="text-[15px] font-medium leading-none truncate">{user?.email || 'No email provided'}</p>
            <p className="text-xs text-muted-foreground mt-1">Email</p>
          </div>
        </div>

        <div className="w-full flex items-start gap-4 p-3 rounded-xl transition-all group mt-1 bg-sidebar-accent/30 border border-sidebar-border/50">
          <AlignLeft className="text-muted-foreground mt-0.5 shrink-0" size={24} />
          <div className="text-left flex-1">
            <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap text-foreground/90">
              {user?.bio || 'No bio provided yet. Update your profile to tell people about yourself!'}
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-semibold">Bio</p>
          </div>
        </div>

        {/* Global Success Alert */}
        {success && (
            <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 mb-4 text-sm font-medium text-green-600 bg-green-500/10 rounded-lg text-center">
                {success}
            </m.div>
        )}

        {/* --- Accordion 1: Update Profile --- */}
        <div className="border border-sidebar-border rounded-xl overflow-hidden mb-3">
            <button 
                onClick={() => toggleSection('profile')}
                className="w-full flex items-center justify-between p-3 bg-sidebar hover:bg-sidebar-accent transition-colors"
            >
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <UserCircle size={18} />
                    <span>Update Profile</span>
                </div>
                {openSection === 'profile' ? <ChevronDown size={18} className="text-muted-foreground"/> : <ChevronRight size={18} className="text-muted-foreground"/>}
            </button>
            
            <AnimatePresence>
                {openSection === 'profile' && (
                    <m.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleUpdateProfile} className="space-y-3 p-4 pt-2 border-t border-sidebar-border bg-sidebar/50">
                            <FieldGroup>
                                <Field>
                                    <FieldLabel>Display Name</FieldLabel>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Your Name"
                                            value={profileForm.name}
                                            onChange={setProf('name')}
                                            className="pl-10"
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                </Field>
                                <Field>
                                    <FieldLabel>Bio</FieldLabel>
                                    <div className="relative">
                                        <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <textarea
                                            placeholder="Tell us about yourself..."
                                            value={profileForm.bio}
                                            onChange={setProf('bio')}
                                            className="w-full min-h-[80px] pl-10 pr-3 py-2 text-sm rounded-md border border-input bg-transparent shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                            disabled={loading}
                                        />
                                    </div>
                                </Field>
                                <Field>
                                    <FieldLabel>Avatar URL</FieldLabel>
                                    <div className="relative">
                                        <Camera className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="url"
                                            placeholder="https://example.com/avatar.png"
                                            value={profileForm.avatar_url}
                                            onChange={setProf('avatar_url')}
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                </Field>
                                {openSection === 'profile' && error && <FieldError>{error}</FieldError>}
                            </FieldGroup>

                            <Button type="submit" disabled={loading} className="w-full h-10 text-sm bg-primary hover:bg-primary/90 mt-2">
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Profile'}
                            </Button>
                        </form>
                    </m.div>
                )}
            </AnimatePresence>
        </div>


        {/* --- Accordion 2: Update Security --- */}
        <div className="border border-sidebar-border rounded-xl overflow-hidden">
            <button 
                onClick={() => toggleSection('security')}
                className="w-full flex items-center justify-between p-3 bg-sidebar hover:bg-sidebar-accent transition-colors"
            >
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <ShieldCheck size={18} />
                    <span>Update Security</span>
                </div>
                {openSection === 'security' ? <ChevronDown size={18} className="text-muted-foreground"/> : <ChevronRight size={18} className="text-muted-foreground"/>}
            </button>
            
            <AnimatePresence>
                {openSection === 'security' && (
                    <m.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleChangePassword} className="space-y-3 p-4 pt-2 border-t border-sidebar-border bg-sidebar/50">
                        <FieldGroup>
                            {/* Current Password */}
                            <Field>
                              <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    id="current-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Current Password"
                                    value={passForm.currentPassword}
                                    onChange={setPass('currentPassword')}
                                    className="pl-10 pr-10"
                                    disabled={loading}
                                    autoComplete="current-password"
                                    required
                                  />
                                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                              </div>
                            </Field>

                            {/* New Password */}
                            <Field>
                              <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    id="new-password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="New Password"
                                    value={passForm.newPassword}
                                    onChange={setPass('newPassword')}
                                    onFocus={() => setShowRequirements(true)}
                                    className="pl-10 pr-10"
                                    disabled={loading}
                                    autoComplete="new-password"
                                    required
                                  />
                                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                              </div>

                              {/* Password Requirements UI */}
                              {showRequirements && (passForm.newPassword).length > 0 && (
                                  <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1.5">
                                  {passwordRequirements.map((req, index) => {
                                      const met = req.test(passForm.newPassword)
                                      return (
                                      <m.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className={`flex items-center gap-2 text-xs ${met ? 'text-primary' : 'text-muted-foreground'}`}>
                                          {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                          {req.label}
                                      </m.div>
                                      )
                                  })}
                                  </m.div>
                              )}
                            </Field>

                            {/* Confirm Password */}
                            <Field>
                              <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm New Password"
                                    value={passForm.confirmPassword}
                                    onChange={setPass('confirmPassword')}
                                    className="pl-10 pr-10"
                                    disabled={loading}
                                    required
                                  />
                                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                              </div>
                            </Field>
                            {openSection === 'security' && error && <FieldError>{error}</FieldError>}
                        </FieldGroup>

                        <Button type="submit" disabled={loading} className="w-full h-10 text-sm bg-primary hover:bg-primary/90 mt-2">
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Update Password'}
                        </Button>
                        </form>
                    </m.div>
                )}
            </AnimatePresence>
        </div>

      </div>

      {/* --- Footer / Sign Out --- */}
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <button
          onClick={() => signout()}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-semibold"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}