import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Settings, Award, Flame, LogOut, Wine, Activity } from 'lucide-react';
import { collection, query, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';

export default function ProfileTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState({ glasses: 0, streak: 3, uniqueWines: 0 });
  const [loading, setLoading] = useState(true);
  const [tasteDNA, setTasteDNA] = useState({
    Boldness: 85,
    Tannin: 70,
    Sweetness: 30,
    Acidity: 65,
    Fruitiness: 80,
    Earthiness: 40
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, `users/${auth.currentUser.uid}/consumption`));
        const snapshot = await getDocs(q);
        
        const unique = new Set();
        snapshot.forEach(doc => {
          unique.add(doc.data().wineName);
        });

        setStats({
          glasses: snapshot.size,
          streak: 3, // Mocked streak for now
          uniqueWines: unique.size
        });
      } catch (error) {
        import('../utils/firestoreErrorHandler').then(({ handleFirestoreError, OperationType }) => {
          handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}/consumption`);
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="min-h-screen bg-wine-900 pb-32"
    >
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
      <div className="flex justify-between items-center p-6 pt-12">
        <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-full bg-glass border border-glass-border flex items-center justify-center text-gray-400 hover:text-ivory transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-serif font-medium">Profile</h2>
        <button className="w-10 h-10 rounded-full bg-glass border border-glass-border flex items-center justify-center text-gray-400 hover:text-ivory transition-colors">
          <Settings size={20} />
        </button>
      </div>

      <div className="px-6">
        {/* User Info */}
        <div className="flex flex-col items-center mb-10 mt-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold-500 mb-4 relative">
            <img 
              src={auth.currentUser?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-serif font-semibold">{auth.currentUser?.displayName || 'Wine Lover'}</h1>
          <p className="text-gray-400 text-sm">{auth.currentUser?.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="glass-panel p-4 rounded-2xl flex flex-col items-center text-center">
            <Wine size={20} className="text-pink-400 mb-2" />
            <p className="text-2xl font-serif font-semibold text-ivory">{stats.glasses}</p>
            <p className="text-xs text-gray-400">Glasses</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex flex-col items-center text-center border border-gold-500/30 bg-gold-500/5">
            <Flame size={20} className="text-gold-500 mb-2" />
            <p className="text-2xl font-serif font-semibold text-gold-500">{stats.streak}</p>
            <p className="text-xs text-gray-400">Day Streak</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex flex-col items-center text-center">
            <Activity size={20} className="text-blue-400 mb-2" />
            <p className="text-2xl font-serif font-semibold text-ivory">{stats.uniqueWines}</p>
            <p className="text-xs text-gray-400">Unique</p>
          </div>
        </div>

        {/* TasteDNA */}
        <div className="mb-10">
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Taste DNA</h3>
            <p className="text-gray-400 text-sm">Your evolving flavor profile</p>
          </div>
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <TasteBar label="Boldness" value={tasteDNA.Boldness} color="bg-red-500" onChange={(val) => setTasteDNA(prev => ({ ...prev, Boldness: val }))} />
            <TasteBar label="Tannin" value={tasteDNA.Tannin} color="bg-orange-500" onChange={(val) => setTasteDNA(prev => ({ ...prev, Tannin: val }))} />
            <TasteBar label="Sweetness" value={tasteDNA.Sweetness} color="bg-pink-500" onChange={(val) => setTasteDNA(prev => ({ ...prev, Sweetness: val }))} />
            <TasteBar label="Acidity" value={tasteDNA.Acidity} color="bg-green-500" onChange={(val) => setTasteDNA(prev => ({ ...prev, Acidity: val }))} />
            <TasteBar label="Fruitiness" value={tasteDNA.Fruitiness} color="bg-purple-500" onChange={(val) => setTasteDNA(prev => ({ ...prev, Fruitiness: val }))} />
            <TasteBar label="Earthiness" value={tasteDNA.Earthiness} color="bg-amber-700" onChange={(val) => setTasteDNA(prev => ({ ...prev, Earthiness: val }))} />
          </div>
        </div>

        {/* Badges */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Award size={20} className="text-gold-500" />
            Badges Earned
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500">
                🇿🇦
              </div>
              <div>
                <h4 className="font-medium text-sm text-ivory">Pinotage Expert</h4>
                <p className="text-xs text-gray-400">Logged 5+ Pinotages</p>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                🌟
              </div>
              <div>
                <h4 className="font-medium text-sm text-ivory">Top Rater</h4>
                <p className="text-xs text-gray-400">Rated 10 wines</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button 
          onClick={handleLogout}
          className="w-full glass-panel p-4 rounded-2xl flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
      </div>
    </motion.div>
  );
}

function TasteBar({ label, value, color, onChange }: { label: string, value: number, color: string, onChange: (val: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-500">{value}%</span>
      </div>
      <div className="relative h-4 bg-black/40 rounded-full overflow-hidden group">
        <motion.div 
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
          className={`absolute top-0 left-0 h-full ${color} rounded-full pointer-events-none`} 
        />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
