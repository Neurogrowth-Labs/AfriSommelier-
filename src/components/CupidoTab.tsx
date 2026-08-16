import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ChevronRight,
  Eye,
  Flag,
  Grape,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wine,
  X,
} from 'lucide-react';

type CupidoMode = 'people' | 'taste' | 'explore' | 'ai-picks';
type MatchProfile = {
  name: string;
  personality: string;
  compatibility: number;
  avatar: string;
  shared: string[];
  differences: string[];
  taste: number;
  interests: number;
  discovery: number;
  conversation: number;
  why: string;
  profile: {
    styles: string[];
    regions: string[];
    grapes: string[];
    discovery: string[];
  };
};

const matches: MatchProfile[] = [
  {
    name: 'Alex M.',
    personality: 'Taste Explorer',
    compatibility: 87,
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=600&auto=format&fit=crop',
    shared: ['Italian regions', 'Food pairing', 'Winery stories', 'New styles'],
    differences: ['You explore regions first', 'Alex explores grape varieties first'],
    taste: 92,
    interests: 84,
    discovery: 91,
    conversation: 78,
    why: 'You both enjoy fresh, high-acidity styles and use wine as a way to discover regions, food and stories.',
    profile: {
      styles: ['Fresh reds', 'Sparkling', 'Natural whites'],
      regions: ['Sicily', 'Stellenbosch', 'Swartland'],
      grapes: ['Nerello Mascalese', 'Chenin Blanc', 'Pinotage'],
      discovery: ['Food pairing', 'Winery stories', 'Travel'],
    },
  },
  {
    name: 'Naledi K.',
    personality: 'The Foodie',
    compatibility: 91,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop',
    shared: ['Braai pairings', 'Chenin Blanc', 'Wine education', 'Culture'],
    differences: ['You prefer rich reds', 'Naledi prefers mineral whites'],
    taste: 88,
    interests: 94,
    discovery: 86,
    conversation: 90,
    why: 'Cupido sees a strong food-and-learning connection: you both save pairing notes and explore educational wine content.',
    profile: {
      styles: ['Mineral whites', 'Rosé', 'Elegant reds'],
      regions: ['Paarl', 'Franschhoek', 'Loire'],
      grapes: ['Chenin Blanc', 'Grenache', 'Syrah'],
      discovery: ['Food', 'Learning', 'Culture'],
    },
  },
];

const tasteOptions = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Curious'];
const discoveryOptions = ['Winery exploration', 'Food', 'Travel', 'Culture', 'Learning'];
const exploreTopics = [
  { label: 'Italian Regions', count: 12 },
  { label: 'Food Pairing', count: 8 },
  { label: 'Wine Education', count: 21 },
  { label: 'Winery Stories', count: 14 },
];

export default function CupidoTab() {
  const [mode, setMode] = useState<CupidoMode>('people');
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null);
  const [showWhy, setShowWhy] = useState<MatchProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTaste, setSelectedTaste] = useState('Curious');
  const [visibility, setVisibility] = useState('People with similar interests');


  return (
    <div className="min-h-[100dvh] pb-32 bg-[#F4EBDD] text-[#2C1713] relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#7A1E2E] via-[#9A3A43] to-transparent opacity-95" />
      <div className="relative z-10 p-6 space-y-6">
        <header className="pt-3 flex items-start justify-between text-white">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#F4D78F] mb-3">
              <Wine size={14} /> Taste + AI discovery
            </div>
            <h1 className="text-4xl font-serif font-black tracking-tight">Cupido AI</h1>
            <p className="text-sm text-white/75 mt-2 max-w-xs">Your intelligent guide to discovering people who share your taste.</p>
          </div>
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
            <Settings size={18} />
          </button>
        </header>

        <section className="rounded-[2rem] bg-[#FFF8ED] shadow-[0_20px_70px_rgba(44,23,19,0.22)] border border-white p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#7A1E2E] text-[#F4D78F] flex items-center justify-center">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B5E3C] font-mono">Intro</p>
              <h2 className="text-xl font-serif font-bold">Let Cupido learn your taste.</h2>
            </div>
          </div>
          <p className="text-sm text-[#6C5147] leading-relaxed mb-4">
            Cupido works like a sommelier consultation: it learns your wine preferences, discovery style and conversation interests, then explains why each person may be interesting to meet.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode('taste')} className="rounded-2xl bg-[#7A1E2E] text-white py-3 px-4 text-sm font-bold">Build My Taste Profile</button>
            <button onClick={() => setMode('people')} className="rounded-2xl border border-[#7A1E2E]/20 py-3 px-4 text-sm font-bold text-[#7A1E2E]">Explore Matches</button>
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-white/85 border border-[#E8D9C6] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B5E3C] font-mono">Your Cupido Profile</p>
              <h3 className="text-2xl font-serif font-bold">The Explorer</h3>
              <p className="text-sm text-[#6C5147]">Playful summary — refined as you explore.</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-serif font-black text-[#7A1E2E]">87%</p>
              <p className="text-[10px] uppercase tracking-wider text-[#8B5E3C]">complete</p>
            </div>
          </div>
          <Metric label="Taste compatibility" value={87} />
          <Metric label="Discovery style" value={82} />
          <Metric label="Shared interests" value={91} />
          <button onClick={() => setMode('ai-picks')} className="mt-4 text-sm font-bold text-[#7A1E2E] flex items-center gap-1">Explore your recommendations <ChevronRight size={15} /></button>
        </section>

        <nav className="grid grid-cols-4 gap-2 p-1 bg-[#E8D9C6]/80 rounded-2xl sticky top-3 z-20 backdrop-blur-md">
          <ModeButton active={mode === 'people'} label="People" onClick={() => setMode('people')} />
          <ModeButton active={mode === 'taste'} label="Taste" onClick={() => setMode('taste')} />
          <ModeButton active={mode === 'explore'} label="Explore" onClick={() => setMode('explore')} />
          <ModeButton active={mode === 'ai-picks'} label="AI Picks" onClick={() => setMode('ai-picks')} />
        </nav>

        {mode === 'taste' && (
          <section className="space-y-4">
            <PanelTitle eyebrow="Taste profile" title="What do you usually enjoy exploring?" />
            <div className="grid grid-cols-2 gap-3">
              {tasteOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedTaste(option)}
                  className={`rounded-2xl p-4 text-left border transition-colors ${selectedTaste === option ? 'bg-[#7A1E2E] text-white border-[#7A1E2E]' : 'bg-white border-[#E8D9C6] text-[#2C1713]'}`}
                >
                  <Wine size={18} className="mb-3" />
                  <span className="font-bold text-sm">{option}</span>
                </button>
              ))}
            </div>
            <div className="rounded-[1.5rem] bg-white border border-[#E8D9C6] p-5 space-y-4">
              <PanelTitle eyebrow="Taste characteristics" title="Which sounds more appealing?" compact />
              <Preference label="Style" left="Fresh" right="Rich" value={68} />
              <Preference label="Lightness" left="Light" right="Full" value={54} />
              <Preference label="Acidity" left="Soft" right="Bright" value={72} />
              <Preference label="Adventure" left="Classic" right="Curious" value={82} />
            </div>
            <div className="rounded-[1.5rem] bg-white border border-[#E8D9C6] p-5">
              <PanelTitle eyebrow="Discovery preferences" title="What should Cupido use to find people?" compact />
              <div className="flex flex-wrap gap-2 mt-3">
                {discoveryOptions.map((option) => <Chip key={option}>{option}</Chip>)}
              </div>
            </div>
          </section>
        )}

        {(mode === 'people' || mode === 'ai-picks') && (
          <section className="space-y-4">
            <PanelTitle eyebrow={mode === 'ai-picks' ? 'AI-generated recommendations' : 'Recommended for you'} title="View → Understand → Follow" />
            {(mode === 'ai-picks' ? [...matches].reverse() : matches).map((match) => (
              <MatchCard key={match.name} match={match} onView={() => setSelectedMatch(match)} onWhy={() => setShowWhy(match)} />
            ))}
          </section>
        )}

        {mode === 'explore' && (
          <section className="space-y-4">
            <PanelTitle eyebrow="Explore together" title="Discover people through regions, grapes, food and wineries." />
            <div className="grid grid-cols-2 gap-3">
              {exploreTopics.map((topic) => (
                <button key={topic.label} className="rounded-[1.5rem] bg-white border border-[#E8D9C6] p-5 text-left min-h-32">
                  <BookOpen size={20} className="text-[#7A1E2E] mb-4" />
                  <h3 className="font-serif font-bold text-lg">{topic.label}</h3>
                  <p className="text-sm text-[#6C5147]">{topic.count} people exploring</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <button className="fixed right-5 bottom-28 z-30 rounded-full bg-[#2C1713] text-[#F4D78F] shadow-[0_12px_32px_rgba(44,23,19,0.35)] px-4 py-3 flex items-center gap-2 text-sm font-bold">
          <Sparkles size={16} /> Ask Cupido
        </button>
      </div>

      <AnimatePresence>
        {selectedMatch && <ProfileSheet match={selectedMatch} onClose={() => setSelectedMatch(null)} onWhy={() => setShowWhy(selectedMatch)} />}
        {showWhy && <WhySheet match={showWhy} onClose={() => setShowWhy(null)} />}
        {showSettings && <SettingsSheet visibility={visibility} onVisibility={setVisibility} onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
}

function MatchCard({ match, onView, onWhy }: { match: MatchProfile; onView: () => void; onWhy: () => void }) {
  return (
    <article className="rounded-[2rem] overflow-hidden bg-white border border-[#E8D9C6] shadow-[0_14px_45px_rgba(44,23,19,0.10)]">
      <img src={match.avatar} alt={match.name} className="h-56 w-full object-cover" referrerPolicy="no-referrer" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-serif font-bold">{match.name}</h3>
            <p className="text-sm text-[#6C5147]">{match.personality}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-serif font-black text-[#7A1E2E]">{match.compatibility}%</p>
            <p className="text-[10px] uppercase tracking-wider text-[#8B5E3C]">Strong connection</p>
          </div>
        </div>
        <CompatibilityBreakdown match={match} />
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#8B5E3C] font-mono mb-2">Shared</p>
          <div className="flex flex-wrap gap-2">{match.shared.map((item) => <Chip key={item}>{item}</Chip>)}</div>
        </div>
        <p className="mt-4 text-sm text-[#4B332C] leading-relaxed">“{match.why}”</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={onView} className="rounded-2xl bg-[#7A1E2E] text-white py-3 text-sm font-bold">View Profile</button>
          <button className="rounded-2xl border border-[#7A1E2E]/25 text-[#7A1E2E] py-3 text-sm font-bold flex items-center justify-center gap-2"><UserPlus size={15} /> Follow</button>
        </div>
        <button onClick={onWhy} className="mt-3 w-full rounded-2xl bg-[#F4EBDD] text-[#7A1E2E] py-3 text-sm font-bold">Why did Cupido recommend this?</button>
      </div>
    </article>
  );
}

function ProfileSheet({ match, onClose, onWhy }: { match: MatchProfile; onClose: () => void; onWhy: () => void }) {
  return (
    <BottomSheet onClose={onClose}>
      <div className="flex items-center gap-4 mb-5">
        <img src={match.avatar} alt={match.name} className="w-16 h-16 rounded-3xl object-cover" referrerPolicy="no-referrer" />
        <div>
          <h3 className="text-3xl font-serif font-black">{match.name}</h3>
          <p className="text-[#6C5147]">{match.personality} • {match.compatibility}% compatible</p>
        </div>
      </div>
      <ProfileSection title="Taste" items={[...match.profile.styles, ...match.profile.regions, ...match.profile.grapes]} />
      <ProfileSection title="Discovery" items={match.profile.discovery} />
      <ProfileSection title="Shared with you" items={match.shared} />
      <ProfileSection title="Different from you" items={match.differences} />
      <div className="rounded-[1.5rem] bg-[#F4EBDD] p-4 mt-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8B5E3C] font-mono mb-3">Start with a shared interest</p>
        {['What region would you recommend exploring next?', "What's a food pairing you've recently discovered?", 'Which wine region should everyone know more about?'].map((question) => (
          <button key={question} className="w-full text-left py-3 border-t border-[#E8D9C6] text-sm text-[#2C1713] flex items-center gap-2"><MessageCircle size={14} /> {question}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button className="rounded-2xl bg-[#7A1E2E] text-white py-3 text-sm font-bold">Follow</button>
        <button onClick={onWhy} className="rounded-2xl border border-[#7A1E2E]/25 text-[#7A1E2E] py-3 text-sm font-bold">Why You Match</button>
      </div>
    </BottomSheet>
  );
}

function WhySheet({ match, onClose }: { match: MatchProfile; onClose: () => void }) {
  const reasons = [
    ['Shared taste', 'You both prefer fresh, high-acidity styles.'],
    ['Shared discovery behavior', 'You both frequently explore new regions.'],
    ['Shared interests', 'Food pairing is one of your strongest common interests.'],
    ['Complementary knowledge', 'You explore regions while they explore grape varieties.'],
  ];
  return (
    <BottomSheet onClose={onClose}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B5E3C] font-mono">Why you match</p>
      <h3 className="text-3xl font-serif font-black mb-2">Cupido found 4 strong connections.</h3>
      <p className="text-sm text-[#6C5147] mb-5">This recommendation is based on transparent taste, interest and discovery signals — not a single unexplained score.</p>
      <div className="space-y-3">
        {reasons.map(([title, body], index) => (
          <div key={title} className="rounded-2xl bg-[#F4EBDD] p-4 flex gap-4">
            <span className="font-serif text-xl text-[#7A1E2E]">0{index + 1}</span>
            <div>
              <h4 className="font-bold">{title}</h4>
              <p className="text-sm text-[#6C5147]">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-5 w-full rounded-2xl bg-[#7A1E2E] text-white py-3 text-sm font-bold">Explore Shared Interests</button>
    </BottomSheet>
  );
}

function SettingsSheet({ visibility, onVisibility, onClose }: { visibility: string; onVisibility: (value: string) => void; onClose: () => void }) {
  const options = ['Everyone', 'People with similar interests', 'People I follow', 'Nobody'];
  return (
    <BottomSheet onClose={onClose}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B5E3C] font-mono">Privacy & Safety</p>
      <h3 className="text-3xl font-serif font-black mb-4">Who can discover you?</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <button key={option} onClick={() => onVisibility(option)} className="w-full rounded-2xl border border-[#E8D9C6] p-4 flex items-center justify-between text-left">
            <span className="font-semibold">{option}</span>
            <span className={`w-4 h-4 rounded-full border ${visibility === option ? 'bg-[#7A1E2E] border-[#7A1E2E]' : 'border-[#8B5E3C]'}`} />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <SafetyButton icon={<Eye size={15} />} label="Hide activity" />
        <SafetyButton icon={<ShieldCheck size={15} />} label="Control follows" />
        <SafetyButton icon={<X size={15} />} label="Block user" />
        <SafetyButton icon={<Flag size={15} />} label="Report" />
      </div>
    </BottomSheet>
  );
}

function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-sm flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ y: 420 }} animate={{ y: 0 }} exit={{ y: 420 }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} className="w-full max-h-[88dvh] overflow-y-auto rounded-t-[2rem] bg-[#FFF8ED] text-[#2C1713] p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.25)]">
        <button onClick={onClose} className="ml-auto mb-3 w-9 h-9 rounded-full bg-[#F4EBDD] flex items-center justify-center"><X size={18} /></button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-[#6C5147] mb-1"><span>{label}</span><span>{value}%</span></div>
      <div className="h-2 rounded-full bg-[#E8D9C6] overflow-hidden"><div className="h-full bg-[#7A1E2E]" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function Preference({ label, left, right, value }: { label: string; left: string; right: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#6C5147] mb-2"><span>{label}: {left}</span><span>{right}</span></div>
      <div className="h-2 rounded-full bg-[#E8D9C6] relative"><span className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#7A1E2E] border-2 border-white shadow" style={{ left: `calc(${value}% - 8px)` }} /></div>
    </div>
  );
}

function CompatibilityBreakdown({ match }: { match: MatchProfile }) {
  return (
    <div className="rounded-2xl bg-[#F4EBDD] p-4 space-y-2">
      <Metric label="Taste" value={match.taste} />
      <Metric label="Interests" value={match.interests} />
      <Metric label="Discovery style" value={match.discovery} />
      <Metric label="Conversation topics" value={match.conversation} />
      <p className="text-[11px] text-[#6C5147]">Shared: 4 interests • 3 taste preferences • 2 discovery behaviors. Different: 2 preferences. Cupido confidence: High.</p>
    </div>
  );
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-xl py-2 text-[11px] font-bold uppercase tracking-wider ${active ? 'bg-white text-[#7A1E2E] shadow-sm' : 'text-[#6C5147]'}`}>{label}</button>;
}

function PanelTitle({ eyebrow, title, compact = false }: { eyebrow: string; title: string; compact?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B5E3C] font-mono mb-1">{eyebrow}</p>
      <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-serif font-bold leading-tight`}>{title}</h2>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[#F4EBDD] border border-[#E8D9C6] px-3 py-1.5 text-xs font-semibold text-[#7A1E2E]">{children}</span>;
}

function ProfileSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mb-4">
      <h4 className="text-[10px] uppercase tracking-[0.18em] text-[#8B5E3C] font-mono mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">{items.map((item) => <Chip key={item}>{item}</Chip>)}</div>
    </section>
  );
}

function SafetyButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <button className="rounded-2xl bg-[#F4EBDD] p-3 text-sm font-semibold flex items-center gap-2 text-left">{icon}{label}</button>;
}
