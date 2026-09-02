import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import DoctorPortal from './pages/DoctorPortal';
import AdminDashboard from './pages/AdminDashboard';
import OfficePortal from './pages/OfficePortal';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-brand-gray">
        <Navbar />
        
        <main className="flex-grow container mx-auto px-4">
          <Routes>
            <Route path="/" element={<DoctorPortal />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/office" element={<OfficePortal />} />

            {/* Redirect legacy /warden URL to /office */}
            <Route path="/warden" element={<Navigate to="/office" replace />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <footer className="bg-white text-center p-4 text-sm text-gray-500 shadow-inner mt-auto">
          &copy; {new Date().getFullYear()} Central University of Rajasthan. All Medical Records Confidential.
        </footer>
      </div>
    </Router>
  );
}

export default App;