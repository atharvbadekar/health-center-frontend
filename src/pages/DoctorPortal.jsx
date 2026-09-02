import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  UserCheck,
  Phone,
  Fingerprint,
  ArrowRight,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Stethoscope,
  FileText,
  Download
} from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://health-center-backend-ksbv.onrender.com';

// Safe wrapper for jspdf-autotable compatible with all Vite/Webpack builds
const applyAutoTable = (doc, options) => {
  if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  } else if (typeof autoTable === 'function') {
    autoTable(doc, options);
  } else if (autoTable && typeof autoTable.default === 'function') {
    autoTable.default(doc, options);
  } else {
    throw new Error('autoTable plugin could not be initialized');
  }
};

export default function DoctorPortal() {
  const [isStudent, setIsStudent] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState(1);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  const [formData, setFormData] = useState({
    symptoms: '',
    treatment: '',
    prescription: '',
    notes: ''
  });

  // Stores snapshot of saved data for generating the PDF
  const [savedConsultationData, setSavedConsultationData] = useState(null);

  // ==========================================================================
  // FETCH DOCTORS
  // ==========================================================================

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/doctors`);
        const docList = Array.isArray(res.data) ? res.data : [];
        setDoctors(docList);

        if (docList.length > 0) {
          setSelectedDoctor(docList[0].id.toString());
        }
      } catch (err) {
        console.error('Could not fetch doctors list:', err);
      }
    };

    fetchDoctors();
  }, []);

  // ==========================================================================
  // EXPORT PRESCRIPTION TO PDF
  // ==========================================================================

  const exportPrescriptionPDF = () => {
    try {
      const doc = new jsPDF();
      
      const patient = savedConsultationData?.patient || patientDetails;
      const form = savedConsultationData?.form || formData;
      const doctor = savedConsultationData?.doctor || doctors.find((d) => String(d.id) === String(selectedDoctor));
      const consultDateObj = savedConsultationData?.date ? new Date(savedConsultationData.date) : new Date();

      // Header Banner
      doc.setFillColor(30, 58, 138); // CURAJ Royal Blue
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('CENTRAL UNIVERSITY OF RAJASTHAN', 105, 14, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('University Health Centre — Medical Prescription & Consultation', 105, 22, { align: 'center' });

      doc.setFontSize(8);
      doc.text('NH-8, Bandar Seendri, Ajmer, Rajasthan 305817', 105, 29, { align: 'center' });

      // Patient & Consultation Meta Info Table
      const formattedDate = consultDateObj.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      const patientName = patient?.full_name || (isStudent ? 'Student' : 'Staff / Other Patient');
      const patientId = patient?.college_id || identifier || 'N/A';
      const hostel = patient?.hostel_name || 'N/A';
      const phone = patient?.mobile_number ? `+91 ${patient.mobile_number}` : 'N/A';

      applyAutoTable(doc, {
        startY: 42,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2, textColor: [51, 65, 85] },
        columnStyles: {
          0: { fontStyle: 'bold', width: 35 },
          1: { width: 65 },
          2: { fontStyle: 'bold', width: 35 },
          3: { width: 65 }
        },
        body: [
          ['Patient Name:', patientName, 'Consultation Date:', formattedDate],
          ['Enrollment / ID:', patientId, 'Attending Doctor:', doctor?.name ? `Dr. ${doctor.name}` : 'Medical Officer'],
          ['Hostel / Room:', hostel, 'Contact Phone:', phone]
        ]
      });

      const endFirstTable = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : 65;

      // Clinical Summary Table
      applyAutoTable(doc, {
        startY: endFirstTable + 5,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9.5, cellPadding: 4, textColor: [30, 41, 59] },
        head: [['Clinical Category', 'Observations & Recommendations']],
        body: [
          ['Symptoms', form.symptoms || '—'],
          ['Diagnosis / Advice', form.treatment || '—'],
          ['Prescription (Rx)', form.prescription || '—'],
          ['Special Notes', form.notes || '—']
        ]
      });

      // Disclaimer & Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('This is a computer-generated medical consultation summary from CURAJ Health Centre.', 105, pageHeight - 15, { align: 'center' });
      doc.text('Please consult the University Health Centre OPD if symptoms persist.', 105, pageHeight - 10, { align: 'center' });

      // Download PDF
      doc.save(`CURAJ_Prescription_${patientId}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Could not generate PDF prescription. Please ensure popups and downloads are allowed.');
    }
  };

  // ==========================================================================
  // STEP 1: SEND OTP
  // ==========================================================================

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      setError(
        isStudent
          ? 'Please enter the student College ID.'
          : 'Please enter the mobile number.'
      );
      return;
    }

    if (!isStudent) {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(cleanIdentifier)) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    }

    setPatientDetails(null);
    setGeneratedOtp('');
    setEnteredOtp('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/send-otp`, {
        identifier: isStudent ? cleanIdentifier.toUpperCase() : cleanIdentifier,
        isStudent: isStudent
      });

      if (response.data && response.data.success) {
        const returnedPatient = response.data.patientDetails || null;

        if (isStudent) {
          if (!returnedPatient) {
            setError('Student was found but patient details were not returned by the server.');
            return;
          }
          if (!returnedPatient.college_id) {
            setError('Verified student does not have a valid College ID.');
            return;
          }
          if (!returnedPatient.email) {
            setError('This student does not have an email address registered in the database.');
            return;
          }
        }

        setPatientDetails(returnedPatient);
        setGeneratedOtp(String(response.data.mockOtp || ''));
        setStep(2);
      } else {
        setError(response.data?.message || 'Error generating OTP. Please try again.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(
        err.response?.data?.message ||
        'Error sending OTP. Student or Mobile number may not exist.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // STEP 2: VERIFY OTP
  // ==========================================================================

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');

    const entered = enteredOtp.trim();
    const generated = generatedOtp.trim();

    if (!entered) {
      setError('Please enter the OTP.');
      return;
    }

    if (entered === generated) {
      if (
        isStudent &&
        (!patientDetails || !patientDetails.college_id || !patientDetails.email)
      ) {
        setError('Patient verification data is missing. Please start again.');
        return;
      }
      setStep(3);
    } else {
      setError('Invalid OTP code. Please verify the 4-digit code.');
    }
  };

  // ==========================================================================
  // FORM CHANGE
  // ==========================================================================

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ==========================================================================
  // STEP 3: SAVE CONSULTATION
  // ==========================================================================

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!selectedDoctor) {
      setError('Please select an attending doctor.');
      setIsLoading(false);
      return;
    }

    let patientId = '';

    if (isStudent) {
      if (!patientDetails || !patientDetails.college_id) {
        setError('Verified student details are missing. Please verify the student again.');
        setIsLoading(false);
        return;
      }
      patientId = String(patientDetails.college_id).trim().toUpperCase();
    } else {
      patientId = String(identifier).trim();
    }

    if (!patientId) {
      setError('Patient ID is missing.');
      setIsLoading(false);
      return;
    }

    if (!formData.symptoms.trim()) {
      setError('Please enter presenting symptoms.');
      setIsLoading(false);
      return;
    }

    if (!formData.treatment.trim()) {
      setError('Please enter diagnosis / clinical treatment.');
      setIsLoading(false);
      return;
    }

    if (!formData.prescription.trim()) {
      setError('Please enter prescription and dosage.');
      setIsLoading(false);
      return;
    }

    const payload = {
      doctor_id: parseInt(selectedDoctor, 10),
      patient_id: patientId,
      is_student: isStudent,
      symptoms: formData.symptoms.trim(),
      treatment: formData.treatment.trim(),
      prescription: formData.prescription.trim(),
      additional_notes: formData.notes.trim()
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/api/consultations`, payload);

      if (res.data && res.data.success) {
        const currentDoctor = doctors.find((d) => String(d.id) === String(selectedDoctor));

        // Save consultation snapshot for PDF generation
        setSavedConsultationData({
          patient: patientDetails,
          form: { ...formData },
          doctor: currentDoctor,
          date: new Date()
        });

        // Advance to Step 4
        setStep(4);
      } else {
        setError(res.data?.message || 'Failed to save consultation.');
      }
    } catch (err) {
      console.error('Consultation submit error:', err);
      setError(
        err.response?.data?.message ||
        'Failed to save consultation. Check server connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // RESET PORTAL
  // ==========================================================================

  const resetPortal = () => {
    setStep(1);
    setIdentifier('');
    setEnteredOtp('');
    setGeneratedOtp('');
    setFormData({
      symptoms: '',
      treatment: '',
      prescription: '',
      notes: ''
    });
    setPatientDetails(null);
    setSavedConsultationData(null);
    setError('');
  };

  // ==========================================================================
  // UI / DESIGN
  // ==========================================================================

  return (
    <div className="flex items-center justify-center my-10 px-4">
      <div
        className={`w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 ${
          step === 3 ? 'max-w-3xl' : 'max-w-md'
        }`}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md mb-2">
            <Stethoscope size={24} className="text-teal-300" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Doctor Check-in Portal</h2>
          <p className="text-xs text-blue-200 mt-0.5">Central University of Rajasthan Health Center</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================================================================
              STEP 1
          ================================================================= */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsStudent(true);
                    setIdentifier('');
                    setPatientDetails(null);
                    setGeneratedOtp('');
                    setEnteredOtp('');
                    setError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    isStudent ? 'bg-white shadow text-blue-900' : 'text-slate-500'
                  }`}
                >
                  Student
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsStudent(false);
                    setIdentifier('');
                    setPatientDetails(null);
                    setGeneratedOtp('');
                    setEnteredOtp('');
                    setError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    !isStudent ? 'bg-white shadow text-blue-900' : 'text-slate-500'
                  }`}
                >
                  Staff / Other
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  {isStudent ? 'Student College ID' : 'Contact Mobile Number'}
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {isStudent ? <Fingerprint size={18} /> : <Phone size={18} />}
                  </div>

                  <input
                    type={isStudent ? 'text' : 'tel'}
                    required
                    maxLength={isStudent ? 30 : 10}
                    value={identifier}
                    onChange={(e) => {
                      if (!isStudent) {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setIdentifier(digitsOnly);
                      } else {
                        setIdentifier(e.target.value);
                      }
                    }}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white outline-none text-sm font-medium text-slate-800 transition"
                    placeholder={isStudent ? 'e.g. 2023MSBC001' : 'e.g. 9876543210'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-white bg-blue-900 hover:bg-blue-800 transition font-bold text-sm disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Send Verification OTP'}
                <ArrowRight size={16} className="ml-2" />
              </button>
            </form>
          )}

          {/* ================================================================
              STEP 2
          ================================================================= */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl text-center">
                <p className="text-xs text-teal-800 font-medium">OTP dispatched to registered contact.</p>
                <p className="font-mono font-black mt-2 text-2xl tracking-widest text-teal-950">{generatedOtp}</p>
                <span className="text-[10px] text-teal-600 block mt-1 uppercase font-semibold">
                  (Mock OTP for Testing)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                  Enter 4-Digit OTP
                </label>

                <input
                  type="text"
                  required
                  maxLength="4"
                  value={enteredOtp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setEnteredOtp(value);
                  }}
                  className="block w-full text-center tracking-[0.8em] text-2xl font-black py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white outline-none transition text-slate-800"
                  placeholder="••••"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                    setEnteredOtp('');
                  }}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition text-xs"
                >
                  Back
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl shadow-md text-white bg-teal-600 hover:bg-teal-700 transition font-bold text-xs"
                >
                  Verify Patient
                </button>
              </div>
            </form>
          )}

          {/* ================================================================
              STEP 3
          ================================================================= */}
          {step === 3 && (
            <div className="animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Prescription & Clinical Entry</h3>
                  {patientDetails ? (
                    <p className="text-xs text-blue-900 font-semibold mt-0.5">
                      Patient: <span className="text-slate-800 font-bold">{patientDetails.full_name}</span>
                      {' | '}
                      Hostel: <span className="text-slate-800 font-bold">{patientDetails.hostel_name || 'N/A'}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-blue-900 font-semibold mt-0.5">
                      Patient ID: <span className="text-slate-800 font-bold">{identifier}</span>
                    </p>
                  )}
                </div>

                <div className="w-full md:w-64">
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                    Attending Doctor
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-slate-700"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.name} ({doc.department || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <form onSubmit={handleSubmitConsultation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Presenting Symptoms *</label>
                    <textarea
                      name="symptoms"
                      required
                      rows="3"
                      value={formData.symptoms}
                      onChange={handleFormChange}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:bg-white outline-none resize-none"
                      placeholder="e.g. Fever, body ache, sore throat..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Diagnosis / Clinical Treatment *
                    </label>
                    <textarea
                      name="treatment"
                      required
                      rows="3"
                      value={formData.treatment}
                      onChange={handleFormChange}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:bg-white outline-none resize-none"
                      placeholder="e.g. Acute Viral Pharyngitis..."
                    ></textarea>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prescription & Dosage *</label>
                  <textarea
                    name="prescription"
                    required
                    rows="3"
                    value={formData.prescription}
                    onChange={handleFormChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:bg-white outline-none resize-none"
                    placeholder="e.g. Tab Paracetamol 650mg TDS x 3 days..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Additional Clinical Notes (Optional)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:bg-white outline-none"
                    placeholder="e.g. Advised rest, review if fever persists."
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading || !selectedDoctor}
                    className="flex items-center py-3 px-6 rounded-xl shadow-md text-white bg-blue-900 hover:bg-blue-800 transition font-bold text-xs disabled:opacity-50"
                  >
                    <Save size={16} className="mr-2" />
                    {isLoading ? 'Saving Record...' : 'Save Medical Record'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================
              STEP 4
          ================================================================= */}
          {step === 4 && (
            <div className="text-center py-6 animate-in fade-in duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle size={36} />
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-1">Consultation Saved</h3>

              <p className="text-xs text-slate-400 mb-6 font-medium">
                The medical entry has been logged into the central database.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={exportPrescriptionPDF}
                  className="w-full sm:w-auto flex items-center justify-center py-3 px-6 bg-blue-900 hover:bg-blue-800 text-white rounded-xl transition font-bold text-xs shadow-md"
                >
                  <Download size={16} className="mr-2" />
                  Download Prescription PDF
                </button>

                <button
                  type="button"
                  onClick={resetPortal}
                  className="w-full sm:w-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition font-bold text-xs"
                >
                  Admit Next Patient
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}