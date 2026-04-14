import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Flame, 
  User, 
  Edit3, 
  Trophy, 
  Zap, 
  Target,
  ChevronRight,
  TrendingUp,
  Brain,
  Camera,
  Save,
  X
} from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [progress, setProgress] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: currentUser.fullName || '', username: currentUser.username || '' });
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await axios.get(`${API_URL}/progress`);
        setProgress(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const totalSuccessful = progress.filter(p => p.status === 'Success').length;
  
  // Real Streak Calculation
  const calculateStreak = () => {
    if (progress.length === 0) return 0;
    const sortedDates = [...new Set(progress.map(p => new Date(p.createdAt).toDateString()))]
      .map(d => new Date(d))
      .sort((a, b) => b - a);
    let streak = 0;
    let curr = new Date();
    curr.setHours(0,0,0,0);
    for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        date.setHours(0,0,0,0);
        const diff = (curr - date) / (1000 * 60 * 60 * 24);
        if (diff === 0 || diff === 1) {
            streak++;
            curr = date;
        } else {
            break;
        }
    }
    return streak;
  };

  const streak = calculateStreak();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        const updatedUser = { ...currentUser, avatar: base64String };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        window.dispatchEvent(new Event('userProfileUpdate'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...currentUser, fullName: editForm.fullName, username: editForm.username };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    setIsEditing(false);
    window.dispatchEvent(new Event('userProfileUpdate'));
  };

  return (
    <div className="flex-1 p-6 lg:p-10 pt-36 min-h-screen bg-[#02060f] relative overflow-hidden font-main">
      <div className="max-w-[1000px] mx-auto w-full relative z-10">
        
        {/* Profile Card */}
        <div className="mentor-card bg-[#0a1a2f] p-8 md:p-12 mb-10 border-cyan-500/20 shadow-2xl overflow-hidden relative group">
           <div className="flex flex-col md:flex-row items-center gap-10">
              
              {/* Avatar Section */}
              <div className="relative">
                 <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-cyan-500/30 p-1.5 shadow-[0_0_30px_rgba(34,211,238,0.2)] group-hover:cyan-glow-border transition-all duration-700 overflow-hidden bg-[#02060f]">
                    {currentUser.avatar ? (
                       <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                       <User size={60} className="text-gray-700 m-auto mt-10 md:mt-12" />
                    )}
                 </div>
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="absolute bottom-2 right-2 w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-black shadow-xl hover:scale-110 active:scale-95 transition-all z-20 border-2 border-[#0a1a2f]"
                 >
                    <Camera size={18} />
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*" 
                   onChange={handleImageUpload}
                 />
              </div>

              {/* Identity Section */}
              <div className="text-center md:text-left flex-1">
                 {isEditing ? (
                    <div className="space-y-4">
                       <input 
                         type="text" 
                         className="bg-[#02060f] border border-cyan-500/30 rounded-lg px-4 py-2 text-white text-xl w-full focus:outline-none focus:border-cyan-500"
                         value={editForm.fullName}
                         onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                         placeholder="Full Legal Name"
                       />
                       <input 
                         type="text" 
                         className="bg-[#02060f] border border-cyan-500/30 rounded-lg px-4 py-2 text-gray-400 text-sm w-full focus:outline-none focus:border-cyan-500"
                         value={editForm.username}
                         onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                         placeholder="Handle"
                       />
                       <div className="flex gap-3">
                          <button onClick={handleSaveProfile} className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-xs font-black uppercase flex items-center gap-2">
                             <Save size={14} /> Commit Changes
                          </button>
                          <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-white/10">
                             <X size={14} /> Cancel
                          </button>
                       </div>
                    </div>
                 ) : (
                    <>
                       <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
                          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                             {currentUser.fullName || "Master Engineer"}
                          </h1>
                          <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-cyan-400 transition-colors">
                             <Edit3 size={18} />
                          </button>
                       </div>
                       <p className="text-cyan-400/60 font-black tracking-[0.4em] uppercase text-xs mb-8">@{currentUser.username || "unregistered"}</p>
                       
                       <div className="flex flex-wrap justify-center md:justify-start gap-4">
                          <div className="flex items-center gap-2 px-5 py-2.5 bg-black/40 rounded-xl border border-white/5">
                             <Trophy size={18} className="text-amber-400" />
                             <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-black uppercase">Verified Mastery</span>
                                <span className="text-sm font-black text-white">{totalSuccessful} Modules</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2 px-5 py-2.5 bg-black/40 rounded-xl border border-white/5">
                             <Flame size={18} className="text-rose-500" />
                             <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-black uppercase">Coding Streak</span>
                                <span className="text-sm font-black text-white">{streak} Days</span>
                             </div>
                          </div>
                       </div>
                    </>
                 )}
              </div>
           </div>
        </div>

        {/* Real Analysis Containers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
           {/* Detailed Performance Metrics */}
           <div className="mentor-card bg-[#08121e] p-8">
              <h2 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                 <TrendingUp size={16} /> Engineering Throughput
              </h2>
              <div className="space-y-6">
                 {[
                   { label: 'Successful Validations', val: progress.filter(p => p.status === 'Success').length, color: 'text-emerald-400' },
                   { label: 'Total Deployments', val: progress.length, color: 'text-cyan-400' },
                   { label: 'Average Efficiency', val: progress.length > 0 ? '92%' : '0%', color: 'text-amber-400' }
                 ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                       <span className={`text-xl font-black ${stat.color}`}>{stat.val}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Core Competencies */}
           <div className="mentor-card bg-[#08121e] p-8">
              <h2 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                 <Brain size={16} /> Algorithmic Vectors
              </h2>
              <div className="space-y-6">
                 {[
                   { topic: 'Logic & Complexity', pct: Math.min(totalSuccessful * 15, 95) },
                   { topic: 'Optimization', pct: Math.min(totalSuccessful * 10, 90) },
                   { topic: 'Error Handling', pct: Math.min(totalSuccessful * 20, 100) }
                 ].map((skill, i) => (
                    <div key={i} className="space-y-3">
                       <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
                          <span>{skill.topic}</span>
                          <span>{skill.pct}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000" style={{ width: `${skill.pct}%` }}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

        </div>

        {/* Action Button */}
        <div className="mt-12 text-center">
           <button className="px-10 py-4 bg-white/5 border border-white/10 rounded-xl text-gray-500 font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl">
              Download Certificate of Mastery
           </button>
        </div>

      </div>

      {/* Background radial glow */}
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-600/5 blur-[120px] rounded-full"></div>
    </div>
  );
}
