/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Home, Compass, ScanLine, MessageSquare, Grape, Heart, User, Bell, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from './supabase';
import HomeTab from './components/HomeTab';
import DiscoverTab from './components/DiscoverTab';
import ScanTab from './components/ScanTab';
import CellarTab from './components/CellarTab';
import SommelierChat from './components/SommelierChat';
import CupidoTab from './components/CupidoTab';
import WineDetail from './components/WineDetail';
import TrendingTab from './components/TrendingTab';
import ProfileTab from './components/ProfileTab';
import PairWithDinnerPage from './components/PairWithDinnerPage';
import PairingEngine from './components/PairingEngine';
import OnboardingScreen from './components/OnboardingScreen';
import AdminDashboard from './components/AdminDashboard';
import AddWineCollectionScreen from './components/AddWineCollectionScreen';
import ManualEntryScreen from './components/ManualEntryScreen';
import SearchWineScreen from './components/SearchWineScreen';
import GrapeKnowledgePage from './components/GrapeKnowledgePage';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [selectedGrapeSlug, setSelectedGrapeSlug] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [initialDiscoverState, setInitialDiscoverState] = useState<any>(null);
  const [initialChatState, setInitialChatState] = useState<{ role: 'user' | 'model', text: string, autoVoice?: boolean } | null>(null);
  const [cellarSubView, setCellarSubView] = useState<'cellar' | 'wishlist'>('cellar');
  const [notifications, setNotifications] = useState<any[]>([]);

  const addNotification = (type: 'match' | 'event' | 'info', title: string, message: string) => {
    const id = Math.random().toString();
    const newNotif = { id, type, title, message };
    setNotifications(prev => [newNotif, ...prev].slice(0, 3));
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          if (user.email === 'simao@neurogrowthlabs.co.za') {
            setIsOnboarding(false);
          } else {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (!data && error?.code === 'PGRST116') {
               setIsOnboarding(true);
            } else {
               setIsOnboarding(false);
            }
          }
        } else {
          setIsOnboarding(true);
        }
      } catch (error) {
        console.error("Error connecting to Supabase: ", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      checkUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      if (path.startsWith('/pair')) {
        setActiveTab('ai');
        const meal = params.get('meal');
        const mood = params.get('mood');
        if (meal) {
          setInitialChatState({ role: 'user', text: `I am having ${meal} for dinner. What South African wine would you pair with this?` });
        } else if (mood) {
          setInitialChatState({ role: 'user', text: `I am in a ${mood} mood. Recommend a South African wine.` });
        } else {
          setInitialChatState({ role: 'model', text: `What are you eating tonight? Let me help you pair a wine.` });
        }
        setSelectedGrapeSlug(null);
      } else if (path.startsWith('/explore')) {
        setActiveTab('discover');
        setSelectedGrapeSlug(null);
      } else if (path.startsWith('/trending') || path.startsWith('/search/trending') || path.startsWith('/sa')) {
        setActiveTab('trending');
        setSelectedGrapeSlug(null);
        
        // Determine initial filter based on route
        if (path.includes('/news')) setInitialDiscoverState({ filter: 'News' });
        else if (path.includes('/culture')) setInitialDiscoverState({ filter: 'Culture' });
        else if (path.includes('/markets') || path.includes('/finance')) setInitialDiscoverState({ filter: 'Finance' });
        else if (path.includes('/wine')) setInitialDiscoverState({ filter: 'Wine' });
        else if (path.includes('/tech')) setInitialDiscoverState({ filter: 'Tech' });
        else setInitialDiscoverState({ filter: 'All Trends' });
      } else if (path.startsWith('/grapes/')) {
        setActiveTab('discover');
        const grape = path.split('/')[2];
        setSelectedGrapeSlug(grape);
      } else if (path.startsWith('/sommelier')) {
        setActiveTab('ai');
        const voice = params.get('voice');
        setInitialChatState({ role: 'model', text: "Tell me your mood, budget, and meal, and I'll find the perfect wine.", autoVoice: voice === 'true' });
        setSelectedGrapeSlug(null);
      } else {
        setSelectedGrapeSlug(null);
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  useEffect(() => {
    const handleCustomNotification = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        addNotification(detail.type, detail.title, detail.message);
      }
    };
    window.addEventListener('enoviq_notification', handleCustomNotification);
    return () => window.removeEventListener('enoviq_notification', handleCustomNotification);
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    let matchesChannel: any = null;

    const setupMatchesSubscription = async () => {
      try {
        matchesChannel = supabase.channel(`realtime_app_matches_${user.id}`);
        matchesChannel
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cupido_matches' }, (payload: any) => {
            if (!isMounted) return;
            const newMatch = payload.new;
            if (newMatch && (newMatch.user_one_id === user.id || newMatch.user_two_id === user.id)) {
              addNotification(
                'match',
                'New Wine Match! 🍷',
                'You have a new mutual Enoviq Cupido match on premium wine preferences!'
              );
            }
          })
          .subscribe();
      } catch (err) {
        console.warn("Matches live channel trigger warning:", err);
      }
    };

    setupMatchesSubscription();

    const checkApproachingEvents = async () => {
      try {
        const { data: regs, error } = await supabase
          .from('cupido_event_registrations')
          .select('event_id')
          .eq('user_id', user.id);

        if (!error && regs && regs.length > 0) {
          const registeredEventIds = regs.map((r: any) => r.event_id);
          if (registeredEventIds.includes('bordeaux')) {
            addNotification(
              'event',
              'Approaching Event! 📅',
              'Vintage Bordeaux Blind Tasting at Delaire Graff is approaching on June 25, 2026 (in 3 days)!'
            );
          }
          if (registeredEventIds.includes('cabernet')) {
            addNotification(
              'event',
              'Approaching Event! 📅',
              'Cabernet Collective & Artisan Braai Night at Kanonkop is approaching on June 27, 2026 (in 5 days)!'
            );
          }
        }
      } catch (err) {
        console.warn("Approaching events checking warning:", err);
      }
    };

    const eventsTimer = setTimeout(() => {
      if (isMounted) checkApproachingEvents();
    }, 3000);

    const simulatedTimer = setTimeout(() => {
      if (isMounted) {
        addNotification(
          'match',
          'New Wine Match! 🍷',
          'Emma from Stellenbosch Vineyard District just liked you back! Conjoining taste DNA matches at 94%!'
        );
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearTimeout(eventsTimer);
      clearTimeout(simulatedTimer);
      if (matchesChannel) {
        try {
          supabase.removeChannel(matchesChannel);
        } catch {}
      }
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center text-gold-500 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gold-500/10 rounded-full blur-[80px] z-0 animate-pulse pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Grape className="w-12 h-12 text-gold-500 animate-bounce duration-1000" />
          <div className="text-xs font-mono tracking-[0.25em] text-gold-400 uppercase animate-pulse">Initializing Cellar Vault</div>
        </div>
      </div>
    );
  }

  if (isOnboarding) {
    return <OnboardingScreen onComplete={() => setIsOnboarding(false)} />;
  }

  if (!user) {
    // Should be caught by isOnboarding, but render it just in case onboarding completes with no auth
    return <OnboardingScreen onComplete={() => setIsOnboarding(false)} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-[#F2E7D5] flex flex-col items-center justify-between relative overflow-hidden selection:bg-[#C8A24A]/30 font-sans border-0 sm:border sm:border-[#C8A24A]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] lg:max-w-md lg:mx-auto">
      {/* Frame Gold Border Effect (Mobile Outline) */}
      <div className="absolute inset-0 border-[0.5px] border-[#C8A24A]/20 pointer-events-none z-50 rounded-sm lg:rounded-none m-1"></div>
      
      {/* Real-time Notification HUD Overlays */}
      <div className="absolute top-4 left-4 right-4 z-[100] pointer-events-none flex flex-col gap-2.5 max-w-sm mx-auto">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -45, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 15, stiffness: 180 }}
              className="pointer-events-auto w-full p-3.5 rounded-xl border border-[#C8A24A]/30 bg-[#0A0A0B]/95 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.85)] flex items-start gap-3 relative overflow-hidden group"
            >
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-5 group-hover:animate-shine pointer-events-none" />
              <div className={`absolute top-0 left-0 w-[3px] h-full ${
                notif.type === 'match' ? 'bg-[#8B1538]' : notif.type === 'event' ? 'bg-[#D4AF37]' : 'bg-blue-400'
              }`} />
              <div className={`p-2 rounded-lg ${
                notif.type === 'match' ? 'bg-[#8B1538]/10 text-[#8B1538]' : notif.type === 'event' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-blue-400/10 text-blue-400'
              }`}>
                {notif.type === 'match' && <Sparkles size={16} className="text-[#D4AF37] fill-[#D4AF37]/30" />}
                {notif.type === 'event' && <Calendar size={16} className="text-[#D4AF37]" />}
                {notif.type !== 'match' && notif.type !== 'event' && <Bell size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-black text-white leading-none mb-1">{notif.title}</h4>
                  <button 
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    className="text-[10px] text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">{notif.message}</p>
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block mt-1.5">Enoviq Real-time • Live HUD</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-full h-[400px] bg-gradient-to-b from-[#C8A24A]/5 to-transparent"></div>
         <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#C8A24A]/5 rounded-full blur-[120px]" />
      </div>

      <main className="w-full flex-1 h-[100dvh] overflow-y-auto hide-scrollbar relative z-10 custom-scrollbar">
        {selectedGrapeSlug ? (
          <GrapeKnowledgePage 
            slug={selectedGrapeSlug} 
            onBack={() => {
              window.history.pushState(null, '', '/explore');
              setSelectedGrapeSlug(null);
              setActiveTab('discover');
            }}
            onSelectWine={setSelectedWine}
          />
        ) : (
          <>
            {activeTab === 'home' && <HomeTab onSelectWine={setSelectedWine} onNavigate={(tab, state) => {
              setActiveTab(tab);
              if (tab === 'discover' && state) setInitialDiscoverState(state);
              if (tab === 'ai' && state) setInitialChatState(state);
            }} />}
            {activeTab === 'discover' && <DiscoverTab onSelectWine={setSelectedWine} initialState={initialDiscoverState} />}
            {activeTab === 'scan' && <ScanTab onSelectWine={setSelectedWine} />}
            {activeTab === 'ai' && <SommelierChat onClose={() => setActiveTab('home')} initialMessage={initialChatState} />}
            {activeTab === 'cellar' && <CellarTab initialViewMode={cellarSubView} onSelectWine={setSelectedWine} onNavigate={(tab, state) => {
              setActiveTab(tab);
              if (tab === 'discover' && state) setInitialDiscoverState(state);
              if (tab === 'ai' && state) setInitialChatState(state);
            }} />}
            {activeTab === 'cupido' && <CupidoTab />}
            {activeTab === 'profile' && <ProfileTab onNavigate={(tab) => {
              setActiveTab(tab);
              if (tab === 'cellar') setCellarSubView('cellar');
            }} />}
            {activeTab === 'trending' && <TrendingTab onBack={() => setActiveTab('home')} initialFilter={initialDiscoverState?.filter || 'All Trends'} />}
            {activeTab === 'pairings' && <PairWithDinnerPage onBack={() => setActiveTab('home')} onNavigate={(tab, state) => {
              setActiveTab(tab);
              if (tab === 'discover' && state) setInitialDiscoverState(state);
              if (tab === 'ai' && state) setInitialChatState(state);
            }} />}
            {activeTab === 'pairing-engine' && <PairingEngine onBack={() => setActiveTab('pairings')} onNavigate={(tab, state) => {
              setActiveTab(tab);
              if (tab === 'discover' && state) setInitialDiscoverState(state);
            }} />}
            {activeTab === 'admin' && <AdminDashboard onBack={() => setActiveTab('home')} />}
            {activeTab === 'collection-add' && (
              <AddWineCollectionScreen 
                onBack={() => {
                  setCellarSubView('cellar');
                  setActiveTab('cellar');
                }}
                onNavigate={(route) => setActiveTab(route)}
                onSelectWine={(wine) => setSelectedWine(wine)}
                onNavigateToCellar={(section) => {
                  if (section === 'wishlist') {
                    setCellarSubView('wishlist');
                    setActiveTab('cellar');
                  } else if (section === 'portfolio') {
                    setActiveTab('profile');
                  } else {
                    setCellarSubView('cellar');
                    setActiveTab('cellar');
                  }
                }}
              />
            )}
            {activeTab === 'collection-manual' && (
              <ManualEntryScreen 
                onBack={() => setActiveTab('collection-add')}
                onNavigate={(route) => setActiveTab(route)}
                onSelectWine={(wine) => setSelectedWine(wine)}
              />
            )}
            {activeTab === 'search' && (
              <SearchWineScreen 
                onBack={() => setActiveTab('collection-add')}
                onNavigate={(route) => setActiveTab(route)}
                onSelectWine={(wine) => setSelectedWine(wine)}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Glass Navigation Bar - Hidden in Admin Console Mode & Immersive Add workflows */}
      {activeTab !== 'admin' && activeTab !== 'collection-add' && activeTab !== 'collection-manual' && activeTab !== 'search' && !selectedGrapeSlug && (
        <div className="absolute bottom-6 left-4 right-4 z-40 max-w-sm mx-auto">
          <nav className="w-full h-[72px] bg-[#0A0A0A]/90 backdrop-blur-xl border border-[#C8A24A]/25 flex justify-between items-center px-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.9)]">
            <NavItem icon={<Home size={20} />} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavItem icon={<Compass size={20} />} active={activeTab === 'discover'} onClick={() => setActiveTab('discover')} />
            <NavItem icon={<Grape size={20} />} active={activeTab === 'cellar'} onClick={() => setActiveTab('cellar')} />
            
            {/* Floating Center Scan Button */}
            <div className="relative -top-5">
              <button 
                onClick={() => setActiveTab('scan')}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C8A24A] to-[#B38E36] text-[#050505] flex items-center justify-center shadow-[0_8px_32px_rgba(200,162,74,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 relative group overflow-hidden border border-[#C8A24A]"
              >
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                <ScanLine size={22} />
              </button>
            </div>

            <NavItem icon={<Heart size={20} className={activeTab === 'cupido' ? 'text-[#8B1538] fill-[#8B1538]' : ''} />} active={activeTab === 'cupido'} onClick={() => setActiveTab('cupido')} />
            <NavItem icon={<User size={20} />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </nav>
        </div>
      )}

      <AnimatePresence>
        {selectedWine && (
          <WineDetail wine={selectedWine} onClose={() => setSelectedWine(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 transition-all duration-300 relative ${
        active ? 'text-[#C8A24A] scale-110' : 'text-[#F2E7D5]/40 hover:text-[#F2E7D5]/80 hover:scale-105'
      }`}
    >
      {icon}
      {active && (
         <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C8A24A] shadow-[0_0_8px_rgba(200,162,74,0.8)]" />
      )}
    </button>
  );
}
