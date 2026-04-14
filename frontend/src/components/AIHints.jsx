import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function AIHints({ analysis, loading }) {
  if (loading) {
    return (
      <div className="flex-1 bg-gray-900/50 p-6 flex flex-col items-center justify-center border-l border-gray-800 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-400 animate-pulse">AI Mentor is analyzing your code...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex-1 bg-gray-900/50 p-6 flex flex-col items-center justify-center border-l border-gray-800 backdrop-blur-sm text-center">
        <Lightbulb size={48} className="text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Need a hint?</h3>
        <p className="text-gray-500 max-w-xs">Run the AI analyzer to get step-[...by]-step hints, error explanations, and optimization tips.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900/50 flex flex-col border-l border-gray-800 overflow-y-auto">
      <div className="p-4 border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
          <Lightbulb size={20} />
          AI Mentor Feedback
        </h2>
        {analysis.score && (
          <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
            <span className="text-sm text-indigo-300 font-medium">Score:</span>
            <span className={`font-bold ${analysis.score > 80 ? 'text-green-400' : analysis.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {analysis.score}/100
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {analysis.errorFound && analysis.errorFound !== 'None' && analysis.errorFound !== 'None reported' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold flex items-center gap-2 mb-2">
              <AlertTriangle size={18} />
              Issue Detected
            </h3>
            <p className="text-red-200 text-sm leading-relaxed">{analysis.errorFound}</p>
          </div>
        )}

        {analysis.hints && analysis.hints.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-gray-300 font-semibold text-sm uppercase tracking-wider">Guided Hints</h3>
            <div className="space-y-3">
              {analysis.hints.map((hint, i) => (
                <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex gap-3 transition-all hover:bg-gray-800 hover:border-gray-600">
                  <div className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.explanation && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-2">Explanation</h3>
            <p className="text-blue-100/80 text-sm leading-relaxed">{analysis.explanation}</p>
          </div>
        )}

        {analysis.optimizationTip && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4">
            <h3 className="text-emerald-400 font-semibold flex items-center gap-2 mb-2">
              <TrendingUp size={18} />
              Optimization Tip
            </h3>
            <p className="text-emerald-100/80 text-sm leading-relaxed">{analysis.optimizationTip}</p>
          </div>
        )}

        {analysis.feedback && (
          <div className="bg-gray-800/80 rounded-lg p-4 text-center">
            <p className="text-gray-300 italic">"{analysis.feedback}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
