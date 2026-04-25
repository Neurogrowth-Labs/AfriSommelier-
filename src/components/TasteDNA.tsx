import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Dna, Info, Edit2, Check, X } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

// Suppress harmless Recharts warning caused by Framer Motion unmounts
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('The width') && args[0].includes('and height') && args[0].includes('should be greater than 0')) {
    return;
  }
  originalWarn(...args);
};

const defaultTasteData = [
  { subject: 'Boldness', You: 85, Critics: 65, Stellenbosch: 90, fullMark: 100 },
  { subject: 'Tannin', You: 70, Critics: 80, Stellenbosch: 85, fullMark: 100 },
  { subject: 'Sweetness', You: 20, Critics: 10, Stellenbosch: 15, fullMark: 100 },
  { subject: 'Acidity', You: 60, Critics: 85, Stellenbosch: 50, fullMark: 100 },
  { subject: 'Fruitiness', You: 90, Critics: 70, Stellenbosch: 80, fullMark: 100 },
  { subject: 'Earthiness', You: 40, Critics: 90, Stellenbosch: 60, fullMark: 100 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-wine-900/90 backdrop-blur-md border border-glass-border p-3 rounded-xl shadow-xl">
        <p className="text-sm font-serif text-ivory mb-2">{payload[0].payload.subject}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs flex items-center justify-between gap-4 mb-1" style={{ color: entry.color }}>
            <span>{entry.name}</span>
            <span className="font-medium">{entry.value}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TasteDNA() {
  const [showCritics, setShowCritics] = useState(false);
  const [showRegion, setShowRegion] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tasteData, setTasteData] = useState(defaultTasteData);
  const [editData, setEditData] = useState(defaultTasteData);

  useEffect(() => {
    const fetchTasteProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, `users/${auth.currentUser.uid}/profile`, 'tasteDNA');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const savedData = docSnap.data().profile;
          const mergedData = defaultTasteData.map(item => ({
            ...item,
            You: savedData[item.subject] !== undefined ? savedData[item.subject] : item.You
          }));
          setTasteData(mergedData);
          setEditData(mergedData);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser.uid}/profile/tasteDNA`);
      }
    };
    fetchTasteProfile();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    try {
      const profileToSave = editData.reduce((acc: any, item) => {
        acc[item.subject] = item.You;
        return acc;
      }, {});
      
      await setDoc(doc(db, `users/${auth.currentUser.uid}/profile`, 'tasteDNA'), {
        profile: profileToSave,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setTasteData(editData);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}/profile/tasteDNA`);
    }
  };

  const handleSliderChange = (index: number, value: number) => {
    const newData = [...editData];
    newData[index] = { ...newData[index], You: value };
    setEditData(newData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-6 mb-12 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div>
          <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-ivory">
            <Dna className="text-gold-500" size={24} />
            Taste DNA
          </h3>
          <p className="text-xs text-gray-400 mt-1">Your evolving flavor profile</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-gold-500 transition-colors p-1">
              <Edit2 size={18} />
            </button>
          ) : (
            <>
              <button onClick={() => { setIsEditing(false); setEditData(tasteData); }} className="text-gray-500 hover:text-red-400 transition-colors p-1">
                <X size={18} />
              </button>
              <button onClick={handleSave} className="text-gold-500 hover:text-gold-400 transition-colors p-1">
                <Check size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div 
            key="chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="h-[280px] w-full -ml-2 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={tasteData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'Inter' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  
                  <Radar 
                    name="You" 
                    dataKey="You" 
                    stroke="#C6A96B" 
                    strokeWidth={2}
                    fill="#C6A96B" 
                    fillOpacity={0.4} 
                  />
                  
                  {showCritics && (
                    <Radar 
                      name="Critics" 
                      dataKey="Critics" 
                      stroke="#9ca3af" 
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="#9ca3af" 
                      fillOpacity={0.1} 
                    />
                  )}
                  
                  {showRegion && (
                    <Radar 
                      name="Stellenbosch" 
                      dataKey="Stellenbosch" 
                      stroke="#722F37" 
                      strokeWidth={2}
                      fill="#722F37" 
                      fillOpacity={0.4} 
                    />
                  )}
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-2 mt-2 relative z-10">
              <button 
                onClick={() => setShowCritics(!showCritics)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                  showCritics 
                    ? 'bg-white/10 border-white/20 text-ivory' 
                    : 'bg-glass border-glass-border text-gray-400 hover:text-gray-300'
                }`}
              >
                vs. Critics
              </button>
              <button 
                onClick={() => setShowRegion(!showRegion)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                  showRegion 
                    ? 'bg-wine-800 border-wine-700 text-ivory shadow-[0_0_15px_rgba(114,47,55,0.5)]' 
                    : 'bg-glass border-glass-border text-gray-400 hover:text-gray-300'
                }`}
              >
                vs. Stellenbosch
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 mt-6 relative z-10"
          >
            {editData.map((item, idx) => (
              <div key={item.subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{item.subject}</span>
                  <span className="text-gold-500 font-medium">{item.You}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={item.You}
                  onChange={(e) => handleSliderChange(idx, parseInt(e.target.value))}
                  className="w-full h-2 bg-glass rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
