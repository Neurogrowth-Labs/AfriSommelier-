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
      
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === 'simao@neurogrowthlabs.co.za') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: cleanEmail,
            first_name: 'Simão',
            identity: 'Investor / Collector',
            role: 'super_admin',
            sweet_dry: '30',
            light_full: '80',
            fruity_earthy: '50',
            taste_dna: {
              Boldness: 80,
              Tannin: 80,
              Sweetness: 30,
              Acidity: 70,
              Fruitiness: 50,
              Earthiness: 50
            },
            created_at: new Date().toISOString()
          }, { onConflict: 'id' });
        }
        setIsSaving(false);
        onComplete();
        return;
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
      className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20 text-center"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C] to-[#09090A] z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />
      </div>
      
      <div className="relative z-10 w-full max-w-md px-1 select-none">
        {/* Fine gold border badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 mb-4 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          <span className="text-[9px] tracking-[0.2em] font-sans text-gold-400 font-semibold uppercase">AfriSommelier Estate</span>
        </motion.div>

        {/* Elegant wine glasses visual descriptor */}
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-2xl md:text-3.5xl font-serif font-bold text-ivory mb-2 leading-tight tracking-tight px-1"
        >
          Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300">African Terroir</span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-gray-400 text-xs md:text-sm mb-5 font-serif leading-relaxed italic max-w-sm mx-auto"
        >
          "An AI-designed sommelier mapping, unlocking winemaking heritage, perfect pairings and investment-grade cellar yields."
        </motion.p>

        {/* Elegant 4 winemaking stages highlight card list */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-wine-950/60 border border-white/5 p-4 rounded-xl mb-6 text-left space-y-3"
        >
          <div className="text-[10px] font-mono tracking-[0.15em] text-gold-450 uppercase border-b border-white/5 pb-1.5 mb-1 text-center font-bold">
            The 4 Winemaking Stages
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex gap-2 items-start">
              <span className="text-sm">🌾</span>
              <div>
                <h4 className="text-[11px] font-bold text-ivory">1. Harvest & Select</h4>
                <p className="text-[9px] text-gray-400">Handpicking peak African fruit.</p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-sm">🍇</span>
              <div>
                <h4 className="text-[11px] font-bold text-ivory">2. Crush & Press</h4>
                <p className="text-[9px] text-gray-400">Separating skin & free-run juice.</p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-sm">🧪</span>
              <div>
                <h4 className="text-[11px] font-bold text-ivory">3. Fermentation</h4>
                <p className="text-[9px] text-gray-400">Cultivating yeasts and body structure.</p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-sm">🍾</span>
              <div>
                <h4 className="text-[11px] font-bold text-ivory">4. Aging & Bottle</h4>
                <p className="text-[9px] text-gray-400">Maturing in select oak vaults.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-3.5">
          <button 
            onClick={proceed}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-gold-600 to-gold-400 text-wine-950 font-serif font-bold text-base hover:from-gold-500 hover:to-gold-300 transition-all duration-350 shadow-[0_4px_22px_rgba(198,169,107,0.2)] active:scale-[0.99] tracking-wide"
          >
            Create Your Tasting DNA
          </button>
          <button 
            onClick={() => { setIsLogin(true); setIsLoginOnly(true); setStep(7); }}
            className="w-full py-1.5 text-[10px] tracking-widest uppercase font-mono text-gray-400 hover:text-gold-300 transition-colors"
          >
            Already registered? <span className="underline decoration-gold-500/40 hover:decoration-gold-500 underline-offset-4 font-bold">Log In</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderIdentity = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage I: Your Wine Journey</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">How would you describe your relationship with wine?</p>
      <div className="space-y-2">
        {identities.map(i => (
          <button
            key={i.id}
            onClick={() => { setAnswers({ ...answers, identity: i.id }); setTimeout(proceed, 400); }}
            className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
              answers.identity === i.id 
                ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[0_0_15px_rgba(198,169,107,0.12)] scale-[1.01]' 
                : 'bg-glass border-glass-border hover:bg-glass-hover hover:border-gold-500/20'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 [&_svg]:w-4 [&_svg]:h-4 ${answers.identity === i.id ? 'bg-gold-500/20 text-gold-400' : 'bg-white/5 text-gray-300'}`}>
              {i.icon}
            </div>
            <span className="font-medium text-sm flex-1 text-left">{i.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderSliders = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage II: Structure & Balance</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Define the structure of your ideal pour.</p>
      
      <div className="space-y-3">
        {[
          { key: 'sweetDry', left: 'Sweet', right: 'Dry', color: 'bg-rose-400', emojiLeft: '🍯', emojiRight: '🍂' },
          { key: 'lightFull', left: 'Light', right: 'Full-bodied', color: 'bg-purple-500', emojiLeft: '🍃', emojiRight: '🍷' },
          { key: 'fruityEarthy', left: 'Fruity', right: 'Earthy', color: 'bg-stone-500', emojiLeft: '🍒', emojiRight: '🍄' },
        ].map(slider => {
          const val = (sliders as any)[slider.key];
          return (
            <div key={slider.key} className="glass-panel p-3.5 rounded-xl border border-glass-border relative overflow-hidden group">
              <div className="absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10" style={{ background: `linear-gradient(90deg, transparent, ${slider.color.replace('bg-', '')}, transparent)` }}></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-2.5">
                  <div className={`flex items-center gap-1.5 transition-opacity ${val < 50 ? 'opacity-100' : 'opacity-40'}`}>
                    <span className="text-lg">{slider.emojiLeft}</span>
                    <span className="text-xs font-medium text-ivory">{slider.left}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-opacity ${val > 50 ? 'opacity-100' : 'opacity-40'}`}>
                    <span className="text-xs font-medium text-ivory">{slider.right}</span>
                    <span className="text-lg">{slider.emojiRight}</span>
                  </div>
                </div>
                
                <div className="relative h-2 bg-black/40 rounded-full border border-white/5 shadow-inner">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-600 to-gold-400 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.3)] pointer-events-none" style={{ width: `${val}%` }}></div>
                  <input
                    type="range"
                    min="0" max="100"
                    value={val}
                    onChange={e => setSliders(s => ({ ...s, [slider.key]: parseInt(e.target.value) }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute top-1/2 -mt-2 w-4 h-4 bg-white rounded-full border border-gold-500 shadow-xl pointer-events-none transition-transform group-hover:scale-110 flex items-center justify-center animate-pulse" style={{ left: `calc(${val}% - 8px)` }}>
                    <div className="w-1.5 h-1.5 bg-gold-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <motion.div 
        key={getSliderFeedback()}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-3.5 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-start gap-2.5 shadow-[0_0_20px_rgba(212,175,55,0.05)]"
      >
        <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-gold-100/90 text-xs leading-relaxed font-serif italic">{getSliderFeedback()}</p>
      </motion.div>
    </div>
  );

  const renderFlavors = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage III: Tasting Notes</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Which primary profiles do you seek in a glass?</p>
      <div className="grid grid-cols-3 gap-2">
        {flavors.map(f => {
          const isSelected = answers.flavors.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggleArrayItem('flavors', f.id)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                isSelected 
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[0_0_10px_rgba(198,169,107,0.1)]' 
                  : 'bg-glass border-glass-border hover:bg-glass-hover hover:border-gold-500/20'
              }`}
            >
              <span className="text-2xl">{f.emoji}</span>
              <span className="text-[11px] font-medium tracking-tight text-center">{f.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderRegions = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage III: Continental Regions</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Which heritage regions excite you?</p>
      <div className="space-y-1.5">
        {regions.map(r => {
          const isSelected = answers.regions.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => toggleArrayItem('regions', r.id)}
              className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
                isSelected 
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400' 
                  : 'bg-glass border-glass-border hover:bg-glass-hover hover:border-gold-500/20'
              }`}
            >
              <span className="text-2xl shrink-0">{r.flag}</span>
              <span className="font-medium text-sm flex-1 text-left">{r.label}</span>
              {isSelected ? (
                <Check className="w-4 h-4 text-gold-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-white/10" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderAIIntro = () => (
    <div className="w-full max-w-md text-center">
      <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(198,169,107,0.1)]">
        <Sparkles className="w-6 h-6 text-gold-400 animate-pulse" />
      </div>
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage IV: Meet Your AfriSommelier</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Refined, warm, deeply knowledgeable.</p>
      
      <div className="bg-glass border border-glass-border rounded-xl p-3 space-y-3 text-left">
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-gray-300" />
          </div>
          <div className="bg-[#151518]/50 p-2.5 rounded-xl rounded-tl-none border border-white/5 text-xs text-ivory">
            What wine pairs with proper spicy Jollof rice?
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <div className="bg-gold-500/5 p-2.5 rounded-xl rounded-tl-none border border-gold-500/20 text-xs text-gold-100 flex-1 min-h-[40px] leading-relaxed">
            {aiTyping}
            {aiTyping.length < 80 && <span className="animate-pulse">|</span>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage IV: Experience Personalization</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Beyond the glass.</p>
      <div className="space-y-1.5">
        {interests.map(i => {
          const isSelected = answers.interests.includes(i.id);
          return (
            <button
              key={i.id}
              onClick={() => toggleArrayItem('interests', i.id)}
              className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
                isSelected 
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400' 
                  : 'bg-glass border-glass-border hover:bg-glass-hover hover:border-gold-500/20'
              }`}
            >
              <span className="text-xl shrink-0">{i.emoji}</span>
              <span className="font-medium text-sm flex-1 text-left">{i.label}</span>
              {isSelected ? (
                <Check className="w-4 h-4 text-gold-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-white/10" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderAuth = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">
        {isLoginOnly ? 'Log In to Your Cellar' : 'Stage IV: Save Wine Passport'}
      </h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">
        {isLoginOnly ? 'Welcome back to your curated experience.' : 'Save your custom Taste DNA profile.'}
      </p>
      
      <div className="bg-glass border border-glass-border rounded-2xl p-4 md:p-5 shadow-2xl relative overflow-hidden text-left">
        {!isLoginOnly && (
          <div className="flex mb-4 bg-black/40 rounded-xl p-1 relative z-10">
            <button
              onClick={() => { setIsLogin(false); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                !isLogin ? 'bg-gold-500/20 text-gold-400 shadow-sm' : 'text-gray-400 hover:text-ivory'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => { setIsLogin(true); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                isLogin ? 'bg-gold-500/20 text-gold-400 shadow-sm' : 'text-gray-400 hover:text-ivory'
              }`}
            >
              Log In
            </button>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-300 mb-1 ml-1 font-bold">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-[#121215]/50 border border-white/5 rounded-xl text-sm text-ivory placeholder-gray-600 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all font-sans"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-300 mb-1 ml-1 font-bold">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                className="block w-full pl-10 pr-4 py-2 bg-[#121215]/50 border border-white/5 rounded-xl text-sm text-ivory placeholder-gray-600 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all font-sans"
                placeholder="••••••••"
              />
            </div>
          </div>

          {authError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-start gap-1.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{authError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-wine-950 font-semibold py-2.5 rounded-xl hover:bg-gold-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(198,169,107,0.15)] mt-4 disabled:opacity-50 text-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In to Cellar
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Configure Taste DNA
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderCelebration = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20 text-center bg-[#0B0B0C]">
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23c6a96b\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
      <div className="relative z-10 w-full max-w-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-24 h-24 rounded-full bg-gold-500/10 border border-gold-500/30 flex flex-col items-center justify-center mx-auto mb-6 shadow-[0_0_35px_rgba(198,169,107,0.15)] relative"
        >
          <Compass className="w-8 h-8 text-gold-400 mb-0.5" />
          <span className="text-[9px] text-gold-500 font-bold tracking-widest uppercase">Passport</span>
          <div className="absolute -bottom-2.5 bg-[#151518] border border-gold-500/50 px-3 py-0.5 rounded-full text-gold-400 text-[10px] font-bold shadow-lg">
            FIRST SIP
          </div>
        </motion.div>
        
        <motion.h2 
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-2xl font-serif text-ivory mb-2 font-semibold"
        >
          Taste Passport Unlocked
        </motion.h2>
        <motion.p 
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-gray-400 font-serif text-sm italic mb-6 max-w-xs mx-auto"
        >
          "Your custom wine tasting history and curation is ready for exploration."
        </motion.p>
        
        <motion.button
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
          onClick={handleNextClick}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-wine-950 font-semibold text-sm hover:from-gold-500 hover:to-gold-400 transition-all duration-300 shadow-[0_4px_20px_rgba(198,169,107,0.2)] hover:scale-[1.01] active:scale-[0.99] group flex items-center justify-center gap-2"
        >
          Enter Your Cellar
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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

  const winemakingStages = [
    { id: 1, tag: 'Harvest', name: '1. Harvest & Select', activeSteps: [1] },
    { id: 2, tag: 'Crush', name: '2. Crush & Press', activeSteps: [2] },
    { id: 3, tag: 'Ferment', name: '3. Ferment & Age', activeSteps: [3, 4] },
    { id: 4, tag: 'Bottle', name: '4. Blend & Bottle', activeSteps: [5, 6, 7] },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-ivory flex flex-col items-center justify-between relative overflow-hidden selection:bg-gold-500/30 font-sans py-4">
      {/* Background Ambience / Wine Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e11] to-[#08080a] z-0" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] md:w-[600px] md:h-[600px] bg-wine-500/5 rounded-full blur-[120px] z-0 pointer-events-none transition-all duration-1000" style={{ transform: `translate(-50%, ${step * 4}px)` }} />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-gold-500/5 rounded-full blur-[80px] z-0 pointer-events-none" />

      {showHeader && (
        <div className="w-full max-w-lg px-6 z-20 mt-2">
          {/* 4 Stages of Winemaking Visual Indicator */}
          <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/5 p-3 mb-3">
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-gold-400/80 mb-2.5 text-center font-bold">
              Winemaking Stage
            </div>
            <div className="flex items-center justify-between gap-1">
              {winemakingStages.map((stage, idx) => {
                const isActive = stage.activeSteps.includes(step);
                const isCompleted = stage.activeSteps.every(st => step > st) || 
                  (idx === 0 && step > 1) || 
                  (idx === 1 && step > 2) || 
                  (idx === 2 && step > 4);

                return (
                  <div key={stage.id} className="flex-1 flex flex-col items-center relative">
                    <div className="flex items-center w-full">
                      {idx > 0 && (
                        <div className={`h-[1px] flex-1 transition-all duration-500 ${isCompleted || isActive ? 'bg-gold-500' : 'bg-white/10'}`} />
                      )}
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-500 shrink-0 ${
                        isActive 
                          ? 'bg-gold-500 border-gold-400 text-wine-950 ring-4 ring-gold-500/20 scale-105' 
                          : isCompleted 
                            ? 'bg-gold-500/20 border-gold-500 text-gold-400' 
                            : 'bg-[#151518] border-white/5 text-gray-500'
                      }`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stage.id}
                      </div>
                      {idx < 3 && (
                        <div className={`h-[1px] flex-1 transition-all duration-500 ${isCompleted ? 'bg-gold-500' : 'bg-white/10'}`} />
                      )}
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider font-semibold mt-1 font-mono transition-colors duration-300 ${
                      isActive ? 'text-gold-400' : isCompleted ? 'text-gold-500/70' : 'text-gray-500'
                    }`}>
                      {stage.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-400">
            <button 
              onClick={back}
              className="hover:text-gold-400 transition-colors disabled:opacity-0 flex items-center gap-1 py-1 px-2 -ml-2 rounded-lg hover:bg-white/5"
              disabled={step === 1 || (step === 7 && !isLoginOnly)}
            >
              Back
            </button>
            <span className="text-gold-500 font-mono text-[11px] font-semibold tracking-wider">Step {Math.min(step, 6)}/6</span>
          </div>
        </div>
      )}

      {/* Main step view slot with tight layouts */}
      <div className="w-full flex-1 flex items-center justify-center overflow-y-auto max-w-lg px-6 my-4 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full flex justify-center py-2"
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showHeader && step !== 7 && (
        <div className="w-full max-w-lg px-6 pb-4 pt-1 z-20 flex justify-end">
          <button
            onClick={handleNextClick}
            disabled={isSaving || (step === 1 && !answers.identity)}
            className="flex items-center justify-center gap-2 w-full xs:w-auto px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-gold-600 to-gold-500 text-wine-950 hover:from-gold-500 hover:to-gold-400 shadow-[0_4px_20px_rgba(198,169,107,0.2)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] text-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
            {!isSaving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
