import { useState, useMemo } from 'react';
import api from '../lib/api';

const MAKES = ['Toyota', 'Nissan', 'Subaru', 'Mercedes Benz', 'BMW', 'Audi', 'Isuzu', 'Mitsubishi', 'Land Rover', 'Ford', 'Volkswagen', 'Honda', 'Hyundai', 'Mazda', 'Other'];
const YEARS = Array.from({ length: 26 }, (_, i) => i === 25 ? '2000 and older' : String(2025 - i));

const COVER_TYPES = [
  { id: 'comprehensive', label: 'Comprehensive' },
  { id: 'tpft', label: 'Third Party + Fire & Theft' },
  { id: 'tpo', label: 'Third Party Only' },
];

const COVER_BREAKDOWN_TITLE = {
  comprehensive: 'COMPREHENSIVE MOTOR COVER PREMIUM',
  tpft: 'THIRD PARTY FIRE & THEFT PREMIUM',
  tpo: 'THIRD PARTY ONLY PREMIUM',
};

const EXTENSIONS = [
  { id: 'excess', label: 'Excess Protector', question: 'Do you want to include the "Excess Protector" Extension?', cost: 0 },
  { id: 'pvt', label: 'Political Violence & Terrorism Cover', question: 'Do you want to include the "Political Violence and Terrorism" Extension?', cost: 0 },
  { id: 'aa', label: 'AA of Kenya Road Rescue', question: 'Do you want to include the "AA of Kenya Road Rescue" Extension?', cost: 6500 },
  { id: 'pa', label: 'Personal Accident Cover for Insured/Authorized Driver', question: 'Do you want to include Personal Accident Cover for the Insured/Authorized Driver?', cost: 5000 },
  { id: 'courtesy', label: 'Courtesy Car / Loss of Use', question: 'Do you want to include the "Courtesy Car/Loss of Use" Extension?', cost: 3000 },
];

function ksh(n) { return 'KES ' + Math.round(n).toLocaleString(); }

function formatValue(val) {
  const num = val.replace(/[^0-9]/g, '');
  return num ? parseInt(num).toLocaleString() : '';
}

function YesNoSelect({ question, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-white/20 bg-white/5">
      <p className="text-sm text-white/90 flex-1 leading-snug">{question}</p>
      <div className="flex gap-2 flex-shrink-0 mt-0.5">
        <button type="button" onClick={() => onChange(true)}
          className={`w-14 py-1.5 rounded-full text-xs font-bold transition-all ${
            value ? 'bg-[#1DB8A8] text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'
          }`}>YES</button>
        <button type="button" onClick={() => onChange(false)}
          className={`w-14 py-1.5 rounded-full text-xs font-bold transition-all ${
            !value ? 'bg-white/25 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'
          }`}>NO</button>
      </div>
    </div>
  );
}

export default function MotorQuoteCalc() {
  const [memberNumber, setMemberNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [make, setMake] = useState('');
  const [otherMake, setOtherMake] = useState('');
  const [model, setModel] = useState('');
  const [coverType, setCoverType] = useState('comprehensive');
  const [valueStr, setValueStr] = useState('');
  const [regNo, setRegNo] = useState('');
  const [year, setYear] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [extensions, setExtensions] = useState({ excess: false, pvt: false, aa: false, pa: false, courtesy: false });
  const [submitted, setSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMobileBreakdown, setShowMobileBreakdown] = useState(false);

  const vehicleValue = parseInt(valueStr.replace(/[^0-9]/g, '')) || 0;
  const actualMake = make === 'Other' ? otherMake : make;
  const step1Complete = memberNumber && firstName && lastName && phone && email &&
    actualMake && model && year && vehicleValue > 0;
  const showExtensions = coverType === 'comprehensive' || coverType === 'tpft';

  const quote = useMemo(() => {
    if (vehicleValue <= 0) return null;
    let basic;
    if (coverType === 'comprehensive') basic = Math.max(vehicleValue * 0.04, 15000);
    else if (coverType === 'tpft') basic = Math.max(vehicleValue * 0.025, 8000);
    else basic = 7560;

    let extTotal = 0;
    const activeExts = [];
    EXTENSIONS.forEach(ext => {
      if (extensions[ext.id]) {
        extTotal += ext.cost;
        activeExts.push(ext);
      }
    });

    const levies = Math.max(basic * 0.002, 400);
    const total = basic + extTotal + levies;

    return { basic, extTotal, activeExts, levies, total };
  }, [vehicleValue, coverType, extensions]);

  const handleSubmitCarDetails = async () => {
    setSubmitting(true);
    try {
      const activeExtNames = EXTENSIONS.filter(e => extensions[e.id]).map(e => e.label);
      const res = await api.post('/public/quote', {
        name: `${firstName} ${lastName}`,
        phone,
        email,
        productInterest: 'Motor Insurance (ICPAK)',
        message: `ICPAK Motor Insurance Request\nMember Number: ${memberNumber}\nName: ${firstName} ${lastName}\nPhone: ${phone}\nEmail: ${email}\nVehicle: ${year} ${actualMake} ${model}\nReg: ${regNo || 'Not provided'}\nValue: KES ${vehicleValue.toLocaleString()}\nCover: ${COVER_TYPES.find(c => c.id === coverType)?.label}\nExtensions: ${activeExtNames.join(', ') || 'None'}\nStart Date: ${startDate}\nCalculated Premium: KES ${Math.round(quote?.total || 0).toLocaleString()}`,
      });
      setSubmittedRef(res.data.refNumber || '');
      setSubmitted(true);
    } catch {
      alert('Error submitting details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const docsWhatsappMsg = encodeURIComponent(
    `Hello Engishu Insurance, I am submitting my cover documentation for ICPAK Motor Insurance.\nMember: ${firstName} ${lastName} (${memberNumber})\nVehicle: ${year} ${actualMake} ${model} (${regNo || 'No reg provided'})\nI will attach: Full Name, MPESA Payment Code, National ID, Car Logbook, and KRA PIN.`
  );

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-white/20 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1DB8A8] focus:border-transparent";
  const labelClass = "block text-xs font-semibold text-white/90 mb-1.5 uppercase tracking-wide";
  const subheadClass = "text-xs font-bold text-[#1DB8A8] uppercase tracking-wider mb-3";

  if (submitted) {
    return (
      <div className="bg-[#3D1A00] rounded-2xl shadow-lg border border-white/10 p-8 md:p-12 max-w-[1000px] mx-auto text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1DB8A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Car Details Submitted!</h3>
        <p className="text-white/70 mb-4">Thank you, {firstName}. Your car details have been received. Our team will contact you within 2 hours.</p>
        {submittedRef && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-4 inline-block" style={{ borderLeft: '4px solid #1DB8A8' }}>
            <p className="text-xs text-white/50 uppercase tracking-wider">Your Reference Number</p>
            <p className="text-2xl font-extrabold text-white">{submittedRef}</p>
          </div>
        )}
        <p className="text-sm text-white/70 mb-6">Estimated premium: <strong className="text-white">{ksh(quote?.total || 0)}</strong></p>
        <div className="bg-white/10 border border-white/20 rounded-xl p-5 text-left mb-4">
          <p className="text-xs font-bold text-[#1DB8A8] uppercase tracking-wider mb-2">Next Step — Submit Cover Documentation</p>
          <p className="text-sm text-white/70 mb-3">Please submit the following documents to complete your cover:</p>
          <ul className="text-sm text-white/80 space-y-1 list-disc list-inside mb-4">
            <li>Full Name</li>
            <li>MPESA Payment Code</li>
            <li>National ID</li>
            <li>Car Logbook</li>
            <li>KRA PIN</li>
          </ul>
          <a href={`https://wa.me/254759840614?text=${docsWhatsappMsg}`} target="_blank" rel="noopener noreferrer"
            className="inline-block bg-green-500 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-green-600 transition-colors">
            Submit Cover Documentation
          </a>
        </div>
        <p className="text-xs text-white/40">A confirmation has been sent to your email if provided.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#3D1A00] rounded-2xl shadow-lg border border-white/10 max-w-[1000px] mx-auto overflow-hidden">

      {/* Header */}
      <div className="p-6 md:p-8 border-b border-white/10">
        <p className="text-xs font-bold text-[#1DB8A8] uppercase tracking-widest mb-1.5">Private Motor Insurance Cover</p>
        <h3 className="text-xl md:text-2xl font-bold text-white">For ICPAK Members</h3>
        <p className="text-sm text-white/50 mt-1">All Fields are Mandatory</p>

        <div className="flex items-center gap-2 mt-5">
          {['Member & Vehicle Details', 'Cover Extensions', 'Your Premium'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-white/20" />}
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                i === 0 ? 'text-[#1DB8A8]' : step1Complete ? 'text-[#1DB8A8]' : 'text-white/30'
              }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-[#1DB8A8] text-white' :
                  step1Complete ? 'bg-[#1DB8A8] text-white' : 'bg-white/20 text-white/40'
                }`}>{i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1 — Member & Vehicle Details */}
      <div className="p-6 md:p-8 border-b border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-[#1DB8A8] rounded-full" />
          <p className="text-xs font-bold text-white uppercase tracking-wider">Step 1 — Member & Vehicle Details</p>
        </div>

        {/* Member / Personal Details */}
        <p className={subheadClass}>Member / Personal Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
          <div className="md:col-span-2">
            <label className={labelClass}>ICPAK Member Number *</label>
            <input required placeholder="e.g. ICPAK/2024/001234" value={memberNumber} onChange={e => setMemberNumber(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>ICPAK Member's First Name *</label>
            <input required placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>ICPAK Member's Last Name *</label>
            <input required placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input required placeholder="e.g. 0712 345 678" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email Address *</label>
            <input type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Vehicle Details */}
        <p className={subheadClass}>Vehicle Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
          <div>
            <label className={labelClass}>Make of Vehicle *</label>
            <select value={make} onChange={e => setMake(e.target.value)} className={inputClass}>
              <option value="">Select make</option>
              {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {make === 'Other' && (
              <input placeholder="e.g. Mercedes Benz" value={otherMake} onChange={e => setOtherMake(e.target.value)} className={`${inputClass} mt-2`} />
            )}
          </div>
          <div>
            <label className={labelClass}>Model of Vehicle *</label>
            <input required placeholder="e.g. GLE 400D" value={model} onChange={e => setModel(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Preferred Cover */}
        <p className={subheadClass}>Select Preferred Cover *</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
          {COVER_TYPES.map(ct => (
            <button key={ct.id} type="button" onClick={() => setCoverType(ct.id)}
              className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-center ${
                coverType === ct.id
                  ? 'border-[#1DB8A8] bg-[#1DB8A8]/10 text-white'
                  : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40'
              }`}>
              {ct.label}
            </button>
          ))}
        </div>

        {/* Remaining vehicle fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Value of Vehicle (KES) *</label>
            <input required placeholder="e.g. 1,500,000" value={valueStr}
              onChange={e => setValueStr(formatValue(e.target.value))} className={inputClass} />
            <p className="text-[10px] text-white/40 mt-1">Current market value of your vehicle</p>
          </div>
          <div>
            <label className={labelClass}>Vehicle Registration Number *</label>
            <input required placeholder="e.g. KDG 123A" value={regNo} onChange={e => setRegNo(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Vehicle Year of Manufacture *</label>
            <select value={year} onChange={e => setYear(e.target.value)} className={inputClass}>
              <option value="">Select year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Cover Start Date *</label>
            <input type="date" value={startDate} min={new Date().toISOString().split('T')[0]}
              onChange={e => setStartDate(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* STEP 2 — Cover Extensions */}
      <div className={`p-6 md:p-8 border-b border-white/10 transition-opacity ${step1Complete ? '' : 'opacity-40 pointer-events-none'}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-8 bg-[#1DB8A8] rounded-full" />
          <p className="text-xs font-bold text-white uppercase tracking-wider">Step 2 — Cover Extensions</p>
        </div>
        <p className="text-sm text-white/60 mb-5">Select your preferred optional extensions below.</p>

        {showExtensions ? (
          <div className="space-y-3">
            {EXTENSIONS.map(ext => (
              <YesNoSelect key={ext.id} question={ext.question} value={extensions[ext.id]}
                onChange={v => setExtensions({ ...extensions, [ext.id]: v })} />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-white/20 bg-white/5">
            <p className="text-sm text-white/60">No optional extensions are available for Third Party Only cover.</p>
          </div>
        )}
      </div>

      {/* STEP 3 — Premium & Acquisition */}
      <div className={`p-6 md:p-8 transition-opacity ${step1Complete ? '' : 'opacity-40 pointer-events-none'}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-8 bg-[#1DB8A8] rounded-full" />
          <p className="text-xs font-bold text-white uppercase tracking-wider">Step 3 — Your Premium Breakdown</p>
        </div>

        {quote ? (
          <>
            {/* Premium breakdown */}
            <div className="bg-white/10 rounded-xl border border-white/20 overflow-hidden mb-4">
              <div className="bg-white/15 px-5 py-3">
                <p className="text-white font-semibold text-sm">{COVER_BREAKDOWN_TITLE[coverType]}</p>
              </div>
              <div className="divide-y divide-white/10">
                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-white">Basic Premium</p>
                  <p className="text-sm font-semibold text-white">{ksh(quote.basic)}</p>
                </div>

                {showExtensions && EXTENSIONS.map(ext => (
                  <div key={ext.id} className="flex items-center justify-between px-5 py-2.5">
                    <p className={`text-sm ${extensions[ext.id] ? 'text-white' : 'text-white/30'}`}>{ext.label}</p>
                    <p className={`text-sm ${extensions[ext.id] ? 'text-white' : 'text-white/30'}`}>
                      {extensions[ext.id] ? (ext.cost > 0 ? ksh(ext.cost) : 'Included') : '—'}
                    </p>
                  </div>
                ))}

                <div className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm text-white">Levies & Stamp Duty</p>
                    <p className="text-[10px] text-white/50">0.2% of basic premium</p>
                  </div>
                  <p className="text-sm text-white">{ksh(quote.levies)}</p>
                </div>

                <div className="flex items-center justify-between px-5 py-4 bg-white/10">
                  <p className="text-base font-bold text-[#1DB8A8]">ANNUAL PREMIUM</p>
                  <p className="text-xl font-extrabold text-white">{ksh(quote.total)}</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-white/50 italic mb-5">
              This is an indicative premium. Final premium subject to underwriter assessment and vehicle inspection.
            </p>

            {/* Read Cover Brochure */}
            <div className="mb-6">
              <a href="#" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#1DB8A8] font-semibold border border-[#1DB8A8]/40 px-4 py-2 rounded-full hover:bg-[#1DB8A8]/10 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                Read Cover Brochure
              </a>
            </div>

            {/* Acquisition steps */}
            <div className="bg-white/5 border border-white/15 rounded-xl p-5 mb-5">
              <p className="text-xs font-bold text-[#1DB8A8] uppercase tracking-wider mb-5">
                Steps in Acquiring Comprehensive Motor Insurance
              </p>

              <div className="space-y-5">
                {/* Step 1 — Payment */}
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1DB8A8] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Pay at least 30% of the Annual Premium</p>
                    <p className="text-xs text-white/60 mb-2">Use Lipa na M-Pesa Pay Bill:</p>
                    <div className="grid grid-cols-2 gap-2 max-w-sm">
                      <div className="bg-white/10 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">Business Number</p>
                        <p className="text-sm font-bold text-white">898200</p>
                      </div>
                      <div className="bg-white/10 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">Account Number</p>
                        <p className="text-sm font-bold text-white">{regNo || 'Your Car Registration'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 — Submit car details */}
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1DB8A8] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-2">Submit your car details</p>
                    <button onClick={handleSubmitCarDetails} disabled={submitting}
                      className="bg-[#1DB8A8] text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-[#28bfb3] transition-colors disabled:opacity-50">
                      {submitting ? 'Submitting...' : 'Submit Car Details'}
                    </button>
                  </div>
                </div>

                {/* Step 3 — Documentation */}
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1DB8A8] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Submit the following documentation</p>
                    <ul className="text-xs text-white/70 space-y-0.5 mb-3 list-disc list-inside">
                      <li>Name</li>
                      <li>MPESA Code</li>
                      <li>ID</li>
                      <li>Car Logbook</li>
                      <li>KRA Pin</li>
                    </ul>
                    <a href={`https://wa.me/254759840614?text=${docsWhatsappMsg}`} target="_blank" rel="noopener noreferrer"
                      className="inline-block bg-green-500 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-green-600 transition-colors">
                      Submit Cover Documentation
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Post-submission note */}
            <div className="bg-[#1DB8A8]/10 border border-[#1DB8A8]/30 rounded-xl p-4 mb-6">
              <p className="text-xs text-white/80 leading-relaxed">
                After submitting your details and documentation, a <strong className="text-white">1-month Certificate of Insurance</strong> and <strong className="text-white">Valuation Letter</strong> will be issued to you by email. The final premium will be payable after valuation before the annual cover is issued.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-white/40 py-8 text-center">Complete Step 1 with your vehicle value to see your premium</p>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="px-6 md:px-8 py-5 border-t border-white/10">
        <p className="text-[11px] text-white/40 leading-relaxed">
          Engishu Insurance takes your data privacy seriously. Any information you provide to us will be used for the sole purpose of facilitating the creation of a contract of insurance to which you are a party.{' '}
          <a href="#" className="text-[#1DB8A8]/80 hover:text-[#1DB8A8] underline">Read our Privacy Policy here</a>.
        </p>
      </div>

      {/* Mobile sticky premium bar */}
      {quote && step1Complete && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 px-4 py-3">
          <div className="flex items-center justify-between" onClick={() => setShowMobileBreakdown(!showMobileBreakdown)}>
            <div>
              <p className="text-xs text-gray-500">Annual Premium</p>
              <p className="text-lg font-extrabold text-[#633806]">{ksh(quote.total)}</p>
            </div>
            <button className="text-xs text-[#1DB8A8] font-semibold">
              {showMobileBreakdown ? 'Hide' : 'See Breakdown'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
