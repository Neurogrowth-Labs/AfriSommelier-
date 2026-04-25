import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, Activity, Droplet, Calendar, Plus } from 'lucide-react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import EventModal from './EventModal';

export default function HomeTab({ onSelectWine, onNavigate }: { onSelectWine: (wine: any) => void, onNavigate: (tab: string, state?: any) => void }) {
  const [glassesThisWeek, setGlassesThisWeek] = useState(0);
  const [caloriesThisWeek, setCaloriesThisWeek] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Get date for 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/consumption`),
      where('date', '>=', oneWeekAgo.toISOString())
    );

    const unsubscribeConsumption = onSnapshot(q, (snapshot) => {
      let glasses = 0;
      let calories = 0;
      snapshot.forEach((doc) => {
        glasses += 1;
        calories += Number(doc.data().calories) || 120;
      });
      setGlassesThisWeek(glasses);
      setCaloriesThisWeek(calories);
    }, (error) => {
      import('../utils/firestoreErrorHandler').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}/consumption`);
      });
    });

    // Fetch Events
    const qEvents = query(
      collection(db, `users/${auth.currentUser.uid}/events`),
      orderBy('date', 'asc')
    );

    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Filter out past events
      const today = new Date().toISOString().split('T')[0];
      setEvents(fetchedEvents.filter(e => e.date >= today));
    }, (error) => {
      import('../utils/firestoreErrorHandler').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}/events`);
      });
    });

    return () => {
      unsubscribeConsumption();
      unsubscribeEvents();
    };
  }, []);

  return (
    <div className="pb-32 w-full max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6">
        <button 
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 rounded-full overflow-hidden border border-glass-border hover:scale-105 transition-transform"
        >
          <img src={auth.currentUser?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </button>
        <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
          <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-6 mb-10 mt-4 md:mt-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-serif font-semibold mb-2"
        >
          Good evening, {auth.currentUser?.displayName?.split(' ')[0] || 'Friend'} <span className="text-transparent text-shadow-sm">🍷</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg md:text-xl"
        >
          Here's your perfect match
        </motion.p>
      </div>

      {/* Hero Card */}
      <div className="px-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-[32px] overflow-hidden aspect-[4/5] sm:aspect-square md:aspect-[21/9] shadow-2xl"
        >
          <img src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop" alt="Wine" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-wine-900 via-wine-900/40 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="inline-flex items-center gap-2 bg-glass border border-glass-border backdrop-blur-md px-3 py-1.5 rounded-full mb-4">
              <Sparkles size={14} className="text-gold-500" />
              <span className="text-xs font-medium tracking-wide">95% MATCH</span>
            </div>
            <h2 className="text-3xl font-serif font-semibold mb-1">Kanonkop Paul Sauer</h2>
            <p className="text-gray-400 mb-6 font-serif italic">Stellenbosch, 2019</p>
            <button 
              onClick={() => onSelectWine({
                name: "Kanonkop Paul Sauer",
                vintage: "2019",
                region: "Stellenbosch",
                image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop"
              })}
              className="w-full bg-gold-500 text-wine-900 font-medium py-4 rounded-2xl hover:scale-[0.98] transition-transform"
            >
              Explore
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mindful Tracker */}
      <div className="px-6 mb-12">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Activity size={20} className="text-gold-500" />
            Mindful Tracker
          </h3>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex gap-4">
          <div className="flex-1 bg-wine-900/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Droplet size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Glasses (7d)</span>
            </div>
            <p className="text-3xl font-serif font-semibold text-ivory">{glassesThisWeek}</p>
          </div>
          <div className="flex-1 bg-wine-900/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Activity size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Calories</span>
            </div>
            <p className="text-3xl font-serif font-semibold text-ivory">{caloriesThisWeek}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="px-6 mb-12">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calendar size={20} className="text-gold-500" />
            Tasting Events
          </h3>
          <button onClick={() => setShowEventModal(true)} className="text-gold-500 flex items-center text-sm gap-1 hover:text-gold-400">
            <Plus size={16} /> New
          </button>
        </div>
        
        {events.length === 0 ? (
          <div className="glass-panel p-6 rounded-2xl text-center">
            <p className="text-gray-400 text-sm mb-3">No upcoming tastings scheduled.</p>
            <button onClick={() => setShowEventModal(true)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-ivory hover:bg-white/10 transition-colors">
              Schedule One
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 3).map(event => (
              <div key={event.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                <div className="bg-wine-900/50 rounded-xl p-3 text-center min-w-[60px] border border-white/5">
                  <p className="text-xs text-gray-400 uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</p>
                  <p className="text-xl font-serif font-semibold text-gold-500">{new Date(event.date).getDate()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-ivory mb-1">{event.title}</h4>
                  <p className="text-xs text-gray-400">
                    {event.time && `${event.time} • `}{event.location || 'TBD'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sections */}
      <Section title="Pair with dinner" onSeeAll={() => onNavigate('pairings')} />
      <div className="flex overflow-x-auto hide-scrollbar px-6 gap-4 mb-12">
        <PairingCard food="Braai Meat" wine="Pinotage" image="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop" />
        <PairingCard food="Bobotie" wine="Chenin Blanc" image="https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?q=80&w=400&auto=format&fit=crop" />
        <PairingCard food="Cape Malay Curry" wine="Gewürztraminer" image="https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=400&auto=format&fit=crop" />
      </div>

      <Section title="Trending in SA" onSeeAll={() => onNavigate('trending')} />
      <div className="flex overflow-x-auto hide-scrollbar px-6 gap-4 mb-12">
        <TrendingCard 
          name="Hamilton Russell" 
          type="Pinot Noir" 
          price="R 850" 
          image="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop" 
          onClick={() => onSelectWine({
            name: "Hamilton Russell",
            vintage: "2021",
            region: "Hemel-en-Aarde",
            image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop"
          })}
        />
        <TrendingCard 
          name="Sadie Family" 
          type="Columella" 
          price="R 1,200" 
          image="https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400&auto=format&fit=crop" 
          onClick={() => onSelectWine({
            name: "Sadie Family Columella",
            vintage: "2020",
            region: "Swartland",
            image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400&auto=format&fit=crop"
          })}
        />
      </div>

      <AnimatePresence>
        {showEventModal && <EventModal onClose={() => setShowEventModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, onSeeAll }: { title: string, onSeeAll?: () => void }) {
  return (
    <div className="px-6 flex justify-between items-end mb-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      <button onClick={onSeeAll} className="text-gold-500 flex items-center text-sm hover:text-gold-400 transition-colors">
        See all <ChevronRight size={16} />
      </button>
    </div>
  );
}

function PairingCard({ food, wine, image }: any) {
  return (
    <div className="min-w-[160px] relative rounded-2xl overflow-hidden aspect-square shrink-0">
      <img src={image} alt={food} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4">
        <p className="text-xs text-gray-400 mb-1">{food}</p>
        <p className="font-serif font-medium">{wine}</p>
      </div>
    </div>
  );
}

function TrendingCard({ name, type, price, image, onClick }: any) {
  return (
    <div onClick={onClick} className="min-w-[200px] glass-panel p-4 shrink-0 cursor-pointer hover:bg-white/5 transition-colors">
      <div className="h-32 rounded-xl overflow-hidden mb-4">
        <img src={image} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <h4 className="font-serif font-medium text-lg">{name}</h4>
      <p className="text-gray-400 text-sm mb-2">{type}</p>
      <p className="text-gold-500 font-medium">{price}</p>
    </div>
  );
}
