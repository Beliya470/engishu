import { useState, useRef } from 'react';
import api from '../lib/api';

function FileField({ label, name, accept, multiple, onChange, files }) {
  const inputRef = useRef(null);

  const fileLabel = files && files.length > 0
    ? Array.from(files).map(f => f.name).join(', ')
    : null;

  return (
    <div>
      <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
          fileLabel
            ? 'border-[#1DB8A8] bg-[#1DB8A8]/5'
            : 'border-gray-300 bg-gray-50 hover:border-[#1DB8A8] hover:bg-[#F7FFFE]'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${fileLabel ? 'bg-[#1DB8A8]/10' : 'bg-gray-200'}`}>
          {fileLabel ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DB8A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {fileLabel ? (
            <p className="text-sm text-[#1DB8A8] font-medium truncate">{fileLabel}</p>
          ) : (
            <>
              <p className="text-sm text-[#6B7280]">Click to upload</p>
              <p className="text-[10px] text-gray-400">PDF or image — max 5 MB{multiple ? ' · select both sides' : ''}</p>
            </>
          )}
        </div>
        {fileLabel && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(null); inputRef.current.value = ''; }}
            className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={e => onChange(e.target.files)}
      />
    </div>
  );
}

export default function MotorDocsUpload({ quoteRef }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [idPhoto, setIdPhoto] = useState(null);
  const [logbook, setLogbook] = useState(null);
  const [kraPin, setKraPin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');
  const [error, setError] = useState('');

  const ACCEPT = 'application/pdf,image/jpeg,image/png,image/gif';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !mpesaCode.trim()) {
      setError('Your name and MPESA code are required.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('mpesaCode', mpesaCode.trim());
    if (email.trim()) formData.append('email', email.trim());
    if (quoteRef) formData.append('quoteRef', quoteRef);

    if (idPhoto) {
      Array.from(idPhoto).forEach(f => formData.append('id_photo', f));
    }
    if (logbook) {
      Array.from(logbook).forEach(f => formData.append('logbook', f));
    }
    if (kraPin) {
      Array.from(kraPin).forEach(f => formData.append('kra_pin', f));
    }

    setSubmitting(true);
    try {
      const res = await api.post('/public/motor-docs', formData);
      setSubmittedRef(res.data.refNumber || '');
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-[#1DB8A8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1DB8A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h4 className="text-lg font-bold text-[#633806] mb-1">Documents Submitted</h4>
        <p className="text-sm text-[#6B7280] mb-3">Your documents have been received. Our team will review them and contact you shortly.</p>
        {submittedRef && (
          <div className="inline-block bg-[#F7FFFE] border border-[#1DB8A8]/30 rounded-xl px-5 py-3" style={{ borderLeft: '4px solid #1DB8A8' }}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Document Reference</p>
            <p className="text-lg font-extrabold text-[#633806]">{submittedRef}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-[#1DB8A8] rounded-full flex-shrink-0" />
        <div>
          <h4 className="text-lg font-bold text-[#633806]">Upload your documents here</h4>
          <p className="text-xs text-[#6B7280] mt-0.5">PDF or image files · max 5 MB each</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Text fields */}
        <div>
          <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Your Name *</label>
          <input
            required
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1DB8A8] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Email Address <span className="normal-case font-normal text-gray-400">(for confirmation)</span></label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1DB8A8] focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">MPESA Code *</label>
          <input
            required
            placeholder="e.g. QGH7K3N2PL"
            value={mpesaCode}
            onChange={e => setMpesaCode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1DB8A8] focus:border-transparent"
          />
        </div>

        {/* File fields */}
        <div className="md:col-span-2">
          <FileField
            label="ID Photo (Both Sides) *"
            name="id_photo"
            accept={ACCEPT}
            multiple
            files={idPhoto}
            onChange={setIdPhoto}
          />
        </div>
        <div>
          <FileField
            label="Logbook *"
            name="logbook"
            accept={ACCEPT}
            multiple={false}
            files={logbook}
            onChange={setLogbook}
          />
        </div>
        <div>
          <FileField
            label="KRA PIN *"
            name="kra_pin"
            accept={ACCEPT}
            multiple={false}
            files={kraPin}
            onChange={setKraPin}
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#1DB8A8] text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-[#28bfb3] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Uploading...' : 'Submit Cover Documentation'}
        </button>
      </div>
    </form>
  );
}
