import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, CheckCircle, XCircle, Terminal, Brain, BarChart3, Binary, Target, Zap, Cpu, GraduationCap, Award, BookOpen } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

export default function Dashboard() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

  useEffect(() => {
    const handleUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('user')) || {});
    };
    window.addEventListener('userProfileUpdate', handleUpdate);
    
    const fetchProgress = async () => {
      try {
        const res = await axios.get(`${API_URL}/progress`);
        setProgress(res.data);
      } catch (error) {
        console.error('FETCH_ERROR', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
    return () => window.removeEventListener('userProfileUpdate', handleUpdate);
  }, []);

  const totalAttempts = progress.length;
  const successfulAttempts = progress.filter(p => p.status === 'Success').length;
  const successRate = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0;
  
  // Real Data Calculation: Weekly Throughput
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayLabel = days[d.getDay()];
        const count = progress.filter(p => {
            const pDate = new Date(p.createdAt);
            return pDate.toDateString() === d.toDateString();
        }).length;
        result.push({ day: dayLabel, count });
    }
    return result;
  };

  const weeklyData = getWeeklyData();
  const maxVal = Math.max(...weeklyData.map(d => d.count)) || 1;

  // Real Data Calculation: Streak
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

  // Real Data Calculation: Skill Mastery (Topics)
  const getSkillVectors = () => {
    // Problem categories can be inferred from titles or a map
    // For now, we simulate based on variety of solved items
    const solved = progress.filter(p => p.status === 'Success');
    return [
      { label: 'Data Structures', score: Math.min(Math.round(solved.length * 12.5), 95) },
      { label: 'Algorithms', score: Math.min(Math.round(solved.length * 8.4), 90) },
      { label: 'Logic & Math', score: Math.min(Math.round(solved.length * 15.2), 85) },
      { label: 'System Perf', score: Math.min(Math.round(solved.length * 5.1), 80) },
    ];
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto w-full max-w-7xl mx-auto pt-36">
      
      {/* Personalized Header Section */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-10">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
           <div className="w-16 h-16 md:w-24 md:h-24 bg-[#0a1a2f] border-2 border-cyan-500/50 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.2)] shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Cpu size={32} className="md:size-[40px] text-cyan-400" />
              )}
           </div>
           <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] md:text-[10px] font-black uppercase rounded-full mb-2 md:mb-3">
                 <Target size={12} /> System Status: ONLINE
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white leading-none mb-1 md:mb-2">
                {user.fullName || user.username || 'Engineer'} <span className="cyan-glow-text opacity-50">#ID</span>
              </h1>
              <p className="text-gray-500 text-[10px] md:text-sm font-bold uppercase tracking-widest">@{user.username || 'guest'}</p>
           </div>
        </div>

        <div className="w-full md:w-auto">
           <div className="mentor-card bg-[#0a1a2f] p-4 md:p-6 py-3 md:py-4 flex items-center gap-4 border-cyan-500/20">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400">
                 <Award size={18} md:size={20} />
              </div>
              <div className="flex flex-col text-right ml-auto md:text-left md:ml-0">
                 <span className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5 md:mb-1">Current Ranking</span>
                 <span className="text-lg md:text-xl font-black text-white tracking-widest">#1,204</span>
              </div>
           </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        {[
          { icon: <BookOpen size={16} />, label: 'Challenges', value: totalAttempts, suffix: 'Solves' },
          { icon: <CheckCircle size={16} />, label: 'Verified', value: successfulAttempts, suffix: 'Verified' },
          { icon: <Activity size={16} />, label: 'Mastery', value: `${successRate}%`, suffix: 'Success' },
          { icon: <Zap size={16} />, label: 'Streak', value: calculateStreak(), suffix: 'Days' }
        ].map((stat, i) => (
          <div key={i} className="mentor-card bg-[#08121e] p-4 md:p-6 hover:cyan-glow-border transition-all group">
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
               <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                  {stat.icon}
               </div>
               <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5 md:gap-2">
               <span className="text-xl md:text-3xl font-black text-white">{stat.value}</span>
               <span className="text-[8px] md:text-[10px] text-gray-600 font-bold uppercase">{stat.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
        {/* Weekly Progress Graph */}
        <div className="lg:col-span-2 mentor-card bg-[#08121e] p-6 md:p-8">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <h2 className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
              <BarChart3 size={18} className="text-emerald-400" />
              Intelligence Throughput
            </h2>
            <div className="flex gap-4">
               <span className="flex items-center gap-2 text-[8px] md:text-[10px] text-gray-500 font-bold">
                 <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500"></div> Solves
               </span>
            </div>
          </div>
          <div className="flex items-end justify-between h-48 md:h-56 gap-2 md:gap-4">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 md:gap-4 group">
                <div className="w-full relative flex flex-col items-center justify-end h-full">
                  <div 
                    className="w-full bg-emerald-500/10 border-t-2 border-emerald-500/30 rounded-t-sm md:rounded-t-lg transition-all duration-500 group-hover:bg-emerald-500/30 group-hover:border-emerald-400 relative" 
                    style={{ height: `${(d.count / maxVal) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-black text-[8px] md:text-[10px] font-black px-2 py-0.5 md:py-1 rounded shadow-xl whitespace-nowrap z-10">
                       {d.count} Logged
                    </div>
                  </div>
                </div>
                <span className="text-[9px] md:text-[11px] font-bold text-gray-500 uppercase">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Mastery breakdown */}
        <div className="mentor-card bg-[#08121e] p-6 md:p-8 flex flex-col">
          <h2 className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest flex items-center gap-3 mb-8 md:mb-10">
            <Brain size={18} className="text-cyan-400" />
            Skill Vectors
          </h2>
          <div className="space-y-6 md:space-y-8 flex-1">
            {getSkillVectors().map((topic, i) => (
              <div key={i} className="space-y-2 md:space-y-3">
                <div className="flex justify-between text-[9px] md:text-[11px] font-black uppercase tracking-widest text-gray-400">
                  <span>{topic.label}</span>
                  <span className="text-cyan-400">{topic.score}%</span>
                </div>
                <div className="w-full h-1 md:h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all duration-1000" 
                    style={{ width: `${topic.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submission Log Table */}
      <div className="mentor-card bg-[#08121e] overflow-hidden mb-12">
        <div className="px-6 md:px-8 py-4 md:py-5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <h2 className="text-[10px] md:text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
            <Binary size={18} className="text-cyan-400" />
            Archive Logs
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-white/[0.02]">
              <tr>
                <th className="px-6 md:px-8 py-3 md:py-4">Module</th>
                <th className="px-6 md:px-8 py-3 md:py-4">Environment</th>
                <th className="px-6 md:px-8 py-3 md:py-4">Status</th>
                <th className="px-6 md:px-8 py-3 md:py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-cyan-400 animate-pulse">
                       <Activity size={24} />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em]">Accessing Cryptographic Records...</span>
                    </div>
                  </td>
                </tr>
              ) : progress.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">
                     Zero Sessions Registered.
                  </td>
                </tr>
              ) : (
                progress.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 md:px-8 py-4 md:py-5 font-bold text-white text-[11px] md:text-sm group-hover:text-cyan-400 transition-colors">{item.problemTitle}</td>
                    <td className="px-6 md:px-8 py-4 md:py-5">
                      <span className="bg-cyan-500/5 text-cyan-400 px-2 md:px-3 py-0.5 md:py-1 rounded text-[8px] md:text-[10px] font-black uppercase border border-cyan-500/10">
                        {item.language}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-4 md:py-5">
                      {item.status === 'Success' ? (
                        <span className="text-emerald-400 flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[11px] font-black uppercase">
                          <CheckCircle size={12} className="md:size-[14px]" /> Verified
                        </span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[11px] font-black uppercase">
                          <XCircle size={12} className="md:size-[14px]" /> Attempted
                        </span>
                      )}
                    </td>
                    <td className="px-6 md:px-8 py-4 md:py-5 text-gray-600 text-[10px] text-right">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
