/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Home, Compass, ScanLine, MessageSquare, Grape } from 'lucide-react';
import { useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useSupabase } from './lib/supabase';
import HomeTab from './components/HomeTab';
import DiscoverTab from './components/DiscoverTab';
import ScanTab from './components/ScanTab';
import CellarTab from './components/CellarTab';
import SommelierChat from './components/SommelierChat';
import WineDetail from './components/WineDetail';
import LoginScreen from './components/LoginScreen';
import TrendingTab from './components/TrendingTab';
import ProfileTab from './components/ProfileTab';
import PairWithDinnerPage from './components/PairWithDinnerPage';
import PairingEngine from './components/PairingEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const { isLoaded, isSignedIn, user } = useUser();
  const supabase = useSupabase();
  const [initialDiscoverState, setInitialDiscoverState] = useState<any>(null);
  const [initialChatState, setInitialChatState] = useState<{ role: 'user' | 'model', text: string } | null>(null);

  // OAuth callback handling — Clerk redirects back to /sso-callback after Google sign-in.
  const isSsoCallback = typeof window !== 'undefined' && window.location.pathname.startsWith('/sso-callback');

  // Make sure a row exists in public.users for the signed-in Clerk user
  // so that taste_dna and other tables can use it as a foreign key.
  useEffect(() => {
    if (!isSignedIn || !user) return;
    const ensureUserRow = async () => {
      try {
        await supabase.from('users').upsert(
          {
            user_id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? null,
          },
          { onConflict: 'user_id', ignoreDuplicates: false }
        );
      } catch (error) {
        console.error('Failed to upsert user row', error);
      }
    };
    ensureUserRow();
  }, [isSignedIn, user, supabase]);

  useEffect(() => {
    // Handle Smart Redirect Links
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
    } else if (path.startsWith('/explore')) {
      setActiveTab('discover');
    } else if (path.startsWith('/trending')) {
      setActiveTab('discover');
      setInitialDiscoverState({ query: 'Trending South African wines' });
    } else if (path.startsWith('/grapes/')) {
      setActiveTab('discover');
      const grape = path.split('/')[2];
      const grapeMap: Record<string, string> = {
        'pinotage': 'Pinotage',
        'chenin-blanc': 'Chenin Blanc',
        'shiraz': 'Shiraz / Syrah',
        'cabernet-sauvignon': 'Cabernet Sauvignon',
        'merlot': 'Merlot',
        'chardonnay': 'Chardonnay'
      };
      setInitialDiscoverState({ filterGrape: grapeMap[grape] || 'All' });
    } else if (path.startsWith('/sommelier')) {
      setActiveTab('ai');
      const voice = params.get('voice');
      setInitialChatState({ role: 'model', text: "Tell me your mood, budget, and meal, and I'll find the perfect wine.", autoVoice: voice === 'true' });
    }
  }, []);

  if (isSsoCallback) {
    return <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />;
  }

  if (!isLoaded) {
    return <div className="min-h-screen bg-wine-900 flex items-center justify-center text-gold-500">Loading...</div>;
  }

  if (!isSignedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-wine-900 text-ivory font-sans selection:bg-gold-500/30">
      <main className="h-screen overflow-y-auto hide-scrollbar relative">
        {activeTab === 'home' && <HomeTab onSelectWine={setSelectedWine} onNavigate={(tab, state) => {
          setActiveTab(tab);
          if (tab === 'discover' && state) setInitialDiscoverState(state);
          if (tab === 'ai' && state) setInitialChatState(state);
        }} />}
        {activeTab === 'discover' && <DiscoverTab onSelectWine={setSelectedWine} initialState={initialDiscoverState} />}
        {activeTab === 'scan' && <ScanTab onSelectWine={setSelectedWine} />}
        {activeTab === 'ai' && <SommelierChat onClose={() => setActiveTab('home')} initialMessage={initialChatState} />}
        {activeTab === 'cellar' && <CellarTab onSelectWine={setSelectedWine} onNavigate={(tab, state) => {
          setActiveTab(tab);
          if (tab === 'discover' && state) setInitialDiscoverState(state);
          if (tab === 'ai' && state) setInitialChatState(state);
        }} />}
        {activeTab === 'profile' && <ProfileTab onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'trending' && <TrendingTab onBack={() => setActiveTab('home')} />}
        {activeTab === 'pairings' && <PairWithDinnerPage onBack={() => setActiveTab('home')} onNavigate={(tab, state) => {
          setActiveTab(tab);
          if (tab === 'discover' && state) setInitialDiscoverState(state);
          if (tab === 'ai' && state) setInitialChatState(state);
        }} />}
        {activeTab === 'pairing-engine' && <PairingEngine onBack={() => setActiveTab('pairings')} onNavigate={(tab, state) => {
          setActiveTab(tab);
          if (tab === 'discover' && state) setInitialDiscoverState(state);
        }} />}
      </main>

      {/* Floating Glass Navigation Bar */}
      <nav className="fixed bottom-6 left-6 right-6 md:left-1/2 md:-translate-x-1/2 md:w-[500px] h-[72px] glass-panel flex justify-between items-center px-6 z-40">
        <NavItem icon={<Home size={24} />} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavItem icon={<Compass size={24} />} active={activeTab === 'discover'} onClick={() => setActiveTab('discover')} />
        
        {/* Floating Center Scan Button */}
        <div className="relative -top-6">
          <button 
            onClick={() => setActiveTab('scan')}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-wine-900 flex items-center justify-center shadow-[0_8px_32px_rgba(198,169,107,0.4)] hover:scale-105 transition-transform"
          >
            <ScanLine size={28} />
          </button>
        </div>

        <NavItem icon={<MessageSquare size={24} />} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
        <NavItem icon={<Grape size={24} />} active={activeTab === 'cellar'} onClick={() => setActiveTab('cellar')} />
      </nav>

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
      className={`p-2 transition-colors duration-300 ${
        active ? 'text-gold-500' : 'text-gray-400 hover:text-ivory'
      }`}
    >
      {icon}
    </button>
  );
}
