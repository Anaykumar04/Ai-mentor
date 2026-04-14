import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, ChevronRight, Cpu, Sparkles, Fingerprint } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication Failed: Network Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#02060f] flex items-center justify-center p-6 relative overflow-hidden selection:bg-cyan-500/30 font-main pt-20">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-[440px] relative z-10">
        
        {/* Branding */}
        <div className="text-center mb-10">
           <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
              <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all">
                 <Cpu size={24} className="text-black" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">CodeMentor <span className="text-cyan-400">AI</span></span>
           </Link>
           <p className="text-gray-500 text-sm font-bold tracking-wide uppercase">Identity Verification Required</p>
        </div>

        {/* Login Card */}
        <div className="mentor-card bg-[#08121e]/90 p-1 relative overflow-hidden">
           {/* Inner scan line effect markup */}
           <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse"></div>

           <div className="p-8 md:p-10 bg-[#0a1a2f] border border-white/5 space-y-8 rounded-[21px]">
             
             <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                   <Fingerprint size={16} className="text-cyan-400" />
                   <h1 className="text-xs font-black text-white uppercase tracking-[0.2em]">Secure Access</h1>
                </div>
                <Sparkles size={14} className="text-cyan-500/20" />
             </div>
             
             {error && (
               <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 rounded-lg animate-shake">
                 <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                 {error}
               </div>
             )}

             <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Username / Identifier</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-cyan-400 transition-colors" size={16} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your handle..."
                      className="w-full bg-[#02060f]/60 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:cyan-glow-border transition-all placeholder:text-gray-700 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Passcode</label>
                    <a href="#" className="text-[9px] text-gray-600 font-bold hover:text-cyan-400 transition-colors uppercase tracking-widest">Forgot?</a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-cyan-400 transition-colors" size={16} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#02060f]/60 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:cyan-glow-border transition-all placeholder:text-gray-700"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full cyan-glow-button h-14 rounded-xl text-black font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Authenticate Session
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-[1px] bg-white/5"></div>
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">OR</span>
                  <div className="flex-1 h-[1px] bg-white/5"></div>
                </div>

                <button
                  type="button"
                  className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-3 hover:bg-white/[0.08] transition-all active:scale-[0.98]"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                  Continue with Google
                </button>
             </form>
             
             <div className="pt-6 border-t border-white/5 text-center">
                <div className="text-gray-500 text-[11px] font-bold flex flex-wrap items-center justify-center gap-2">
                  <span>New engineer?</span>
                  <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors font-black uppercase tracking-widest">
                     Join Laboratory
                  </Link>
                  <span className="text-white/10">|</span>
                  <Link to="/admin" className="text-gray-700 hover:text-white transition-colors font-black uppercase tracking-widest text-[9px]">
                     Admin Authority
                  </Link>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
