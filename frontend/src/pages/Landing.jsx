import { Link } from 'react-router-dom';
import { Sparkles, Terminal, Zap, Brain, Cpu, Database, ChevronRight, Binary, Layout, Globe, Star } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex-1 bg-[#02060f] overflow-y-auto selection:bg-cyan-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mb-10 animate-fade-in">
            <Sparkles size={14} className="animate-pulse" />
            Empowering the next generation of engineers
          </div>
          
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-tight tracking-tight">
            The AI Mentor for <br />
            <span className="cyan-glow-text">Engineering Mastery</span>
          </h1>
          
          <p className="text-gray-400 text-base md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
            Move beyond static solutions. Build deep algorithmic intuition with a <span className="text-cyan-400 font-bold">personalized AI assistant</span> that guides you step-by-step through complex challenges.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/signup" className="cyan-glow-button px-10 py-4 rounded-xl flex items-center gap-3 text-sm tracking-widest uppercase">
              Start Learning Now <ChevronRight size={18} />
            </Link>
            <Link to="/editor" className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-xl flex items-center gap-3 text-sm tracking-widest uppercase hover:bg-white/10 transition-all">
              Try the Editor
            </Link>
          </div>

          {/* Feature Showcase Grid */}
          <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Brain className="text-cyan-400" />, 
                title: "Personalized Guidance", 
                desc: "Our AI doesn't just give answers. It identifies your friction points and provides pedagogical hints tailored to your logic." 
              },
              { 
                icon: <Layout className="text-cyan-400" />, 
                title: "Evolutionary Architecture", 
                desc: "Visualize your progress from raw draft to optimized solution with our unique logic tracking interface." 
              },
              { 
                icon: <Zap className="text-cyan-400" />, 
                title: "Instant Blueprinting", 
                desc: "Convert abstract problems into logical flowcharts automatically, helping you visualize the solution before writing a single line." 
              }
            ].map((feature, i) => (
              <div key={i} className="mentor-card bg-[#08121e] p-8 text-left hover:scale-[1.02] transition-all cursor-default group">
                <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:cyan-glow-border transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mentor-card bg-gradient-to-br from-[#0a1a2f] to-[#02060f] p-12 md:p-20 text-center relative overflow-hidden">
             <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to solve your next challenge?</h2>
                <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">Join thousands of developers leveling up their skills with CodeMentor AI.</p>
                <Link to="/signup" className="cyan-glow-button px-12 py-5 rounded-2xl inline-flex items-center gap-3">
                  Become a Pro <ChevronRight size={20} />
                </Link>
             </div>
             {/* Decorative glow */}
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-black/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-gray-500 text-sm">
          <div className="col-span-1 md:col-span-2 space-y-6">
             <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                   <Cpu size={24} className="text-black" />
                </div>
                <span className="text-xl font-bold">CodeMentor AI</span>
             </div>
             <p className="max-w-sm">The world's most advanced AI-powered environment for learning computer science and algorithmic engineering.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link to="/editor" className="hover:text-cyan-400 transition-colors">Practice Hub</Link></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Challenges</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-xs text-gray-600">
           <p>© 2026 CodeMentor AI. All rights reserved.</p>
           <div className="flex gap-6">
              <Globe size={16} />
              <Star size={16} />
           </div>
        </div>
      </footer>
    </div>
  );
}
