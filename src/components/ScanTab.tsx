import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Image as ImageIcon, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import ARScanner from './ARScanner';
import { callOpenRouter } from '../services/openRouterService';

export default function ScanTab({ onSelectWine }: { onSelectWine: (wine: any) => void }) {
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [scanResult, setScanResult] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAR, setShowAR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STAGES = [
    "Analyzing Bottle Shape...",
    "Reading Label...",
    "Identifying Producer...",
    "Checking Global Database...",
    "Matching Vintage...",
    "Generating Tasting Notes..."
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsScanning(false);
    setIsProcessing(true);
    setActiveStageIndex(0);

    // Dynamic processing stages timer ticking every 1.2s
    const interval = setInterval(() => {
      setActiveStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    try {
      // Convert file to base64 for vision API
      const base64Data = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => {
          const base64 = (r.result as string).split(',')[1];
          resolve(base64);
        };
        r.readAsDataURL(file);
      });

      const systemPrompt = `You are a sommelier handling wine label or menu analysis. You must return your response strictly as a JSON object.
Structure:
{
  "type": "string ('label' or 'menu')",
  "wines": [
    {
      "name": "string",
      "vintage": "string",
      "region": "string",
      "grape": "string",
      "notes": "string",
      "price": "string",
      "rating": number,
      "awards": "string",
      "abv": "string",
      "isOrganic": boolean,
      "caloriesPerGlass": number,
      "match": "string",
      "recommendationReason": "string"
    }
  ]
}
For a single wine label, extract its details. For a restaurant menu, extract the 3 best wine options based on quality and value.`;

      const responseText = await callOpenRouter({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze this image. Determine if it is a single wine bottle label or a restaurant wine menu. If it's a menu, extract the 3 best wine options based on quality and value.` },
              { type: "image_url", image_url: { url: `data:${file.type};base64,${base64Data}` } }
            ]
          }
        ],
        responseFormat: { type: "json_object" }
      });
      
      const data = JSON.parse(responseText || "{}");
      
      // Normalize data
      const isMenu = data.type === 'menu';
      const winesList = Array.isArray(data.wines) ? data.wines : [data];
      
      setScanResult({
        type: isMenu ? 'menu' : 'label',
        wines: winesList.map((w: any) => ({
          ...w,
          image: previewUrl || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop"
        }))
      });

    } catch (error) {
      console.error("Error scanning wine:", error);
      alert("Failed to analyze the image. Please try again.");
      setIsScanning(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const addToCellar = async (wine: any) => {
    if (!wine) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from('cellar').insert({
        user_id: user.id,
        name: wine.name || 'Unknown Wine',
        vintage: wine.vintage || 'NV',
        region: wine.region || 'Unknown Region',
        grape: wine.grape || '',
        status: 'Drink Now',
        status_color: 'text-green-400',
        image: wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop",
        rating: Number(wine.rating) || 90,
        awards: wine.awards || '',
        abv: wine.abv || '',
        is_organic: wine.isOrganic || false,
        calories_per_glass: wine.caloriesPerGlass || 120,
        price: wine.price || '',
        notes: wine.notes || '',
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      
      alert("Added to your cellar!");
      onSelectWine(wine);
    } catch (error) {
      console.error("Error adding to cellar:", error);
      alert("Failed to add to cellar");
    }
  };

  if (showAR) {
    return (
      <ARScanner 
        onClose={() => setShowAR(false)} 
        onSave={(wine) => {
          setScanResult(wine);
          setPreviewUrl(wine.image || null);
          setIsScanning(false);
          setShowAR(false);
        }} 
      />
    );
  }

  return (
    <div className="h-full relative bg-black">
      {/* Camera View (Simulated or Preview) */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={previewUrl || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop"} 
          alt="Camera View" 
          className="w-full h-full object-cover opacity-70"
          referrerPolicy="no-referrer"
        />
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-80 border-2 border-gold-500/50 rounded-3xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-500 rounded-tl-3xl -ml-0.5 -mt-0.5"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-500 rounded-tr-3xl -mr-0.5 -mt-0.5"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-500 rounded-bl-3xl -ml-0.5 -mb-0.5"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-500 rounded-br-3xl -mr-0.5 -mb-0.5"></div>
              
              <motion.div 
                animate={{ y: [0, 320, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-full h-0.5 bg-gold-500 shadow-[0_0_8px_#C6A96B]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Camera UI Overlay */}
      {isScanning && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 pb-32">
          <div className="flex justify-between items-center">
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
              <Zap size={20} />
            </button>
            <button 
              onClick={() => setShowAR(true)}
              className="bg-gold-500/20 border border-gold-500/50 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium text-gold-500 flex items-center gap-2 hover:bg-gold-500/30 transition-colors"
            >
              <Sparkles size={16} />
              Live AR Mode
            </button>
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
              <X size={20} />
            </button>
          </div>

          {/* New HUD with rich page Title and Hero description */}
          <div className="text-center space-y-2 bg-black/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 my-4 mx-2 max-w-sm absolute top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)]">
            <h2 className="text-lg font-serif font-bold text-gold-400">AI Wine Recognition</h2>
            <p className="text-xs text-gray-300">Take a photo of any wine label and let Sommelier AI instantly identify it.</p>
          </div>

          <div className="flex justify-center items-center gap-8">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <ImageIcon size={24} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-white"></div>
            </button>
            <div className="w-12 h-12"></div> {/* Spacer */}
          </div>
        </div>
      )}

      {/* Scan Result Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-30 p-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-14 h-14 border-4 border-gold-500 border-t-transparent rounded-full mb-8 shadow-[0_0_20px_rgba(198,169,107,0.3)]"
            />
            
            <h3 className="text-xl font-serif font-bold text-gold-450 mb-1">Scanning Wine bottle</h3>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest animate-pulse h-6">
              {STAGES[activeStageIndex]}
            </p>

            {/* Stage Stepper progress indicator list */}
            <div className="mt-8 space-y-2.5 max-w-xs text-left bg-wine-950/40 border border-white/5 rounded-2xl p-4.5 w-full">
              {STAGES.map((stg, i) => {
                const isSelected = i === activeStageIndex;
                const isCompleted = i < activeStageIndex;
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${isCompleted ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : isSelected ? 'bg-gold-500 animate-ping' : 'bg-gray-850'}`} />
                    <span className={isCompleted ? 'text-green-400/80 font-medium' : isSelected ? 'text-gold-400 font-bold' : 'text-gray-500'}>
                      {stg}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {scanResult && !isProcessing && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 bg-wine-900 z-20 overflow-y-auto hide-scrollbar pb-32"
          >
            {/* Hero Image */}
            <div className="h-[50vh] relative">
              <img 
                src={previewUrl || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop"} 
                alt="Wine" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wine-900 via-wine-900/40 to-transparent"></div>
              
              <button 
                onClick={() => { setIsScanning(true); setScanResult(null); setPreviewUrl(null); }}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 -mt-20 relative z-10">
              {scanResult.type === 'menu' ? (
                <div>
                  <div className="inline-flex items-center gap-2 bg-glass border border-glass-border backdrop-blur-md px-3 py-1.5 rounded-full mb-4">
                    <Sparkles size={16} className="text-gold-500" />
                    <span className="text-xs font-medium tracking-wide text-gold-500">Menu Analyzed • Top Picks</span>
                  </div>
                  <div className="space-y-6">
                    {scanResult.wines?.map((wine: any, idx: number) => (
                      <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-serif font-semibold pr-4">{wine.name}</h3>
                          <span className="text-gold-500 font-medium whitespace-nowrap">{wine.price}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{wine.region}, {wine.vintage} • {wine.grape}</p>
                        <p className="text-sm text-ivory mb-4 bg-wine-900/50 p-3 rounded-lg border border-white/5">
                          <span className="text-gold-500 font-medium block mb-1">Why we picked this:</span>
                          {wine.recommendationReason || wine.notes}
                        </p>
                        <div className="flex gap-3">
                          <button onClick={() => addToCellar(wine)} className="flex-1 bg-gold-500 text-wine-900 text-sm font-medium py-2.5 rounded-xl hover:scale-[0.98] transition-transform">Add to Cellar</button>
                          <button onClick={() => onSelectWine(wine)} className="flex-1 glass-panel text-ivory text-sm font-medium py-2.5 rounded-xl hover:bg-white/10 transition-colors">Details</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center gap-2 bg-glass border border-glass-border backdrop-blur-md px-3 py-1.5 rounded-full mb-4">
                    <CheckCircle2 size={16} className="text-gold-500" />
                    <span className="text-xs font-medium tracking-wide text-gold-500">{scanResult.wines?.[0]?.match || '95%'} Match for You</span>
                  </div>
                  
                  <h1 className="text-4xl font-serif font-semibold mb-1">{scanResult.wines?.[0]?.name}</h1>
                  <p className="text-gray-400 font-serif italic mb-6">{scanResult.wines?.[0]?.region}, {scanResult.wines?.[0]?.vintage}</p>

                  {/* AI Summary */}
                  <div className="glass-panel p-6 mb-8">
                    <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-2">AI Sommelier Insight</h3>
                    <p className="text-lg font-serif leading-relaxed">"{scanResult.wines?.[0]?.notes}"</p>
                  </div>

                  {/* Taste Graph (Simplified representation) */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Taste Profile</h3>
                    <div className="space-y-3">
                      <TasteBar label="Boldness" value={90} />
                      <TasteBar label="Tannin" value={85} />
                      <TasteBar label="Sweetness" value={15} />
                      <TasteBar label="Acidity" value={60} />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button 
                      onClick={() => addToCellar(scanResult.wines?.[0])}
                      className="flex-1 bg-gold-500 text-wine-900 font-medium py-4 rounded-2xl hover:scale-[0.98] transition-transform"
                    >
                      Add to Cellar
                    </button>
                    <button 
                      onClick={() => onSelectWine(scanResult.wines?.[0])}
                      className="flex-1 glass-panel text-ivory font-medium py-4 rounded-2xl hover:bg-white/10 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TasteBar({ label, value }: { label: string, value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
      </div>
      <div className="h-1.5 bg-glass rounded-full overflow-hidden">
        <div className="h-full bg-gold-500 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
