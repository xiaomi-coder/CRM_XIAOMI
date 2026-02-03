
import React from 'react';
import { Student } from '../types';
import { Trophy, Star, TrendingUp, Medal, Sparkles, ShoppingBag, Crown } from 'lucide-react';

interface GamificationProps {
  students: Student[];
}

const Gamification: React.FC<GamificationProps> = ({ students }) => {
  const topStudents = [...students].sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 10);

  const rewards = [
    { name: 'Oltin Ruchka', cost: 100, icon: Sparkles },
    { name: 'EduControl Futbolka', cost: 500, icon: ShoppingBag },
    { name: 'Kursga 10% Chegirma', cost: 1000, icon: Star },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Trophy size={140}/></div>
               <div className="relative z-10">
                  <h3 className="text-2xl font-black italic tracking-tighter mb-2 flex items-center gap-3">
                    <Crown className="text-amber-400" /> Leaderboard
                  </h3>
                  <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest opacity-80">Markazning eng faol 10 o'quvchisi</p>
               </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                {topStudents.map((student, idx) => (
                  <div key={student.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-3xl transition-all group">
                    <div className="flex items-center gap-5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                        idx === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 
                        idx === 1 ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                        idx === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-white text-slate-300 border border-slate-100'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-black text-slate-800 tracking-tight">{student.name}</h5>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Master Level</p>
                      </div>
                    </div>
                    <div className="bg-amber-50 px-5 py-2.5 rounded-2xl border border-amber-100 flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <Star size={18} className="text-amber-500 fill-amber-500" />
                      <span className="font-black text-amber-700 text-lg">{student.coins || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                   <ShoppingBag size={24} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">EduMarket</h3>
             </div>
             <div className="space-y-4">
                {rewards.map(reward => (
                  <div key={reward.name} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-200 hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-indigo-100">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <reward.icon size={22} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-800">{reward.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={12} className="text-amber-500 fill-amber-500" />
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{reward.cost} Coins</p>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gamification;
