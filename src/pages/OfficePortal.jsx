import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LockKeyhole, 
  ArrowRight, 
  Upload, 
  UserPlus, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  RefreshCw,
  FileSpreadsheet,
  Stethoscope,
  Trash2,
  User,
  Building2
} from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://health-center-backend-ksbv.onrender.com';

export default function OfficePortal() {
  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('office_authenticated') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  
  // Navigation Tabs: 'records', 'upload', 'doctors'
  const [activeTab, setActiveTab] = useState('records'); 
  const [consultations, setConsultations] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  
  // File Upload State
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Add Doctor State
  const [docName, setDocName] = useState('');
  const [docDept, setDocDept] = useState('');
  const [docStatus, setDocStatus] = useState('');
  const [docError, setDocError] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      const [consultRes, docRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/consultations`),
        axios.get(`${API_BASE_URL}/api/doctors`)
      ]);
      setConsultations(Array.isArray(consultRes.data) ? consultRes.data : []);
      setDoctorsList(Array.isArray(docRes.data) ? docRes.data : []);
    } catch (error) {
      console.error("Error fetching office portal data:", error);
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, fetchData]);

  // --- LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/office/login`, { 
        username: username.trim(), 
        password: password.trim() 
      });

      if (res.data && res.data.success) {
        setIsLoggedIn(true);
        sessionStorage.setItem('office_authenticated', 'true');
        fetchData();
      } else {
        setLoginError(res.data?.message || 'Invalid Office Credentials');
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid Office Credentials');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('office_authenticated');
    setUsername('');
    setPassword('');
    setConsultations([]);
    setDoctorsList([]);
  };

  // --- FILE UPLOAD HANDLER ---
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
  
    setUploadStatus('');
    setUploadError('');
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const res = await axios.post(
        'https://health-center-backend-ksbv.onrender.com/api/office/upload-students', 
        formData
      );
  
      if (res.data && res.data.success) {
        setUploadStatus(res.data.message);
        setFile(null);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload spreadsheet.');
    } finally {
      setIsUploading(false);
    }
  };

  // --- ADD DOCTOR HANDLER ---
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setDocStatus('');
    setDocError('');
    setIsAddingDoc(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/doctors`, { 
        name: docName.trim(), 
        department: docDept.trim() 
      });

      if (res.data && res.data.success) {
        setDocStatus(`Dr. ${docName.trim()} registered successfully!`);
        setDocName('');
        setDocDept('');
        fetchData();
      } else {
        setDocError(res.data?.message || 'Failed to register doctor.');
      }
    } catch (err) {
      setDocError(err.response?.data?.message || 'Failed to add doctor to the system.');
    } finally {
      setIsAddingDoc(false);
    }
  };

  // --- DELETE DOCTOR HANDLER ---
  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove Dr. ${name}?`)) return;

    try {
      const res = await axios.delete(`${API_BASE_URL}/api/doctors/${id}`);
      if (res.data && res.data.success) {
        setDocStatus(res.data.message || `Dr. ${name} removed.`);
        fetchData();
      }
    } catch (err) {
      setDocError(err.response?.data?.message || 'Failed to delete doctor.');
    }
  };

  // ==========================================
  // VIEW 1: AUTHENTICATION SCREEN (Matching Theme)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center my-16 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header matching Admin Portal */}
          <div className="bg-[#1e3a8a] p-8 text-center text-white">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md mb-3 border border-white/10">
              <LockKeyhole size={28} className="text-teal-300" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Office Portal</h2>
            <p className="text-xs text-blue-200 mt-1 uppercase tracking-wider font-semibold">
              Central University of Rajasthan Health Center
            </p>
          </div>

          <div className="p-8">
            {loginError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Username
                </label>
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="warden"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white outline-none transition text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Password
                </label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white outline-none transition text-sm text-slate-800"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingLogin}
                className="w-full mt-2 flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-white bg-[#1e3a8a] hover:bg-blue-900 transition font-bold text-sm disabled:opacity-50"
              >
                {isSubmittingLogin ? "Verifying..." : "Secure Login"} 
                <ArrowRight size={16} className="ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: DASHBOARD
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto my-8 px-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a] flex items-center gap-2">
            <Building2 className="text-[#0d9488]" size={28} />
            Office Administration Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Logged Consultations: <span className="font-bold text-slate-700">{consultations.length}</span> | 
            Active Doctors: <span className="font-bold text-[#0d9488]">{doctorsList.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData} 
            disabled={isLoadingRecords}
            className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-semibold text-xs"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoadingRecords ? "animate-spin" : ""} />
          </button>

          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition font-bold text-xs"
          >
            <LogOut size={16} className="mr-1.5" /> Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1.5">
          <button 
            onClick={() => setActiveTab('records')} 
            className={`flex items-center px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'records' 
                ? 'bg-[#1e3a8a] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="mr-2" size={16} /> Consultation History
          </button>

          <button 
            onClick={() => setActiveTab('upload')} 
            className={`flex items-center px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'upload' 
                ? 'bg-[#1e3a8a] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Upload className="mr-2" size={16} /> Bulk Upload Students
          </button>

          <button 
            onClick={() => setActiveTab('doctors')} 
            className={`flex items-center px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'doctors' 
                ? 'bg-[#1e3a8a] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="mr-2" size={16} /> Doctor Directory
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: CONSULTATION RECORDS */}
          {activeTab === 'records' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white text-[11px] uppercase tracking-wider font-bold">
                    <th className="p-4 rounded-tl-xl">Date & Time</th>
                    <th className="p-4">Patient ID</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Attending Doctor</th>
                    <th className="p-4">Symptoms</th>
                    <th className="p-4 rounded-tr-xl">Clinical Treatment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {consultations.length > 0 ? (
                    consultations.map((record) => (
                      <tr key={record.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800 block">
                            {new Date(record.consultation_date).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(record.consultation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[#1e3a8a]">{record.patient_id}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${record.is_student ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                            {record.is_student ? 'Student' : 'Staff/Other'}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-800">
                          Dr. {record.doctor_name || 'Unassigned'}
                        </td>
                        <td className="p-4 max-w-xs truncate" title={record.symptoms || ''}>
                          {record.symptoms || '—'}
                        </td>
                        <td className="p-4 max-w-xs truncate" title={record.treatment || ''}>
                          {record.treatment || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-slate-400">
                        No medical consultation entries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: BULK EXCEL UPLOAD */}
          {activeTab === 'upload' && (
            <div className="max-w-xl mx-auto py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-[#1e3a8a] mb-4">
                <FileSpreadsheet size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Import Student Directory</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                Upload an Excel file (<code className="text-[#1e3a8a] font-bold">.xlsx / .xls</code>) to sync students.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-left">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Required Excel Header Columns:
                </p>
                <code className="text-xs font-mono font-bold text-[#1e3a8a] block break-all">
                  college_id, full_name, email, mobile_number, hostel_name
                </code>
              </div>

              {uploadStatus && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle size={16} />
                  <span>{uploadStatus}</span>
                </div>
              )}

              {uploadError && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-4">
                <input 
                  id="student-excel-upload"
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={(e) => setFile(e.target.files[0])} 
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#1e3a8a] hover:file:bg-blue-100 cursor-pointer border border-slate-200 p-2 rounded-xl bg-slate-50" 
                />

                <button 
                  type="submit" 
                  disabled={!file || isUploading} 
                  className="w-full py-3.5 bg-[#0d9488] hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {isUploading ? "Uploading & Processing Data..." : "Upload & Sync Database"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: REGISTER & DELETE DOCTORS */}
          {activeTab === 'doctors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              {/* Add Doctor Form */}
              <div className="bg-slate-50/60 p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="text-[#1e3a8a]" size={20} />
                  <h3 className="text-base font-bold text-slate-800">Register New Doctor</h3>
                </div>

                {docStatus && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>{docStatus}</span>
                  </div>
                )}

                {docError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{docError}</span>
                  </div>
                )}

                <form onSubmit={handleAddDoctor} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Doctor Name (without 'Dr.')
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={docName} 
                      onChange={(e) => setDocName(e.target.value)} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none text-xs font-medium text-slate-800" 
                      placeholder="e.g. Ramesh Kumar" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Department / Specialization
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={docDept} 
                      onChange={(e) => setDocDept(e.target.value)} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none text-xs font-medium text-slate-800" 
                      placeholder="e.g. General Medicine, OPD" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isAddingDoc}
                    className="w-full py-3 bg-[#0d9488] hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-50"
                  >
                    {isAddingDoc ? "Registering..." : "Add Doctor to System"}
                  </button>
                </form>
              </div>

              {/* Active Doctors List with Delete Option */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope className="text-slate-700" size={20} />
                  <h3 className="text-base font-bold text-slate-800">
                    Active Registered Doctors ({doctorsList.length})
                  </h3>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {doctorsList.length > 0 ? (
                    doctorsList.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1e3a8a] font-bold flex items-center justify-center text-xs">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Dr. {doc.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{doc.department || 'General'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-slate-200/60 px-2 py-0.5 rounded text-slate-600">
                            ID: {doc.id}
                          </span>
                          <button
                            onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                            title="Remove Doctor"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">
                      No doctors registered in the database yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}