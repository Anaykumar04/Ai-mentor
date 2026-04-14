import { Terminal } from 'lucide-react';

export default function CodeOutput({ output, loading }) {
  return (
    <div className="flex-1 flex flex-col bg-black border-t border-gray-800">
      <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center px-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
          <Terminal size={16} />
          Terminal Output
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            Executing...
          </div>
        ) : !output ? (
          <div className="text-gray-600 italic">Result will appear here after execution...</div>
        ) : (
          <div className="space-y-2">
            {output.stdout && (
              <div className="text-gray-300 whitespace-pre-wrap">{output.stdout}</div>
            )}
            {output.stderr && (
              <div className="text-red-400 whitespace-pre-wrap">{output.stderr}</div>
            )}
            {output.compile_output && (
              <div className="text-yellow-400 whitespace-pre-wrap">{output.compile_output}</div>
            )}
            {output.error && (
              <div className="text-red-500 whitespace-pre-wrap">{output.error}</div>
            )}
            {output.status && (
              <div className={`mt-4 pt-2 border-t border-gray-800/50 inline-block ${output.status.description === 'Accepted' || output.status.description === 'Done' ? 'text-green-500' : 'text-red-500'}`}>
                Process exited with status: {output.status.description}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
