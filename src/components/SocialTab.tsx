import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { AtSign, Camera, Contact, HelpCircle, Library, Search, Star, UserPlus, Users } from 'lucide-react';

const friendSources = [
  { label: 'Google', icon: <Search size={16} /> },
  { label: 'Facebook', icon: <AtSign size={16} /> },
  { label: 'Twitter', icon: <AtSign size={16} /> },
  { label: 'Contacts', icon: <Contact size={16} /> },
];

const communityUsers = [
  { name: 'Naledi M.', detail: 'Chenin explorer • Paarl', action: 'Follow' },
  { name: 'Aiden K.', detail: 'Pinotage collector • Stellenbosch', action: 'Follow' },
  { name: 'Lerato S.', detail: 'Sparkling wine guide • Franschhoek', action: 'Follow' },
];

export default function SocialTab() {
  return (
    <div className="pb-32 p-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="text-[10px] tracking-[0.2em] font-mono text-[#C8A24A] uppercase mb-3 flex items-center gap-2">
          <div className="w-6 h-px bg-[#C8A24A]/40" />
          Friends
        </div>
        <h2 className="text-4xl font-serif font-light mb-3 text-[#F2E7D5]">Wine <span className="italic text-[#C8A24A]">Community</span></h2>
        <p className="text-[#F2E7D5]/60 text-sm leading-relaxed">
          Find friends, follow trusted tasters, post photos and rate wines from one social hub.
        </p>
      </motion.div>

      <section className="mb-8">
        <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-[#C8A24A] mb-3">Find Friends</h3>
        <div className="grid grid-cols-2 gap-3">
          {friendSources.map((source) => (
            <button key={source.label} className="bg-[#0A0A0A]/90 border border-[#C8A24A]/20 rounded-2xl p-4 text-left text-[#F2E7D5] hover:border-[#C8A24A]/50 transition-colors flex items-center gap-3">
              <span className="text-[#C8A24A]">{source.icon}</span>
              <span className="text-sm font-semibold">{source.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-[#C8A24A]">User List</h3>
          <Users size={16} className="text-[#C8A24A]" />
        </div>
        <div className="space-y-3">
          {communityUsers.map((user) => (
            <div key={user.name} className="bg-[#0A0A0A]/90 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#8B1538]/30 border border-[#C8A24A]/30 flex items-center justify-center text-[#C8A24A] font-serif font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{user.detail}</p>
              </div>
              <button className="px-3 py-2 rounded-full bg-[#C8A24A] text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <UserPlus size={12} /> {user.action}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 mb-8">
        <ActionCard icon={<Camera size={18} />} title="Post a Photo" description="Open camera or choose from photo library." />
        <ActionCard icon={<Star size={18} />} title="Rate a Wine" description="Pick a wine and add your rating." />
        <ActionCard icon={<Library size={18} />} title="Photo Library" description="Select a label or tasting moment." />
        <ActionCard icon={<HelpCircle size={18} />} title="How To" description="Learn how community features work." />
      </section>
    </div>
  );
}

function ActionCard({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      className="bg-[#0A0A0A]/90 border border-white/10 p-4 rounded-2xl text-left hover:border-[#C8A24A]/40 transition-colors min-h-32"
    >
      <div className="mb-3 bg-[#C8A24A]/10 w-10 h-10 rounded-full flex items-center justify-center text-[#C8A24A]">
        {icon}
      </div>
      <h4 className="font-serif text-base font-semibold mb-1 text-white">{title}</h4>
      <p className="text-[11px] text-gray-400 leading-relaxed">{description}</p>
    </motion.button>
  );
}
