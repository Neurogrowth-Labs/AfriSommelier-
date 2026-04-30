import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Grape, Utensils, Compass, ArrowRight, Loader2, Sparkles, MapPin, 
  Briefcase, Hotel, ChevronRight, Check, AlertCircle, Mail, Lock, LogIn, UserPlus, User
} from 'lucide-react';
import { supabase, loginWithEmail, registerWithEmail } from '../supabase';

const identities = [
  { id: 'explorer', label: 'Wine Explorer', icon: <Grape className="w-6 h-6" /> },
  { id: 'dining', label: 'Fine Dining Enthusiast', icon: <Utensils className="w-6 h-6" /> },
  { id: 'investor', label: 'Investor / Collector', icon: <Briefcase className="w-6 h-6" /> },
  { id: 'hospitality', label: 'Hospitality Professional', icon: <Hotel className="w-6 h-6" /> },
];

const flavors = [
  { id: 'citrus', label: 'Citrus', emoji: '🍋' },
  { id: 'spice', label: 'Spice', emoji: '🌶️' },
  { id: 'chocolate', label: 'Chocolate', emoji: '🍫' },
  { id: 'floral', label: 'Floral', emoji: '🌸' },
  { id: 'berry', label: 'Dark Berries', emoji: '🍇' },
  { id: 'oak', label: 'Toasted Oak', emoji: '🪵' },
];

const regions = [
  { id: 'za', label: 'South Africa', flag: '🇿🇦' },
  { id: 'ma', label: 'Morocco', flag: '🇲🇦' },
  { id: 'et', label: 'Ethiopia', flag: '🇪🇹' },
  { id: 'ng', label: 'Nigeria', flag: '🇳🇬' },
  { id: 'ke', label: 'Kenya', flag: '🇰🇪' },
];

const interests = [
  { id: 'tastings', label: 'Wine Tastings', emoji: '🍷' },
  { id: 'travel', label: 'Luxury Travel', emoji: '✈️' },
  { id: 'culinary', label: 'Culinary Experiences', emoji: '🍽️' },
  { id: 'networking', label: 'Networking Events', emoji: '🤝' },
  { id: 'wellness', label: 'Wellness & Retreats', emoji: '🌿' },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const totalSteps = 9;

  const [answers, setAnswers] = useState({
    identity: '',
    flavors: [] as string[],
    regions: [] as string[],
    interests: [] as string[]
  });
  
  const [sliders, setSliders] = useState({
    sweetDry: 50,
    lightFull: 50,
    fruityEarthy: 50
  });

  const [isSaving, setIsSaving] = useState(false);
  const [aiTyping, setAiTyping] = useState('');

  // Auth local state for step 7
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginOnly, setIsLoginOnly] = useState(false);

  const proceed = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const back = () => {
    if (step === 7 && isLoginOnly) {
      setIsLoginOnly(false);
      setStep(0);
    } else {
      setStep(s => Math.max(s - 1, 0));
    }
  };

  useEffect(() => {
    if (step === 5) {
      setAiTyping('');
      const msg = "Try a bold South African Shiraz with spice balance to complement the rich tomato base.";
      let i = 0;
      const t = setInterval(() => {
        setAiTyping(msg.substring(0, i));
        i++;
        if (i > msg.length + 5) clearInterval(t);
      }, 40);
      return () => clearInterval(t);
    }
  }, [step]);

  const saveProfileAndProceed = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        identity: answers.identity,
        flavors: answers.flavors,
        regions: answers.regions,
        interests: answers.interests,
        sweet_dry: sliders.sweetDry.toString(),
        light_full: sliders.lightFull.toString(),
        fruity_earthy: sliders.fruityEarthy.toString(),
        taste_dna: {
           Boldness: sliders.lightFull,
           Tannin: 50,
           Sweetness: 100 - sliders.sweetDry,
           Acidity: 60,
           Fruitiness: 100 - sliders.fruityEarthy,
           Earthiness: sliders.fruityEarthy
        },
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        console.error("Error saving profile:", error);
      }
      // Skip the Auth step if logged in
      setStep(8);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setAuthError(null);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      await saveProfileAndProceed();
    } catch (error: any) {
      console.error("Auth failed:", error);
      let msg = error.message || 'An error occurred.';
      if (msg.includes('security purposes') || msg.includes('after') || msg.toLowerCase().includes('rate limit')) {
        msg = `Supabase rate limit: ${msg}. Please wait or disable rate limits in your Supabase Auth settings.`;
      }
      setAuthError(msg);
      setIsSaving(false);
    }
  };

  const handleNextClick = async () => {
    if (step === 6) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await saveProfileAndProceed();
      } else {
        proceed();
      }
    } else if (step === 8) {
      onComplete();
    } else if (step !== 7 && step !== 0) {
      proceed();
    }
  };

  const toggleArrayItem = (key: 'flavors'|'regions'|'interests', id: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter(x => x !== id) : [...prev[key], id]
    }));
  };

  const getSliderFeedback = () => {
    const { sweetDry, lightFull, fruityEarthy } = sliders;
    if (sweetDry < 40 && lightFull > 60) return "You might enjoy a bold South African Pinotage or robust Cabernet Sauvignon.";
    if (sweetDry > 60 && fruityEarthy < 40) return "A luscious Late Harvest Chenin Blanc seems perfect for you.";
    if (lightFull < 40 && fruityEarthy < 40) return "Crisp, earthy Moroccan whites or a dry Rosé might be your ideal match.";
    return "We're dynamically building a vibrant, balanced Taste DNA Profile just for you.";
  };

  const renderWelcome = () => (
    <motion.div 
      key="step-0"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-6 z-20 text-center"
    >
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80" 
          alt="Vineyard" 
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-950 via-wine-900/60 to-transparent"></div>
      </div>
      <div className="relative z-10 w-full max-w-lg">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-5xl font-serif font-bold text-ivory mb-4"
        >
          Discover Africa Through Taste.
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-gray-300 text-lg mb-10 font-serif"
        >
          AI-powered wine, food, and culture experiences curated for you.
        </motion.p>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-4">
          <button 
            onClick={proceed}
            className="w-full py-4 rounded-xl bg-gold-500 text-wine-900 font-semibold text-lg hover:bg-gold-400 transition-colors shadow-[0_0_30px_rgba(198,169,107,0.3)] shadow-gold-500/20"
          >
            Begin Your Journey
          </button>
          <button 
            onClick={() => { setIsLogin(true); setIsLoginOnly(true); setStep(7); }}
            className="w-full py-4 text-gray-300 font-medium hover:text-ivory transition-colors"
          >
            Already have an account? Log In
          </button>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderIdentity = () => (
    <div className="w-full max-w-lg">
      <h2 className="text-3xl font-serif text-ivory mb-2">Your Wine Journey</h2>
      <p className="text-gray-400 mb-8 font-serif italic text-lg">How would you describe your relationship with wine?</p>
      <div className="space-y-4">
        {identities.map(i => (
          <button
            key={i.id}
            onClick={() => { setAnswers({ ...answers, identity: i.id }); setTimeout(proceed, 400); }}
            className={`w-full p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${
              answers.identity === i.id 
                ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[0_0_15px_rgba(198,169,107,0.15)] scale-[1.02]' 
                : 'bg-glass border-glass-border hover:bg-glass-hover hover:border-gold-500/30'
            }`}
          >
            <div className={`p-3 rounded-xl ${answers.identity === i.id ? 'bg-gold-500/20' : 'bg-wine-900/50'}`}>
              {i.icon}
            </div>
            <span className="font-medium text-lg flex-1 text-left">{i.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSliders = () => (
    <div className="w-full max-w-lg">
      <h2 className="text-3xl font-serif text-ivory mb-2">Structure & Balance</h2>
      <p className="text-gray-400 mb-8 font-serif italic text-lg">Define the structure of your ideal pour.</p>
      
      <div className="space-y-10">
        {[
          { key: 'sweetDry', left: 'Sweet', right: 'Dry', color: 'bg-rose-400', emojiLeft: '🍯', emojiRight: '🍂' },
          { key: 'lightFull', left: 'Light', right: 'Full-bodied', color: 'bg-purple-500', emojiLeft: '🍃', emojiRight: '🍷' },
          { key: 'fruityEarthy', left: 'Fruity', right: 'Earthy', color: 'bg-stone-500', emojiLeft: '🍒', emojiRight: '🍄' },
        ].map(slider => {
          const val = (sliders as any)[slider.key];
          return (
            <div key={slider.key} className="glass-panel p-6 rounded-2xl border border-glass-border relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${slider.color.replace('bg-', '')}, transparent)` }}></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <div className={`flex flex-col items-center gap-1 transition-opacity ${val < 50 ? 'opacity-100' : 'opacity-50'}`}>
                    <span className="text-2xl">{slider.emojiLeft}</span>
                    <span className="text-sm font-medium text-ivory">{slider.left}</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1 transition-opacity ${val > 50 ? 'opacity-100' : 'opacity-50'}`}>
                    <span className="text-2xl">{slider.emojiRight}</span>
                    <span className="text-sm font-medium text-ivory">{slider.right}</span>
                  </div>
                </div>
                
                <div className="relative h-3 bg-black/40 rounded-full border border-white/10 shadow-inner">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-600 to-gold-400 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)] pointer-events-none" style={{ width: `${val}%` }}></div>
                  <input
                    type="range"
                    min="0" max="100"
                    value={val}
                    onChange={e => setSliders(s => ({ ...s, [slider.key]: parseInt(e.target.value) }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute top-1/2 -mt-3 w-6 h-6 bg-white rounded-full border-2 border-gold-500 shadow-xl pointer-events-none transition-transform group-hover:scale-110 flex items-center justify-center" style={{ left: `calc(${val}% - 12px)` }}>
                    <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <motion.div 
        key={getSliderFeedback()}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 p-6 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-start gap-4 shadow-[0_0_30px_rgba(212,175,55,0.1)]"
      >
        <Sparkles className="w-6 h-6 text-gold-400 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-gold-100 text-sm leading-relaxed font-serif tracking-wide">{getSliderFeedback()}</p>
      </motion.div>
    </div>
  );

  const renderFlavors = () => (
    <div className="w-full max-w-lg">
      <h2 className="text-3xl font-serif text-ivory mb-2">Tasting Notes</h2>
      <p className="text-gray-400 mb-8 font-serif italic text-lg">Which primary profiles do you seek in a glass?</p>
      <div className="grid grid-cols-2 gap-4">
        {flavors.map(f => {
          const isSelected = answers.flavors.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggleArrayItem('flavors', f.id)}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-300 ${
                isSelected 
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[0_0_15px_rgba(198,169,107,0.15)] scale-[1.02]' 
                  : 'bg-glass border-glass-border hover:bg-glass-hover hover:border-gold-500/30'
              }`}
            >
              <span className="text-4xl">{f.emoji}</span>
              <span className="font-medium">{f.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderRegions = () => (
    <div className="w-full max-w-lg">
      <h2 className="text-3xl font-serif text-ivory mb-2">Continental Identity</h2>
      <p className="text-gray-400 mb-8 font-serif italic text-lg">Which regions excite you?</p>
      <div className="space-y-3">
        {regions.map(r => {
          const isSelected = answers.regions.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => toggleArrayItem('regions', r.id)}
              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${
                isSelected 
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400' 
                  : 'bg-glass border-glass-border hover:bg-glass-hover'
              }`}
            >
              <span className="text-3xl">{r.flag}</span>
              <span className="font-medium text-lg flex-1 text-left">{r.label}</span>
              {isSelected && <Check className="w-5 h-5 text-gold-500" />}
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderAIIntro = () => (
    <div className="w-full max-w-lg text-center">
      <div className="w-24 h-24 rounded-full bg-gold-500/20 border border-gold-500/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(198,169,107,0.2)]">
        <Sparkles className="w-12 h-12 text-gold-400" />
      </div>
      <h2 className="text-3xl font-serif text-ivory mb-2">Meet Your AfriSommelier</h2>
      <p className="text-gray-400 mb-10 font-serif text-lg">Refined, warm, knowledgeable.</p>
      
      <div className="bg-glass border border-glass-border rounded-xl p-4 space-y-4 text-left">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-wine-800 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-gray-300" />
          </div>
          <div className="bg-wine-900/50 p-3 rounded-2xl rounded-tl-none border border-glass-border text-sm text-ivory">
            What wine pairs with proper spicy Jollof rice?
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-gold-500" />
          </div>
          <div className="bg-gold-500/10 p-3 rounded-2xl rounded-tl-none border border-gold-500/30 text-sm text-gold-100 flex-1 min-h-[44px]">
            {aiTyping}
            {aiTyping.length < 80 && <span className="animate-pulse">|</span>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="w-full max-w-lg">
      <h2 className="text-3xl font-serif text-ivory mb-2">Experience Personalization</h2>
      <p className="text-gray-400 mb-8 font-serif italic text-lg">Beyond the glass.</p>
      <div className="space-y-3">
        {interests.map(i => {
          const isSelected = answers.interests.includes(i.id);
          return (
            <button
              key={i.id}
              onClick={() => toggleArrayItem('interests', i.id)}
              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${
                isSelected 
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400' 
                  : 'bg-glass border-glass-border hover:bg-glass-hover'
              }`}
            >
              <span className="text-2xl">{i.emoji}</span>
              <span className="font-medium flex-1 text-left">{i.label}</span>
              {isSelected && <Check className="w-5 h-5 text-gold-500" />}
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderAuth = () => (
    <div className="w-full max-w-lg">
      <h2 className="text-4xl font-serif text-ivory mb-2 text-center">
        {isLoginOnly ? 'Log In to Your Cellar' : 'Open Your Cellar'}
      </h2>
      <p className="text-gray-400 mb-8 font-serif italic text-lg text-center">
        {isLoginOnly ? 'Welcome back to your curated experience.' : 'Your preferences unlock a fully curated experience.'}
      </p>
      
      <div className="bg-glass border border-glass-border rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left">
        {!isLoginOnly && (
          <div className="flex mb-6 bg-wine-900/50 rounded-xl p-1 relative z-10">
            <button
              onClick={() => { setIsLogin(false); setAuthError(null); }}
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                !isLogin ? 'bg-gold-500/20 text-gold-400 shadow-sm' : 'text-gray-400 hover:text-ivory'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => { setIsLogin(true); setAuthError(null); }}
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                isLogin ? 'bg-gold-500/20 text-gold-400 shadow-sm' : 'text-gray-400 hover:text-ivory'
              }`}
            >
              Log In
            </button>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-wine-900/50 border border-glass-border rounded-xl text-ivory placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                className="block w-full pl-11 pr-4 py-3.5 bg-wine-900/50 border border-glass-border rounded-xl text-ivory placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{authError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-gold-500 text-wine-900 font-medium py-4 rounded-xl hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(198,169,107,0.2)] mt-6 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" />
                Sign In to Cellar
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderCelebration = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20 text-center bg-wine-900">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23c6a96b\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
      <div className="relative z-10 w-full max-w-lg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-32 h-32 rounded-full bg-gold-500/20 border-2 border-gold-500/50 flex flex-col items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(198,169,107,0.3)] relative"
        >
          <Compass className="w-12 h-12 text-gold-400 mb-1" />
          <span className="text-xs text-gold-500 font-bold tracking-widest uppercase">Badge</span>
          <div className="absolute -bottom-3 bg-wine-900 border border-gold-500 px-3 py-1 rounded-full text-gold-400 text-xs font-bold shadow-lg">
            FIRST SIP
          </div>
        </motion.div>
        
        <motion.h2 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-4xl font-serif text-ivory mb-4"
        >
          Taste Passport Unlocked
        </motion.h2>
        <motion.p 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-gray-300 font-serif text-xl mb-10"
        >
          Your taste journey begins now.
        </motion.p>
        
        <motion.button
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
          onClick={handleNextClick}
          className="w-full py-4 rounded-xl bg-gold-500 text-wine-900 font-semibold text-lg hover:bg-gold-400 transition-colors shadow-[0_0_30px_rgba(198,169,107,0.3)] shadow-gold-500/20 group flex items-center justify-center gap-2"
        >
          Enter Your Cellar
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderWelcome();
      case 1: return renderIdentity();
      case 2: return renderSliders();
      case 3: return renderFlavors();
      case 4: return renderRegions();
      case 5: return renderAIIntro();
      case 6: return renderInterests();
      case 7: return renderAuth();
      case 8: return renderCelebration();
      default: return null;
    }
  };

  const showHeader = step !== 0 && step !== 8;

  return (
    <div className="min-h-screen bg-wine-900 flex flex-col items-center justify-center relative overflow-hidden selection:bg-gold-500/30">
      {/* Background Ambience */}
      {showHeader && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-wine-800 to-wine-900 z-0"></div>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[100px] z-0 pointer-events-none transition-all duration-1000 delay-300" style={{ transform: `translate(-50%, ${step * 5}px)` }}></div>
        </>
      )}

      {showHeader && (
        <div className="absolute top-0 inset-x-0 p-6 z-20">
          <div className="max-w-lg mx-auto">
            {/* Progress Bar */}
            <div className="flex justify-between gap-1 mb-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div 
                  key={i} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    step >= i ? 'bg-gold-500 shadow-[0_0_10px_rgba(198,169,107,0.5)]' : 'bg-glass-border'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center text-sm font-serif text-gray-400">
              <button 
                onClick={back}
                className="hover:text-ivory transition-colors disabled:opacity-0"
                disabled={step === 1 || (step === 7 && !isLoginOnly)}
              >
                Back
              </button>
              <span className="text-gold-500 font-medium">Step {Math.min(step, 6)} of 6</span>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: step === 0 || step === 8 ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step === 0 || step === 8 ? 0 : -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 w-full flex justify-center px-6"
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>

      {showHeader && step !== 7 && (
        <div className="absolute bottom-0 inset-x-0 p-6 z-20 bg-gradient-to-t from-wine-900 via-wine-900 to-transparent">
          <div className="max-w-lg mx-auto flex justify-end">
            <button
              onClick={handleNextClick}
              disabled={isSaving || (step === 1 && !answers.identity)}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium bg-gold-500 text-wine-900 hover:bg-gold-400 shadow-[0_0_20px_rgba(198,169,107,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
              {!isSaving && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
