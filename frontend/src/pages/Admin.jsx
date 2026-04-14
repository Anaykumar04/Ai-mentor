import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  Database, 
  Terminal, 
  ShieldCheck, 
  X, 
  PlusCircle, 
  Briefcase 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PROBLEMS } from '../data/problems';

export default function Admin() {
  const [problems, setProblems] = useState(() => {
    const saved = localStorage.getItem('problem_library');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Purge old fake/default problems
      const hasFakeData = parsed.some(p => p.title === 'Two Sum' || p.title === 'Reverse String');
      if (hasFakeData) {
        localStorage.removeItem('problem_library');
        return [];
      }
      return parsed;
    }
    return [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [newProblem, setNewProblem] = useState({
    title: '',
    description: '',
    difficulty: 'Easy'
  });
  const [status, setStatus] = useState({ type: '', msg: '' });

  const syncStore = (updatedList) => {
    localStorage.setItem('problem_library', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('problemsUpdated'));
  };

  const handleAddProblem = (e) => {
    e.preventDefault();
    if (!newProblem.title || !newProblem.description) {
      setStatus({ type: 'error', msg: 'System: Title & Description Required' });
      return;
    }
    
    const newProb = { ...newProblem, id: Date.now() };
    const updated = [newProb, ...problems];
    setProblems(updated);
    syncStore(updated);
    setIsAdding(false);
    setNewProblem({ title: '', description: '', difficulty: 'Easy' });
    setStatus({ type: 'success', msg: 'System: Module Injected into Repository' });
    setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
  };

  const handleEditClick = (prob) => {
    setEditingProblem(prob);
    setNewProblem({ title: prob.title, description: prob.description, difficulty: prob.difficulty });
  };

  const handleUpdateProblem = (e) => {
    e.preventDefault();
    const updated = problems.map(p => p.id === editingProblem.id ? { ...p, ...newProblem } : p);
    setProblems(updated);
    syncStore(updated);
    setEditingProblem(null);
    setNewProblem({ title: '', description: '', difficulty: 'Easy' });
    setStatus({ type: 'success', msg: 'System: Module Updated Successfully' });
    setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
  };

  const deleteProblem = (id) => {
    const updated = problems.filter(p => p.id !== id);
    setProblems(updated);
    syncStore(updated);
    setStatus({ type: 'success', msg: 'System: Module Purged' });
    setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
  };

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'Easy').length,
    medium: problems.filter(p => p.difficulty === 'Medium').length,
    hard: problems.filter(p => p.difficulty === 'Hard').length,
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-10 pt-32 min-h-screen bg-[#02060f] font-main relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto w-full relative z-10">
        
        {/* Simplified Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <ShieldCheck className="text-cyan-400" size={32} />
                 <h1 className="text-3xl font-black text-white tracking-widest uppercase">Admin Authority Panel</h1>
              </div>
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.3em]">Direct Library & Architecture Control</p>
           </div>
           
           <button 
             onClick={() => setIsAdding(true)}
             className="cyan-glow-button px-8 py-4 rounded-xl text-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
           >
              <Plus size={18} /> New Challenge
           </button>
        </div>

        {status.msg && (
           <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in duration-300 ${
             status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
           }`}>
              {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{status.msg}</span>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-3">
              <div className="mentor-card bg-[#0a1a2f] p-6 border-white/5">
                 <div className="flex items-center gap-2 mb-6 text-cyan-400">
                    <Database size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Library Stats</span>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                       <span className="text-[10px] text-gray-500 font-bold uppercase">Total Modules</span>
                       <span className="text-2xl font-black text-white">{stats.total}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                       <span className="text-emerald-500">Easy</span>
                       <span className="text-white">{stats.easy}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                       <span className="text-amber-500">Medium</span>
                       <span className="text-white">{stats.medium}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                       <span className="text-rose-500">Hard</span>
                       <span className="text-white">{stats.hard}</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-9 space-y-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search pattern repository..."
                   className="w-full bg-[#0a1a2f] border border-white/5 rounded-xl py-4 pl-12 pr-6 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-bold placeholder:text-gray-700"
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              <div className="grid grid-cols-1 gap-3">
                 {filteredProblems.map(prob => (
                    <div key={prob.id} className="mentor-card bg-[#0a1a2f]/50 p-5 flex items-center justify-between border-white/5 hover:border-cyan-500/20 group transition-all">
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                             <span className={`text-[7px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${
                                prob.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : 
                                prob.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'
                             }`}>{prob.difficulty}</span>
                             <h3 className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{prob.title}</h3>
                          </div>
                          <p className="text-[10px] text-gray-500 font-bold line-clamp-1">{prob.description}</p>
                       </div>
                       <div className="flex items-center gap-2">
                          <button onClick={() => handleEditClick(prob)} className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-cyan-500 hover:text-black transition-all"><Edit size={14} /></button>
                          <button onClick={() => deleteProblem(prob.id)} className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-rose-500 hover:text-black transition-all"><Trash2 size={14} /></button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Simplified Modal */}
      {(isAdding || editingProblem) && (
         <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="mentor-card bg-[#0a1a2f] w-full max-w-lg border-cyan-500/30 p-8">
               <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                  <h2 className="text-md font-black text-white uppercase tracking-widest">{editingProblem ? 'Update Challenge' : 'New Challenge'}</h2>
                  <button onClick={() => { setIsAdding(false); setEditingProblem(null); }} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
               </div>
               
               <form onSubmit={editingProblem ? handleUpdateProblem : handleAddProblem} className="space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Title</label>
                     <input 
                       type="text" 
                       className="w-full bg-[#02060f] border border-white/5 rounded-xl py-3.5 px-5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all font-bold"
                       value={newProblem.title}
                       onChange={(e) => setNewProblem({...newProblem, title: e.target.value})}
                     />
                  </div>
                  
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Complexity</label>
                     <select 
                       className="w-full bg-[#02060f] border border-white/5 rounded-xl py-3.5 px-5 text-xs text-white focus:outline-none focus:border-cyan-500 outline-none appearance-none font-bold"
                       value={newProblem.difficulty}
                       onChange={(e) => setNewProblem({...newProblem, difficulty: e.target.value})}
                     >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                     </select>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Logical Path (Description)</label>
                     <textarea 
                       className="w-full bg-[#02060f] border border-white/5 rounded-xl py-3.5 px-5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all h-32 resize-none font-medium"
                       value={newProblem.description}
                       onChange={(e) => setNewProblem({...newProblem, description: e.target.value})}
                     />
                  </div>

                  <button type="submit" className="w-full py-4 cyan-glow-button text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95">
                     {editingProblem ? 'Confirm Update' : 'Initialize Challenge'}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
