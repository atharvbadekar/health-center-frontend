import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Calendar, 
  Download, 
  Filter, 
  User, 
  LockKeyhole, 
  ArrowRight, 
  LogOut, 
  RefreshCw, 
  Activity,
  FileText
} from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://health-center-backend-ksbv.onrender.com';

export default function AdminDashboard() {
  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dashboard Data States
  const [consultations, setConsultations] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Filter States
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [consultRes, docRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/consultations`),
        axios.get(`${API_BASE_URL}/api/doctors`)
      ]);

      const consultData = Array.isArray(consultRes.data) ? consultRes.data : [];
      const docData = Array.isArray(docRes.data) ? docRes.data : [];

      setConsultations(consultData);
      setFilteredData(consultData);
      setDoctors(docData);
    } catch (error) {
      console.error("Error fetching admin records:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Fetch initial data if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, fetchData]);

  // --- LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/login`, { 
        username: username.trim(), 
        password: password.trim() 
      });

      if (res.data && res.data.success) {
        setIsLoggedIn(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        fetchData();
      } else {
        setLoginError(res.data?.message || 'Invalid Administrator Credentials');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid Administrator Credentials';
      setLoginError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('admin_authenticated');
    setUsername('');
    setPassword('');
    setConsultations([]);
    setFilteredData([]);
    setDoctors([]);
  };

  // --- APPLY FILTERS ---
  useEffect(() => {
    if (!isLoggedIn) return;

    let result = [...consultations];

    // 1. Doctor Filter
    if (selectedDoctor) {
      result = result.filter(c => {
        const docId = c.doctor_id !== null && c.doctor_id !== undefined ? String(c.doctor_id) : '';
        return docId === selectedDoctor;
      });
    }

    // 2. Start Date Filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(c => new Date(c.consultation_date) >= start);
    }

    // 3. End Date Filter
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(c => new Date(c.consultation_date) <= end);
    }

    setFilteredData(result);
  }, [selectedDoctor, startDate, endDate, consultations, isLoggedIn]);

  // --- EXPORT PDF REPORT ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Document Title Header
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138); 
    doc.text('Central University of Rajasthan', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.text('Health Center — Medical Consultations Report', 14, 28);
    
    // Meta Information
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    const filterInfo = selectedDoctor ? `Filtered by Doctor ID: ${selectedDoctor}` : 'All Doctors';
    doc.text(`Generated on: ${new Date().toLocaleString()} | Scope: ${filterInfo}`, 14, 35);

    // Table Data Structure
    const tableColumn = ["Date", "Patient ID", "Category", "Doctor", "Symptoms", "Treatment", "Prescription"];
    const tableRows = filteredData.map(c => [
      new Date(c.consultation_date).toLocaleDateString(),
      c.patient_id || 'N/A',
      c.is_student ? 'Student' : 'Staff/Other',
      c.doctor_name ? `Dr. ${c.doctor_name}` : 'Unassigned',
      c.symptoms || '—',
      c.treatment || '—',
      c.prescription || '—'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const fileDate = new Date().toISOString().split('T')[0];
    doc.save(`CURAJ_Health_Records_${fileDate}.pdf`);
  };

  // ==========================================
  // VIEW 1: AUTHENTICATION SCREEN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-8 text-center text-white">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md mb-3">
              <LockKeyhole size={28} className="text-teal-300" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Admin Portal</h2>
            <p className="text-xs text-blue-200 mt-1 uppercase tracking-wider font-semibold">
              Central University of Rajasthan Health Center
            </p>
          </div>

          <div className="p-8">
            {loginError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl text-center font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Username
                </label>
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="admin"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white outline-none transition text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Password
                </label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white outline-none transition text-sm text-slate-800"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-2 flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-white bg-blue-900 hover:bg-blue-800 transition font-bold text-sm disabled:opacity-50"
              >
                {isSubmitting ? "Authenticating..." : "Secure Login"} 
                <ArrowRight size={16} className="ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: RECORDS DASHBOARD
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto my-8 px-4 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-900" size={28} />
            Medical Records Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Total Consultations: <span className="font-bold text-slate-700">{consultations.length}</span> | 
            Filtered Matches: <span className="font-bold text-blue-900">{filteredData.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={fetchData} 
            disabled={isLoadingData}
            className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-semibold text-xs"
            title="Refresh Records"
          >
            <RefreshCw size={16} className={isLoadingData ? "animate-spin" : ""} />
          </button>

          <button 
            onClick={downloadPDF} 
            disabled={filteredData.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition font-bold text-xs disabled:opacity-50"
          >
            <Download size={16} className="mr-2" /> Export PDF
          </button>

          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition font-bold text-xs"
          >
            <LogOut size={16} className="mr-1.5" /> Logout
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-wider text-slate-400">
          <Filter size={14} /> Filter Database Records
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
              <User size={14} className="mr-1 text-slate-400" /> Prescribing Doctor
            </label>
            <select 
              value={selectedDoctor} 
              onChange={(e) => setSelectedDoctor(e.target.value)} 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-medium text-slate-700"
            >
              <option value="">All Doctors ({doctors.length})</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.name} ({doc.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
              <Calendar size={14} className="mr-1 text-slate-400" /> From Date
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-medium text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
              <Calendar size={14} className="mr-1 text-slate-400" /> To Date
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-medium text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold">
                <th className="p-4">Date & Time</th>
                <th className="p-4">Patient ID</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">Symptoms</th>
                <th className="p-4">Diagnosis / Treatment</th>
                <th className="p-4">Prescription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {filteredData.length > 0 ? (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 block">
                        {new Date(record.consultation_date).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(record.consultation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-blue-950 whitespace-nowrap">
                      {record.patient_id}
                      <span className={`block text-[10px] font-medium ${record.is_student ? 'text-teal-600' : 'text-slate-400'}`}>
                        {record.is_student ? 'Student' : 'Staff / Other'}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-slate-800 whitespace-nowrap">
                      Dr. {record.doctor_name || 'Unassigned'}
                    </td>

                    <td className="p-4 max-w-xs truncate" title={record.symptoms || ''}>
                      {record.symptoms || '—'}
                    </td>

                    <td className="p-4 max-w-xs truncate" title={record.treatment || ''}>
                      {record.treatment || '—'}
                    </td>

                    <td className="p-4 max-w-xs truncate" title={record.prescription || ''}>
                      {record.prescription || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    <FileText className="mx-auto mb-2 text-slate-300" size={32} />
                    No consultation records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}