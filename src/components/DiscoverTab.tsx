import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Gift, Users, Loader2, Trophy, Filter } from 'lucide-react';
import TasteDNA from './TasteDNA';
import GiftEngineModal from './GiftEngineModal';
import PartyModeModal from './PartyModeModal';
import RegionModal from './RegionModal';
import AwardsModal from './AwardsModal';
import { WINE_FARMS_KNOWLEDGE } from '../data/wineKnowledge';
import { WINE_COURSE_KNOWLEDGE } from '../data/educationalCourseKnowledge';
import { WINE_WISE_KNOWLEDGE } from '../data/wineWiseKnowledge';
import { callOpenRouter } from '../services/openRouterService';

export default function DiscoverTab({ onSelectWine, initialState }: { onSelectWine: (wine: any) => void, initialState?: any }) {
  const [showGiftEngine, setShowGiftEngine] = useState(false);
  const [showPartyMode, setShowPartyMode] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialState?.query || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  
  // Filters
  const [showFilters, setShowFilters] = useState(!!initialState?.filterGrape);
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [filterGrape, setFilterGrape] = useState<string>(initialState?.filterGrape || 'All');
  const [filterPrice, setFilterPrice] = useState<string>('All');

  // Trigger search on mount if initial state has query or filters
  useEffect(() => {
    if (initialState?.query || initialState?.filterGrape) {
      handleSearch();
    }
  }, [initialState]);

  const handleSearch = async (
    e?: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>,
    overrides?: { region?: string, grape?: string, price?: string }
  ) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    
    const currentRegion = overrides?.region || filterRegion;
    const currentGrape = overrides?.grape || filterGrape;
    const currentPrice = overrides?.price || filterPrice;

    if (!searchQuery.trim() && currentRegion === 'All' && currentGrape === 'All' && currentPrice === 'All') return;
    
    setIsSearching(true);
    setSearchResults(null);
    
    let filterContext = '';
    if (currentRegion !== 'All') filterContext += ` Must be from the ${currentRegion} region.`;
    if (currentGrape !== 'All') filterContext += ` Must be primarily made from ${currentGrape}.`;
    if (currentPrice !== 'All') filterContext += ` Must be in the price range of ${currentPrice}.`;

    try {
      const systemInstruction = `You are a master sommelier processing a query. You must return your response strictly as a JSON object with valid JSON only.
Structure:
{
  "wines": [
    {
      "name": "string",
      "vintage": "string",
      "region": "string",
      "grape": "string",
      "notes": "A short, elegant 2-sentence sommelier description",
      "price": "string",
      "rating": number,
      "match": "string (percentage like '95%')"
    }
  ]
}`;

      const userPrompt = `The user is searching for: "${searchQuery}".${filterContext}
Suggest 3 real South African wines that perfectly match this query and these filters.

Reference Knowledge:
${WINE_FARMS_KNOWLEDGE.substring(0, 500)}...
${WINE_COURSE_KNOWLEDGE.substring(0, 500)}...
${WINE_WISE_KNOWLEDGE.substring(0, 500)}...`;

      const responseText = await callOpenRouter({
        prompt: userPrompt,
        systemPrompt: systemInstruction,
        responseFormat: { type: "json_object" }
      });

      const data = JSON.parse(responseText || "{}");
      
      setSearchResults(data.wines || []);
      } catch (error) {
        console.error("Search error:", error);
        alert("Failed to perform search. Please try again.");
      } finally {
        setIsSearching(false);
      }
  };

  return (
    <div className="pb-32 pt-12 w-full max-w-7xl mx-auto">
      {/* Search Bar */}
      <div className="px-6 mb-4">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="E.g., 'Fruity white from Stellenbosch under R300'" 
              className="w-full bg-glass border border-glass-border rounded-full py-4 pl-12 pr-6 text-sm text-ivory placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-colors ${showFilters || filterRegion !== 'All' || filterGrape !== 'All' || filterPrice !== 'All' ? 'bg-gold-500 text-wine-900' : 'bg-glass border border-glass-border text-gray-400 hover:text-ivory'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex overflow-x-auto hide-scrollbar px-6 gap-2 mb-6">
        <button 
          onClick={() => { setFilterPrice('Under R150'); handleSearch(); }}
          className="px-4 py-2 rounded-full border border-glass-border bg-glass text-xs whitespace-nowrap hover:bg-white/10 transition-colors"
        >
          Under R200
        </button>
        <button 
          onClick={() => { setFilterPrice('Over R600'); handleSearch(); }}
          className="px-4 py-2 rounded-full border border-glass-border bg-glass text-xs whitespace-nowrap hover:bg-white/10 transition-colors"
        >
          Luxury
        </button>
        <button 
          onClick={() => { setFilterRegion('Constantia'); handleSearch(); }}
          className="px-4 py-2 rounded-full border border-glass-border bg-glass text-xs whitespace-nowrap hover:bg-white/10 transition-colors"
        >
          Cape Town Nearby
        </button>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex overflow-x-auto hide-scrollbar px-6 gap-2 mb-6">
        <button 
          onClick={() => { setFilterPrice('Under R150'); handleSearch(undefined, { price: 'Under R150' }); }}
          className="px-4 py-2 rounded-full border border-glass-border bg-glass text-xs whitespace-nowrap hover:bg-white/10 transition-colors"
        >
          Under R200
        </button>
        <button 
          onClick={() => { setFilterPrice('Over R600'); handleSearch(undefined, { price: 'Over R600' }); }}
          className="px-4 py-2 rounded-full border border-glass-border bg-glass text-xs whitespace-nowrap hover:bg-white/10 transition-colors"
        >
          Luxury
        </button>
        <button 
          onClick={() => { setFilterRegion('Constantia'); handleSearch(undefined, { region: 'Constantia' }); }}
          className="px-4 py-2 rounded-full border border-glass-border bg-glass text-xs whitespace-nowrap hover:bg-white/10 transition-colors"
        >
          Cape Town Nearby
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 mb-8 overflow-hidden"
          >
            <div className="glass-panel p-4 rounded-2xl space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Region</label>
                <select 
                  value={filterRegion} 
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="w-full bg-wine-900/50 border border-white/10 rounded-lg p-2 text-sm text-ivory focus:outline-none focus:border-gold-500"
                >
                  <option value="All">All Regions</option>
                  <option value="Stellenbosch">Stellenbosch</option>
                  <option value="Franschhoek">Franschhoek</option>
                  <option value="Swartland">Swartland</option>
                  <option value="Hemel-en-Aarde">Hemel-en-Aarde</option>
                  <option value="Paarl">Paarl</option>
                  <option value="Constantia">Constantia</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Grape Varietal</label>
                <select 
                  value={filterGrape} 
                  onChange={(e) => setFilterGrape(e.target.value)}
                  className="w-full bg-wine-900/50 border border-white/10 rounded-lg p-2 text-sm text-ivory focus:outline-none focus:border-gold-500"
                >
                  <option value="All">All Varietals</option>
                  <option value="Chenin Blanc">Chenin Blanc</option>
                  <option value="Pinotage">Pinotage</option>
                  <option value="Cabernet Sauvignon">Cabernet Sauvignon</option>
                  <option value="Shiraz">Shiraz / Syrah</option>
                  <option value="Chardonnay">Chardonnay</option>
                  <option value="Sauvignon Blanc">Sauvignon Blanc</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Price Range</label>
                <select 
                  value={filterPrice} 
                  onChange={(e) => setFilterPrice(e.target.value)}
                  className="w-full bg-wine-900/50 border border-white/10 rounded-lg p-2 text-sm text-ivory focus:outline-none focus:border-gold-500"
                >
                  <option value="All">Any Price</option>
                  <option value="Under R150">Under R150</option>
                  <option value="R150 - R300">R150 - R300</option>
                  <option value="R300 - R600">R300 - R600</option>
                  <option value="Over R600">Over R600</option>
                </select>
              </div>
              <button 
                onClick={handleSearch}
                className="w-full bg-gold-500 text-wine-900 font-medium py-2 rounded-lg mt-2 hover:bg-gold-400 transition-colors"
              >
                Apply Filters & Search
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {isSearching && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 mb-8 flex flex-col items-center justify-center py-8"
          >
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin mb-4" />
            <p className="text-gold-500 font-serif animate-pulse">Finding the perfect matches...</p>
          </motion.div>
        )}

        {searchResults && !isSearching && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 mb-12"
          >
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-semibold">AI Recommendations</h3>
              <button onClick={() => setSearchResults(null)} className="text-sm text-gray-400 hover:text-ivory">Clear</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((wine, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-2xl flex gap-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => onSelectWine(wine)}>
                  <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-wine-900/50">
                    <img src={wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop"} alt={wine.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 py-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-serif font-medium text-lg leading-tight pr-2">{wine.name}</h4>
                      <span className="text-gold-500 font-medium whitespace-nowrap">{wine.price}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{wine.region}, {wine.vintage} • {wine.grape}</p>
                    <p className="text-sm text-gray-300 line-clamp-2">{wine.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Tools */}
      <div className="px-6 mb-8 flex gap-4">
        <button 
          onClick={() => setShowPartyMode(true)}
          className="flex-1 bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-pink-500/30 transition-colors"
        >
          <Users className="text-pink-400" size={24} />
          <span className="text-sm font-medium text-pink-100">Party Mode</span>
        </button>
        <button 
          onClick={() => setShowGiftEngine(true)}
          className="flex-1 bg-gradient-to-br from-gold-500/20 to-yellow-600/20 border border-gold-500/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gold-500/30 transition-colors"
        >
          <Gift className="text-gold-400" size={24} />
          <span className="text-sm font-medium text-gold-100">Gift Engine</span>
        </button>
        <button 
          onClick={() => setShowAwards(true)}
          className="flex-1 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-blue-500/30 transition-colors"
        >
          <Trophy className="text-blue-400" size={24} />
          <span className="text-sm font-medium text-blue-100">2026 Awards</span>
        </button>
      </div>

      {/* Taste DNA Section */}
      <div className="px-6">
        <TasteDNA />
      </div>

      {/* Because you liked... */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold px-6 mb-4">Because you liked Cabernet</h3>
        <div className="flex overflow-x-auto hide-scrollbar px-6 gap-4">
          <WineThumbnail 
            name="Meerlust Rubicon" 
            region="Stellenbosch" 
            image="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop" 
            onClick={() => onSelectWine({
              name: "Meerlust Rubicon",
              vintage: "2017",
              region: "Stellenbosch",
              image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop"
            })}
          />
          <WineThumbnail 
            name="Vilafonté Series C" 
            region="Paarl" 
            image="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop" 
            onClick={() => onSelectWine({
              name: "Vilafonté Series C",
              vintage: "2018",
              region: "Paarl",
              image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop"
            })}
          />
          <WineThumbnail 
            name="Rust en Vrede" 
            region="Stellenbosch" 
            image="https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400&auto=format&fit=crop" 
            onClick={() => onSelectWine({
              name: "Rust en Vrede",
              vintage: "2019",
              region: "Stellenbosch",
              image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400&auto=format&fit=crop"
            })}
          />
        </div>
      </div>

      {/* Explore Regions */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold px-6 mb-4">Explore Regions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-6">
          <RegionCard name="Stellenbosch" image="https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=600&auto=format&fit=crop" onClick={() => setSelectedRegion("Stellenbosch")} />
          <RegionCard name="Franschhoek" image="https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?q=80&w=600&auto=format&fit=crop" onClick={() => setSelectedRegion("Franschhoek")} />
          <RegionCard name="Swartland" image="https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?q=80&w=600&auto=format&fit=crop" onClick={() => setSelectedRegion("Swartland")} />
          <RegionCard name="Hemel-en-Aarde" image="https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=600&auto=format&fit=crop" onClick={() => setSelectedRegion("Hemel-en-Aarde")} />
        </div>
      </div>

      {/* Grapes */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold px-6 mb-4">Grapes</h3>
        <div className="flex flex-wrap gap-3 px-6">
          <GrapeChip name="Pinotage 🇿🇦" onClick={() => { setFilterGrape('Pinotage'); handleSearch(undefined, { grape: 'Pinotage' }); }} />
          <GrapeChip name="Chenin Blanc" onClick={() => { setFilterGrape('Chenin Blanc'); handleSearch(undefined, { grape: 'Chenin Blanc' }); }} />
          <GrapeChip name="Shiraz" onClick={() => { setFilterGrape('Shiraz'); handleSearch(undefined, { grape: 'Shiraz' }); }} />
          <GrapeChip name="Cabernet Sauvignon" onClick={() => { setFilterGrape('Cabernet Sauvignon'); handleSearch(undefined, { grape: 'Cabernet Sauvignon' }); }} />
          <GrapeChip name="Merlot" onClick={() => { setFilterGrape('Merlot'); handleSearch(undefined, { grape: 'Merlot' }); }} />
          <GrapeChip name="Chardonnay" onClick={() => { setFilterGrape('Chardonnay'); handleSearch(undefined, { grape: 'Chardonnay' }); }} />
        </div>
      </div>

      <AnimatePresence>
        {showGiftEngine && <GiftEngineModal onClose={() => setShowGiftEngine(false)} onSelectWine={onSelectWine} />}
        {showPartyMode && <PartyModeModal onClose={() => setShowPartyMode(false)} onSelectWine={onSelectWine} />}
        {showAwards && <AwardsModal onClose={() => setShowAwards(false)} />}
        {selectedRegion && <RegionModal regionName={selectedRegion} onClose={() => setSelectedRegion(null)} />}
      </AnimatePresence>
    </div>
  );
}

function WineThumbnail({ name, region, image, onClick }: any) {
  return (
    <div onClick={onClick} className="min-w-[140px] shrink-0 group cursor-pointer">
      <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 relative">
        <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
      <h4 className="font-serif text-sm font-medium leading-tight mb-1">{name}</h4>
      <p className="text-xs text-gray-400">{region}</p>
    </div>
  );
}

function RegionCard({ name, image, onClick }: any) {
  return (
    <div onClick={onClick} className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group">
      <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <h4 className="font-serif text-lg font-medium tracking-wide">{name}</h4>
      </div>
    </div>
  );
}

function GrapeChip({ name, onClick }: { name: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="px-5 py-2.5 rounded-full border border-glass-border bg-glass hover:bg-white/10 transition-colors text-sm font-medium">
      {name}
    </button>
  );
}
