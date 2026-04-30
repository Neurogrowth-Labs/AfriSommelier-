import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, Activity, Droplet, Calendar, Plus, TrendingUp } from 'lucide-react';
import { supabase } from '../supabase';
import EventModal from './EventModal';

export default function HomeTab({ onSelectWine, onNavigate }: { onSelectWine: (wine: any) => void, onNavigate: (tab: string, state?: any) => void }) {
  const [glassesThisWeek, setGlassesThisWeek] = useState(0);
  const [caloriesThisWeek, setCaloriesThisWeek] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [trendingNews, setTrendingNews] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('Friend');

  useEffect(() => {
    let isMounted = true;
    
    // Fetch News Real-time
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false }).limit(5);
        if (error) throw error;
        if (isMounted && data) {
           setTrendingNews(data);
        }
      } catch (err) {
        console.error('Error fetching news:', err);
      }
    };
    fetchNews();
    
    const newsChannel = supabase
      .channel('news_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        fetchNews();
      })
      .subscribe();

    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profileData } = await supabase.from('profiles').select('email, first_name').eq('id', user.id).single();
      if (profileData && profileData.first_name && isMounted) {
         setFirstName(profileData.first_name);
      } else if (user.email && isMounted) {
         setFirstName(user.email.split('@')[0]);
      }
    };
    
    const fetchConsumption = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data } = await supabase
        .from('consumption')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', oneWeekAgo.toISOString());
        
      if (data && isMounted) {
        let glasses = 0;
        let calories = 0;
        data.forEach(doc => {
          glasses += 1;
          calories += Number(doc.calories) || 120;
        });
        setGlassesThisWeek(glasses);
        setCaloriesThisWeek(calories);
      }
    };

    const fetchEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
        
      if (data && isMounted) {
        const today = new Date().toISOString().split('T')[0];
        setEvents(data.filter(e => e.date >= today));
      }
    };

    fetchUserData();
    fetchConsumption();
    fetchEvents();
    
    const fetchUserAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const consumptionChannel = supabase
        .channel(`consumption_changes_${user.id}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption', filter: `user_id=eq.${user.id}` }, () => {
          fetchConsumption();
        })
        .subscribe();
        
      const eventsChannel = supabase
        .channel(`events_changes_${user.id}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `user_id=eq.${user.id}` }, () => {
          fetchEvents();
        })
        .subscribe();
        
      return { consumptionChannel, eventsChannel };
    };
    
    const channelsPromise = fetchUserAndSubscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(newsChannel);
      channelsPromise.then(channels => {
        if (channels) {
          supabase.removeChannel(channels.consumptionChannel);
          supabase.removeChannel(channels.eventsChannel);
        }
      });
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
          <img src={profileUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
          Good evening, {firstName} <span className="text-transparent text-shadow-sm">🍷</span>
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

      {/* Trending Now */}
      <div className="px-6 mb-12">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp size={20} className="text-gold-500" />
            Trending Now
          </h3>
          <button onClick={() => onNavigate('discover')} className="text-gold-500 flex items-center text-sm gap-1 hover:text-gold-400 uppercase tracking-widest font-semibold text-[10px]">
            Discover Now <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-6 px-6">
           {trendingNews.map((news, i) => (
             <div key={i} className="min-w-[280px] w-[280px] glass-panel p-4 rounded-3xl relative overflow-hidden shrink-0 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onNavigate('discover')}>
                <div className="h-36 mb-4 rounded-2xl overflow-hidden relative">
                  <img src={news.image} alt={news.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 flex rounded-md items-center text-[10px] uppercase tracking-wider text-gold-500 font-bold border border-white/10">
                     {news.category}
                  </div>
                </div>
                <h4 className="font-serif font-medium text-ivory mb-2 line-clamp-2 leading-snug">{news.title}</h4>
                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{news.description}</p>
             </div>
           ))}
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
      <AnimatePresence>
        {showEventModal && <EventModal onClose={() => setShowEventModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
