import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cpu, LogOut, User as UserIcon, Bell, ChevronRight, Activity } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        // threshold 80px before hiding
        if (window.scrollY > lastScrollY && window.scrollY > 80) { 
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentUser(JSON.parse(localStorage.getItem('user')));
    };

    window.addEventListener('userProfileUpdate', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('userProfileUpdate', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 h-20 px-4 md:px-10 flex items-center justify-between z-50 bg-[#02060f]/60 backdrop-blur-xl border-b border-cyan-500/10 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="flex items-center gap-4 md:gap-12">
        <Link to="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]">
             <Cpu size={20} className="text-black md:scale-110" />
          </div>
          <span className="text-lg md:text-2xl font-black tracking-tighter text-white flex items-center">
            CodeMentor<span className="text-cyan-400 ml-1">AI</span>
          </span>
        </Link>
        
        {/* Central Links (Hidden on Landing & Auth Pages) */}
        {!['/', '/login', '/signup'].includes(location.pathname) && (
          <div className="hidden lg:flex items-center gap-8 ml-8">
            <Link to="/dashboard" className={`text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/dashboard' ? 'text-cyan-400 cyan-glow-text' : 'text-gray-500 hover:text-white'}`}>Dashboard</Link>
            <Link to="/editor" className={`text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/editor' ? 'text-cyan-400 cyan-glow-text' : 'text-gray-500 hover:text-white'}`}>Practice Hub</Link>
            {currentUser?.username === 'admin' && (
              <Link to="/admin" className={`text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/admin' ? 'text-cyan-400 cyan-glow-text' : 'text-gray-500 hover:text-white'}`}>Admin</Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {!currentUser ? (
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block px-5 py-1.5 text-gray-500 text-xs font-bold hover:text-white transition-all">
              Sign in
            </Link>
            <Link to="/signup" className="px-5 py-2 bg-cyan-500 text-black text-[10px] font-black uppercase rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all">
              Join Now
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3 bg-black/40 border border-cyan-500/20 rounded-2xl p-1.5 px-3 md:px-4 shadow-lg">
               <Link to="/profile" className="flex items-center gap-2 md:gap-3 group">
                  <div className="flex flex-col items-end mr-1 md:mr-2">
                     <span className="text-[10px] md:text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">{currentUser.username}</span>
                     <span className="hidden xs:block text-[8px] md:text-[10px] text-cyan-400 font-bold uppercase tracking-widest opacity-70">Level 12 Dev</span>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[#02060f] rounded-full border border-cyan-500/50 flex items-center justify-center overflow-hidden group-hover:cyan-glow-border transition-all shrink-0">
                     {currentUser.avatar ? (
                       <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                       <UserIcon size={16} className="text-cyan-400 md:scale-125" />
                     )}
                  </div>
               </Link>
               <button 
                 onClick={handleLogout}
                 className="p-2 text-gray-500 hover:text-rose-500 transition-colors shrink-0"
                 title="Disconnect Session"
               >
                 <LogOut size={16} />
               </button>
            </div>
          </div>
        )}
      </div>

      {!currentUser && (
        <div className="flex sm:hidden">
           <Link to="/login" className="px-4 py-1.5 bg-cyan-500 border border-cyan-500 text-black text-[10px] font-black uppercase rounded-lg">
             Sign in
           </Link>
        </div>
      )}
    </nav>
  );
}
