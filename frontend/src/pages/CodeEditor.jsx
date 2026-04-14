import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { 
  Send, Play, ChevronRight, Brain, Zap, Book,
  Terminal as TerminalIcon, CheckCircle, AlertCircle,
  X, Trash2, MessageSquare, Lightbulb, Code2,
  TrendingUp, ShieldAlert, RotateCcw, ArrowRight
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const LANG_CONFIG = {
  python:     { label: 'Python 3.10',     monaco: 'python',     starter: '# Write your Python code here\n\n' },
  javascript: { label: 'JavaScript ES6',  monaco: 'javascript', starter: '// Write your JavaScript code here\n\n' },
  java:       { label: 'Java 17',         monaco: 'java',       starter: '// Write your Java code here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n' },
  cpp:        { label: 'C++ 20',          monaco: 'cpp',        starter: '// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n' },
};

export default function CodeEditor() {
  const currentUser = JSON.parse(localStorage.getItem('user')) || null;

  const [problems, setProblems] = useState(() => {
    const saved = localStorage.getItem('problem_library');
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasFakeData = parsed.some(p => p.title === 'Two Sum' || p.title === 'Reverse String');
      if (hasFakeData) { localStorage.removeItem('problem_library'); return []; }
      return parsed;
    }
    return [];
  });

  // Initialize activeProblem from localStorage directly — fixes 'not showing after admin adds'
  const [activeProblem, setActiveProblem] = useState(() => {
    const saved = localStorage.getItem('problem_library');
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasFakeData = parsed.some(p => p.title === 'Two Sum' || p.title === 'Reverse String');
      if (!hasFakeData && parsed.length > 0) return parsed[0];
    }
    return null;
  });
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANG_CONFIG.python.starter);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showProblemList, setShowProblemList] = useState(false);
  const [isMentorVisible, setIsMentorVisible] = useState(false);

  // AI Analysis state
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI Mentor Chat
  const [mentorMessages, setMentorMessages] = useState([
    { role: 'ai', content: "👋 Hello! I'm your **AI Coding Mentor**.\n\nWrite your code and hit **Run** — I'll automatically analyze it and give you **step-by-step hints** if there are any bugs or errors.\n\nI will **never** give you the final answer. My job is to help you *think* and *solve* it yourself. Let's go! 🚀" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const mentorEndRef = useRef(null);
  const monacoRef = useRef(null);

  // Sync problems from Admin panel in real-time
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('problem_library');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProblems(parsed);
        // Auto-select first problem if none is active yet
        if (!activeProblem && parsed.length > 0) {
          setActiveProblem(parsed[0]);
        }
        // If current active problem was deleted, jump to first
        if (activeProblem && !parsed.find(p => p.id === activeProblem.id)) {
          setActiveProblem(parsed[0] || null);
        }
      } else {
        setProblems([]);
        setActiveProblem(null);
      }
    };
    window.addEventListener('problemsUpdated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('problemsUpdated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [activeProblem]);

  // Auto-select first problem when problems load for the first time
  useEffect(() => {
    if (problems.length > 0 && !activeProblem) {
      setActiveProblem(problems[0]);
    }
  }, [problems, activeProblem]);

  // Auto-scroll mentor chat
  useEffect(() => {
    mentorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mentorMessages]);

  // When language changes, update starter code only if editor is blank
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (!code.trim() || code === LANG_CONFIG[language].starter) {
      setCode(LANG_CONFIG[lang].starter);
    }
  };

  // Monaco editor setup
  const handleEditorWillMount = (monaco) => {
    monacoRef.current = monaco;
    monaco.editor.defineTheme('cyber-dark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: {
        'editor.background': '#02060f',
        'editorCursor.foreground': '#22d3ee',
        'editorLineNumber.foreground': '#22d3ee30',
        'editor.selectionBackground': '#22d3ee20',
        'editor.lineHighlightBackground': '#0a1a2f80',
      }
    });
  };

  // =============================================
  // CORE: Gemini AI Analysis
  // =============================================
  const runGeminiAnalysis = async (executionOutput = '', showInMentor = false) => {
    setIsAnalyzing(true);
    try {
      const res = await axios.post(`${API_URL}/analyze-code`, {
        problem: activeProblem?.title || 'General coding practice',
        code,
        error: executionOutput,
        language
      });
      const result = res.data;
      setAnalysis(result);

      if (showInMentor && result) {
        const hint = result.hints?.[0] || 'Try re-reading the problem statement carefully.';
        setMentorMessages(prev => [...prev, {
          role: 'ai',
          content: `🔍 **Bug Found:** ${result.errorFound}\n\n💡 **Hint #1:** ${hint}\n\n*Ask me for another hint if you need more guidance!*`
        }]);
        setIsMentorVisible(true);
      }
      return result;
    } catch (err) {
      console.error('Gemini error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // =============================================
  // Run Code → Auto-analyze with Gemini
  // =============================================
  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setOutput('⏳ Executing code...');
    setAnalysis(null);

    try {
      const res = await axios.post(`${API_URL}/run-code`, { code, language });
      const result = res.data;
      
      const stdout = result.stdout || '';
      const stderr = result.stderr || result.compile_output || '';
      const hasError = !!stderr;
      
      // Show raw execution output
      const displayOutput = hasError
        ? `❌ ERROR:\n${stderr}`
        : (stdout || '✅ Program executed with no output.');
      
      setOutput(displayOutput);

      // Always run Gemini analysis after execution
      const aiResult = await runGeminiAnalysis(displayOutput, hasError);
      
      // If error found, append Gemini's structured report
      if (hasError && aiResult) {
        setOutput(displayOutput + `\n\n━━━━ 🤖 AI MENTOR REPORT ━━━━\n📌 Issue: ${aiResult.errorFound}\n⚡ Tip: ${aiResult.optimizationTip}\n\n→ Check AI Mentor panel for step-by-step hints`);
      } else if (aiResult && !aiResult.isSuccess) {
        setOutput(displayOutput + `\n\n━━━━ 🤖 AI REVIEW ━━━━\n📌 ${aiResult.errorFound || 'Logic may need improvement.'}\n\n→ Check AI Mentor panel for guidance`);
      }
    } catch (err) {
      console.error('Execution Error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Check syntax and try again.';
      setOutput(`❌ Execution failed: ${errorMsg}`);
      await runGeminiAnalysis(`The code failed to execute. System error: ${errorMsg}`, true);
    } finally {
      setIsRunning(false);
    }
  };

  // =============================================
  // Submit Solution → Full Gemini verdict
  // =============================================
  const handleSubmit = async () => {
    if (!code.trim() || !activeProblem) return;
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/analyze-code`, {
        problem: activeProblem.title,
        code,
        error: output,
        language
      });
      const result = res.data;
      setAnalysis(result);

      // Save progress
      try {
        await axios.post(`${API_URL}/save-progress`, {
          problemTitle: activeProblem.title,
          language,
          code,
          status: result.isSuccess ? 'Success' : 'Attempted',
          userId: currentUser?.id
        });
      } catch (e) { /* silent */ }

      if (result.isSuccess) {
        setIsSubmitted(true);
      } else {
        setMentorMessages(prev => [...prev, {
          role: 'ai',
          content: `⚠️ **Not quite right yet!**\n\n**Issue detected:** ${result.errorFound}\n\n💡 **Hint:** ${result.hints?.[0] || 'Think about edge cases.'}\n\n*Keep going — you're making progress! Ask for another hint anytime.*`
        }]);
        setIsMentorVisible(true);
      }
    } catch (err) {
      setMentorMessages(prev => [...prev, { role: 'ai', content: 'Analysis temporarily offline. Please try again.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================
  // AI Mentor Chat — Hint Only, Never Solution
  // =============================================
  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setMentorMessages(prev => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    setIsTyping(true);

    const lower = text.toLowerCase();

    // Block solution requests
    if (lower.includes('solution') || lower.includes('full code') || lower.includes('answer') || lower.includes('complete code') || lower.includes('write the code')) {
      setMentorMessages(prev => [...prev, {
        role: 'ai',
        content: `🚫 **Mentor Protocol Active**\n\nI'm designed to help you *learn*, not to do the work for you. Giving you the answer would defeat the purpose!\n\nInstead, try asking:\n• *"Give me a hint"*\n• *"What's wrong with my code?"*\n• *"Explain the concept"*`
      }]);
      setIsTyping(false);
      return;
    }

    // Hint request
    if (lower.includes('hint') || lower.includes('stuck') || lower.includes('help') || lower.includes('another') || lower.includes('next')) {
      const nextLevel = (lower.includes('another') || lower.includes('next')) ? hintLevel + 1 : hintLevel;
      if (analysis?.hints?.[nextLevel]) {
        setMentorMessages(prev => [...prev, {
          role: 'ai',
          content: `💡 **Hint #${nextLevel + 1}:**\n\n${analysis.hints[nextLevel]}\n\n*Ask for "another hint" if you need more guidance. You have ${analysis.hints.length - nextLevel - 1} more hints available.*`
        }]);
        setHintLevel(nextLevel);
      } else {
        setMentorMessages(prev => [...prev, {
          role: 'ai',
          content: `💡 **All hints exhausted!**\n\nYou've gone through all available hints. At this point:\n1. Review the problem statement carefully\n2. Trace through your code step by step\n3. Run the code again to see fresh output\n\nYou can do this! 💪`
        }]);
      }
      setIsTyping(false);
      return;
    }

    // General question → fresh Gemini analysis with hint response
    try {
      const result = await runGeminiAnalysis(output, false);
      if (result) {
        const hintToGive = result.hints?.[hintLevel] || result.hints?.[0];
        setMentorMessages(prev => [...prev, {
          role: 'ai',
          content: `🧠 **Analysis:**\n${result.explanation}\n\n💡 **Guidance:**\n${hintToGive || 'Try running your code first to get more specific feedback.'}\n\n${result.optimizationTip ? `⚡ **Efficiency tip:** ${result.optimizationTip}` : ''}`
        }]);
      } else {
        setMentorMessages(prev => [...prev, { role: 'ai', content: 'Run your code first, then I can analyze it and give you specific hints!' }]);
      }
    } catch (e) {
      setMentorMessages(prev => [...prev, { role: 'ai', content: 'Please try again in a moment.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const selectProblem = (prob) => {
    setActiveProblem(prob);
    setShowProblemList(false);
    setIsSubmitted(false);
    setOutput('');
    setAnalysis(null);
    setHintLevel(0);
    setMentorMessages([{ role: 'ai', content: `📌 **Challenge loaded: ${prob.title}**\n\nRead the problem carefully, write your solution in the editor, then hit **Run** to get started.\n\nI'll automatically analyze your code and provide hints if needed. Good luck! 🎯` }]);
  };

  // =============================================
  // Empty State — No admin questions yet
  // =============================================
  if (problems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-6 bg-[#02060f] pt-20 text-center p-8">
        <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20 mb-2">
          <Book size={40} className="text-cyan-500/40" />
        </div>
        <h2 className="text-2xl font-black text-white">No Challenges Deployed</h2>
        <p className="text-gray-500 text-sm max-w-md">The Admin Authority has not added any challenges to the repository yet. Go to the Admin panel to deploy your first coding challenge.</p>
        <a href="/admin" className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2">
          Open Admin Panel <ArrowRight size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-20 h-screen bg-[#02060f] font-main overflow-hidden text-gray-300">

      {/* ── Top Controls Bar ── */}
      <div className="h-14 border-b border-cyan-500/10 px-4 flex items-center justify-between bg-[#08121e]/80 backdrop-blur-md shrink-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProblemList(true)}
            className="flex items-center gap-2 py-1.5 px-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-all"
          >
            <Book size={13} className="text-cyan-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest hidden sm:block">Browse {problems.length} Challenge{problems.length !== 1 ? 's' : ''}</span>
          </button>

          {activeProblem && (
            <>
              <div className="h-4 w-[1px] bg-white/10" />
              <h2 className="text-xs font-black text-white truncate max-w-[140px] sm:max-w-[220px]">{activeProblem.title}</h2>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase hidden sm:block ${
                activeProblem.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                activeProblem.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
              }`}>{activeProblem.difficulty}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-[#0a1a2f] border border-cyan-500/20 rounded-lg px-3 py-1.5 pr-7 text-[10px] font-black text-cyan-400 uppercase tracking-widest outline-none cursor-pointer"
            >
              {Object.entries(LANG_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key} className="bg-[#0a1a2f]">{cfg.label}</option>
              ))}
            </select>
            <ChevronRight size={10} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-cyan-500/50 pointer-events-none" />
          </div>

          {/* Clear Code */}
          <button onClick={() => setCode(LANG_CONFIG[language].starter)} className="p-2 bg-white/5 border border-white/5 rounded-lg text-gray-600 hover:text-rose-400 transition-all" title="Reset Code">
            <Trash2 size={13} />
          </button>

          {/* AI Mentor Toggle */}
          <button
            onClick={() => setIsMentorVisible(!isMentorVisible)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border transition-all text-[10px] font-black uppercase tracking-wider ${
              isMentorVisible ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-[#0a1a2f] border-cyan-500/30 text-cyan-400'
            }`}
          >
            <Brain size={13} />
            <span className="hidden sm:block">AI Mentor</span>
            {isAnalyzing && <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* ══════════════════════════════════════
            LEFT PANE: Problem + AI Analysis
        ══════════════════════════════════════ */}
        <div className="w-[28%] min-w-[220px] border-r border-white/5 bg-[#02060f] flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-5 flex-1">
            {!activeProblem ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <Book size={32} className="text-gray-700" />
                <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Select a challenge to begin</p>
                <button onClick={() => setShowProblemList(true)} className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-[10px] font-black uppercase">Browse Challenges</button>
              </div>
            ) : isSubmitted ? (
              /* ── SUCCESS STATE ── */
              <div className="animate-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle size={28} className="text-emerald-400 shrink-0" />
                  <div>
                    <h2 className="font-black text-white text-sm">Solution Accepted!</h2>
                    <p className="text-emerald-400 text-[10px] font-bold uppercase">+10 Mastery Points</p>
                  </div>
                </div>

                {analysis && (
                  <div className="space-y-4">
                    <div className="bg-[#08121e] p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={12} className="text-cyan-400" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">AI Score</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{analysis.score}</span>
                        <span className="text-gray-500 text-xs">/100</span>
                      </div>
                    </div>
                    <div className="bg-[#08121e] p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={12} className="text-amber-400" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Feedback</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{analysis.feedback}</p>
                    </div>
                    <div className="bg-[#08121e] p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={12} className="text-purple-400" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Optimization</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{analysis.optimizationTip}</p>
                    </div>
                  </div>
                )}

                <button onClick={() => { setIsSubmitted(false); setAnalysis(null); setOutput(''); }} className="w-full mt-6 py-3 bg-[#08121e] border border-white/5 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2">
                  <RotateCcw size={12} /> Try Another Problem
                </button>
              </div>
            ) : (
              /* ── PROBLEM + LIVE AI ANALYSIS ── */
              <div>
                <div className="mb-5 animate-in fade-in duration-300">
                  <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest mb-2 inline-block ${
                    activeProblem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                    activeProblem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>{activeProblem.difficulty}</span>
                  <h1 className="text-xl font-black text-white mb-3 leading-tight">{activeProblem.title}</h1>
                  <p className="text-xs text-gray-400 leading-relaxed">{activeProblem.description}</p>
                </div>

                {/* LIVE AI ANALYSIS PANEL - Shows after run */}
                {analysis && (
                  <div className="space-y-3 animate-in slide-in-from-bottom duration-300">
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent my-4" />
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">🤖 AI Analysis Report</p>

                    {/* Status */}
                    <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                      analysis.isSuccess ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                    }`}>
                      {analysis.isSuccess
                        ? <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                        : <ShieldAlert size={14} className="text-rose-400 shrink-0" />}
                      <p className={`text-[10px] font-bold ${analysis.isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {analysis.isSuccess ? 'Logic Correct ✓' : analysis.errorFound}
                      </p>
                    </div>

                    {/* Progressive Hints */}
                    {!analysis.isSuccess && analysis.hints?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-yellow-500/70 uppercase tracking-wider flex items-center gap-1.5">
                          <Lightbulb size={10} /> Guided Hints (No solutions given)
                        </p>
                        {analysis.hints.map((hint, i) => (
                          <div key={i} className={`p-3 rounded-lg border transition-all ${i <= hintLevel ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                            <p className="text-[9px] font-black text-amber-500/60 uppercase mb-1">Hint #{i + 1}</p>
                            <p className="text-[10px] text-gray-400 leading-relaxed">{i <= hintLevel ? hint : '🔒 Ask AI Mentor to unlock'}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Optimization */}
                    {analysis.optimizationTip && (
                      <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                        <p className="text-[9px] font-black text-purple-400 uppercase mb-1.5 flex items-center gap-1"><Zap size={10} /> Efficiency Note</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed">{analysis.optimizationTip}</p>
                      </div>
                    )}

                    {/* Score */}
                    <div className="flex items-center justify-between p-3 bg-[#08121e] rounded-xl border border-white/5">
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">AI Score</span>
                      <span className={`text-lg font-black ${analysis.score >= 70 ? 'text-emerald-400' : analysis.score >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{analysis.score}<span className="text-gray-600 text-xs">/100</span></span>
                    </div>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                    </div>
                    <span className="text-[10px] text-cyan-400 font-bold">Gemini analyzing your code...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════
            CENTER: Code Editor + Output
        ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={LANG_CONFIG[language].monaco}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="cyber-dark"
              beforeMount={handleEditorWillMount}
              onMount={() => {}}
              options={{
                fontSize: 14,
                fontFamily: '"Fira Code", "Cascadia Code", monospace',
                fontLigatures: true,
                minimap: { enabled: false },
                padding: { top: 20, bottom: 20 },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                renderLineHighlight: 'all',
                bracketPairColorization: { enabled: true },
                suggestOnTriggerCharacters: true,
              }}
            />
          </div>

          {/* Execution Output Panel */}
          <div className="h-44 border-t border-white/5 bg-[#08121e] flex flex-col shrink-0">
            <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                <TerminalIcon size={12} className="text-emerald-500" />
                Execution Output
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning || !activeProblem}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play size={11} fill="currentColor" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !activeProblem}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={11} />
                  {isSubmitting ? 'Analyzing...' : 'Submit'}
                </button>
                {output && (
                  <button onClick={() => setOutput('')} className="p-1 text-gray-600 hover:text-white transition-colors" title="Clear output">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            <pre className="flex-1 p-4 text-xs font-mono text-gray-300 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
              {output || <span className="text-gray-700">Click "Run Code" to execute → Output and AI analysis will appear here</span>}
            </pre>
          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT PANE: AI Mentor Chat
        ══════════════════════════════════════ */}
        {isMentorVisible && (
          <div className="w-[28%] min-w-[240px] border-l border-white/5 bg-[#060e1a] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Mentor Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <Brain size={14} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wider">AI Mentor</p>
                  <p className="text-[8px] text-cyan-400/60 font-bold">Hints Only · Powered by Gemini</p>
                </div>
              </div>
              <button onClick={() => setIsMentorVisible(false)} className="text-gray-600 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {mentorMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-xl px-3 py-2.5 text-[11px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 text-white border border-cyan-500/20'
                      : 'bg-[#0a1a2f] text-gray-300 border border-white/5'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#0a1a2f] border border-white/5 rounded-xl px-3 py-2.5 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                  </div>
                </div>
              )}
              <div ref={mentorEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-3 py-2 border-t border-white/5 flex gap-2 flex-wrap">
              {['Give me a hint', 'Explain the error', 'Next hint'].map(q => (
                <button key={q} onClick={() => { setChatInput(q); }} className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all font-bold">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 flex gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask for a hint..."
                className="flex-1 bg-[#0a1a2f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 placeholder:text-gray-700 font-medium"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isTyping}
                className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          Problem Selection Overlay
      ══════════════════════════════════════ */}
      {showProblemList && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#08121e] border border-cyan-500/20 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Challenge Library</h2>
                <p className="text-gray-600 text-[10px] font-bold mt-0.5">{problems.length} challenges deployed by admin</p>
              </div>
              <button onClick={() => setShowProblemList(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
              {problems.map((prob, i) => (
                <button
                  key={prob.id || i}
                  onClick={() => selectProblem(prob)}
                  className={`text-left p-4 bg-black/30 border rounded-xl hover:border-cyan-500/40 transition-all group ${activeProblem?.id === prob.id ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-white/5'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-gray-600 tracking-[0.2em]">#{String(i + 1).padStart(3, '0')}</span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                      prob.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                      prob.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>{prob.difficulty}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">{prob.title}</h3>
                  <p className="text-[10px] text-gray-600 line-clamp-2 leading-relaxed">{prob.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,211,238,0.3); }
      `}</style>
    </div>
  );
}
