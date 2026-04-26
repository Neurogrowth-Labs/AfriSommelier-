import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, Heart, Share, Star, Leaf, Activity, Droplet, Edit3, Check, ShoppingCart, Music, Image as ImageIcon, Loader2, Tag } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase, toSnake } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../utils/supabaseErrorHandler';
import LogGlassModal from './LogGlassModal';

export default function WineDetail({ wine, onClose }: { wine: any, onClose: () => void }) {
  const { user } = useUser();
  const supabase = useSupabase();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistDocId, setWishlistDocId] = useState<string | null>(null);
  const [personalNotes, setPersonalNotes] = useState(wine.personalNotes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showLogGlass, setShowLogGlass] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
  const [showCouponInput, setShowCouponInput] = useState(false);

  useEffect(() => {
    const checkWishlist = async () => {
      if (!user || !wine.name) return;
      try {
        const { data, error } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', wine.name)
          .limit(1);
        if (error) throw error;
        if (data && data.length > 0) {
          setIsWishlisted(true);
          setWishlistDocId(data[0].id);
        } else {
          setIsWishlisted(false);
          setWishlistDocId(null);
        }
      } catch (error) {
        console.error('Error checking wishlist:', error);
      }
    };
    checkWishlist();
  }, [wine.name, user, supabase]);

  const toggleWishlist = async () => {
    if (!user) return;
    setIsLiking(true);

    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      if (isWishlisted && wishlistDocId) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('name', wine.name);
        if (error) throw error;
        setIsWishlisted(false);
        setWishlistDocId(null);
      } else {
        // Whitelist only columns that exist on the wishlist table.
        const snake = toSnake(wine ?? {});
        const allowed = new Set([
          'name', 'vintage', 'region', 'grape', 'price', 'reason',
          'notes', 'personal_notes', 'image', 'image_url',
        ]);
        const payload: Record<string, unknown> = {
          user_id: user.id,
          added_at: new Date().toISOString(),
          name: wine?.name,
        };
        for (const [k, v] of Object.entries(snake)) {
          if (allowed.has(k) && v !== undefined) payload[k] = v;
        }
        const { data, error } = await supabase
          .from('wishlist')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setIsWishlisted(true);
        setWishlistDocId(data?.id ?? null);

        // Track event
        console.log('Event logged:', {
          event: 'like_wine',
          wine_id: wine.id || wine.name,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      handleSupabaseError(
        error,
        isWishlisted ? OperationType.DELETE : OperationType.CREATE,
        'wishlist',
        user.id
      );
    } finally {
      setTimeout(() => setIsLiking(false), 300);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Discover ${wine.name} on AfriSommelier`,
      text: `Check out this amazing wine: ${wine.name} from ${wine.region || 'South Africa'}.`,
      url: `${window.location.origin}/share?wine_id=${wine.id || encodeURIComponent(wine.name)}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleBuy = () => {
    // Track event
    console.log("Event logged:", {
      event: "buy_now_click",
      wine_id: wine.id || wine.name,
      user_id: user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
    
    // In a real app, this would open a checkout modal or redirect to a partner
    alert(`Redirecting to partner retailer to purchase ${wine.name}...`);
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'SOMMELIER10') {
      setDiscountPercent(0.10);
      setCouponMessage({ text: '10% discount applied!', type: 'success' });
    } else if (code === 'VINTAGE20') {
      setDiscountPercent(0.20);
      setCouponMessage({ text: '20% discount applied!', type: 'success' });
    } else {
      setDiscountPercent(0);
      setCouponMessage({ text: 'Invalid coupon code', type: 'error' });
    }
  };

  const priceString = wine.price || 'R 950';
  const numericPriceMatch = priceString.match(/[\d,.]+/);
  const numericPrice = numericPriceMatch ? parseFloat(numericPriceMatch[0].replace(/,/g, '')) : 0;
  const currencySymbol = priceString.replace(/[\d,.\s]/g, '') || 'R ';
  const discountedPrice = numericPrice > 0 ? numericPrice * (1 - discountPercent) : 0;
  const displayPrice = discountPercent > 0 && numericPrice > 0
    ? `${currencySymbol} ${discountedPrice.toFixed(2).replace(/\.00$/, '')}`
    : priceString;

  const saveNotes = async () => {
    if (!user || !wine.id) return;
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('cellar')
        .update({ personal_notes: personalNotes })
        .eq('id', wine.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      handleSupabaseError(error, OperationType.UPDATE, `cellar/${wine.id}`, user.id);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const generateMusic = async () => {
    alert("Audio generation (Lyria) is currently not supported via the OpenRouter text-only API integration.");
  };

  const generateImage = async () => {
    alert("Image generation (Imagen) is currently not supported via the OpenRouter text-only API integration.");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[60] bg-wine-900/90 overflow-y-auto hide-scrollbar backdrop-blur-sm"
    >
     <div className="w-full max-w-3xl mx-auto bg-wine-900 min-h-screen relative shadow-2xl">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-3">
          <motion.button 
            onClick={toggleWishlist}
            animate={isLiking ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-colors ${isWishlisted ? 'text-pink-500 hover:bg-black/60' : 'text-white hover:bg-black/60'}`}
          >
            <Heart size={20} className={isWishlisted ? 'fill-pink-500' : ''} />
          </motion.button>
          <button onClick={handleShare} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
            <Share size={20} />
          </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="h-[60vh] relative">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          src={wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop"} 
          alt={wine.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-900 via-wine-900/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-32 relative z-10 pb-32">
        <div className="flex items-center gap-2 mb-3">
          {wine.rating && (
            <div className="bg-gold-500 text-wine-900 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
              <Star size={12} className="fill-wine-900" /> {wine.rating}
            </div>
          )}
          {wine.awards && (
            <div className="bg-white/10 border border-white/20 text-ivory px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              🏆 {wine.awards}
            </div>
          )}
          <span className="text-gold-500 text-sm font-medium">{wine.match || '95%'} Match for you</span>
        </div>

        <h1 className="text-4xl font-serif font-semibold mb-1">{wine.name}</h1>
        <p className="text-gray-400 font-serif italic mb-8">{wine.region || 'Stellenbosch'}, {wine.vintage || '2019'}</p>

        {/* AI Summary / Tasting Notes */}
        <div className="glass-panel p-6 mb-8">
          <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-2">Tasting Notes & Insights</h3>
          <p className="text-lg font-serif leading-relaxed">
            "{wine.notes || wine.recommendationReason || "Bold, smoky, with hints of blackberry and cedar. It perfectly matches your preference for full-bodied reds with structured tannins."}"
          </p>
        </div>

        {/* AI Features */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Star size={20} className="text-gold-500" />
            AI Experiences
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              {musicUrl ? (
                <audio controls src={musicUrl} className="w-full h-10" />
              ) : (
                <button 
                  onClick={generateMusic}
                  disabled={isGeneratingMusic}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 text-gold-500 hover:text-gold-400 transition-colors disabled:opacity-50"
                >
                  {isGeneratingMusic ? <Loader2 size={24} className="animate-spin" /> : <Music size={24} />}
                  <span className="text-sm font-medium">{isGeneratingMusic ? 'Composing...' : 'Generate Vibe Music'}</span>
                </button>
              )}
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              {generatedImageUrl ? (
                <img src={generatedImageUrl} alt="Visualized Wine" className="w-full h-24 object-cover rounded-lg" />
              ) : (
                <button 
                  onClick={generateImage}
                  disabled={isGeneratingImage}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 text-gold-500 hover:text-gold-400 transition-colors disabled:opacity-50"
                >
                  {isGeneratingImage ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                  <span className="text-sm font-medium">{isGeneratingImage ? 'Visualizing...' : 'Visualize Flavor'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wellness & Health */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-gold-500" />
            Wellness & Health
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <Droplet size={20} className="text-blue-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">ABV</p>
              <p className="font-medium text-ivory">{wine.abv || '13.5%'}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <Activity size={20} className="text-orange-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Calories</p>
              <p className="font-medium text-ivory">{wine.caloriesPerGlass || '120'} <span className="text-[10px] text-gray-500">/glass</span></p>
            </div>
            <div className={`glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center ${wine.isOrganic ? 'border border-green-500/30 bg-green-500/5' : ''}`}>
              <Leaf size={20} className={wine.isOrganic ? 'text-green-400 mb-2' : 'text-gray-500 mb-2'} />
              <p className="text-xs text-gray-400 mb-1">Farming</p>
              <p className={`font-medium ${wine.isOrganic ? 'text-green-400' : 'text-ivory'}`}>
                {wine.isOrganic ? 'Organic' : 'Standard'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowLogGlass(true)}
            className="w-full mt-4 py-3 rounded-xl border border-gold-500/30 text-gold-500 font-medium hover:bg-gold-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <Droplet size={16} />
            Log a Glass
          </button>
        </div>

        {/* Personal Notes */}
        {wine.id && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">My Tasting Notes</h3>
              {!isEditingNotes ? (
                <button 
                  onClick={() => setIsEditingNotes(true)}
                  className="text-gold-500 hover:text-gold-400 flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  <Edit3 size={16} /> Edit
                </button>
              ) : (
                <button 
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                  className="text-green-400 hover:text-green-300 flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Check size={16} /> {isSavingNotes ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
            
            {isEditingNotes ? (
              <textarea
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Add your personal tasting notes, memories, or pairing ideas here..."
                className="w-full h-32 bg-glass border border-gold-500/50 rounded-xl p-4 text-ivory placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all resize-none"
              />
            ) : (
              <div 
                className="w-full min-h-[5rem] bg-glass border border-glass-border rounded-xl p-4 text-gray-300 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsEditingNotes(true)}
              >
                {personalNotes ? (
                  <p className="whitespace-pre-wrap">{personalNotes}</p>
                ) : (
                  <p className="text-gray-500 italic">Tap to add your personal tasting notes...</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Taste Graph */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6">Taste Profile</h3>
          <div className="space-y-4">
            <TasteBar label="Boldness" value={90} />
            <TasteBar label="Tannin" value={85} />
            <TasteBar label="Sweetness" value={15} />
            <TasteBar label="Acidity" value={60} />
            <TasteBar label="Fruit" value={75} />
          </div>
        </div>

        {/* Pairings */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6">Perfect Pairings</h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 -mx-6 px-6">
            <PairingCard food="Braai Ribeye" image="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop" />
            <PairingCard food="Aged Cheddar" image="https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=400&auto=format&fit=crop" />
            <PairingCard food="Venison" image="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop" />
          </div>
        </div>

        {/* Buy Section */}
        <div className="mb-12 mt-4 glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-400">Best Price</p>
              <div className="flex flex-wrap items-center gap-2">
                {discountPercent > 0 ? (
                  <>
                    <span className="text-lg text-gray-500 line-through">{priceString}</span>
                    <span className="text-2xl font-serif font-semibold text-green-400">{displayPrice}</span>
                  </>
                ) : (
                  <span className="text-2xl font-serif font-semibold text-gold-500">{priceString}</span>
                )}
              </div>
            </div>
            <button 
              onClick={handleBuy}
              className="bg-gold-500 text-wine-900 font-medium py-3 px-6 rounded-xl hover:scale-[0.98] transition-transform flex items-center gap-2 flex-shrink-0"
            >
              <ShoppingCart size={18} />
              Buy Now
            </button>
          </div>

          <div className="pt-4 border-t border-glass-border">
            {!showCouponInput ? (
              <button 
                onClick={() => setShowCouponInput(true)} 
                className="text-sm text-gold-500 hover:text-gold-400 flex items-center gap-1 transition-colors"
              >
                <Tag size={14} /> Have a discount code?
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. VINTAGE20)"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponMessage({ text: '', type: '' });
                    }}
                    className="flex-1 bg-wine-900/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500/50 uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-white/10 hover:bg-white/20 text-ivory text-sm px-4 py-2 rounded-lg transition-colors border border-glass-border whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage.text && (
                  <p className={`text-xs ${couponMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    {couponMessage.text}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLogGlass && (
          <LogGlassModal wine={wine} onClose={() => setShowLogGlass(false)} />
        )}
      </AnimatePresence>
     </div>
    </motion.div>
  );
}

function TasteBar({ label, value }: { label: string, value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-300">{label}</span>
      </div>
      <div className="h-2 bg-glass rounded-full overflow-hidden">
        <div className="h-full bg-gold-500 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PairingCard({ food, image }: any) {
  return (
    <div className="min-w-[140px] relative rounded-2xl overflow-hidden aspect-square shrink-0">
      <img src={image} alt={food} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4">
        <p className="font-serif font-medium">{food}</p>
      </div>
    </div>
  );
}
