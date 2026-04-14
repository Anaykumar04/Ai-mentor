import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CodeEditor from './pages/CodeEditor';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[var(--bg-dark)] text-gray-50 flex flex-col font-main selection:bg-cyan-500/20">
        <Navbar />
        <main className="flex-grow flex flex-col pt-0">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/editor" element={<CodeEditor />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
