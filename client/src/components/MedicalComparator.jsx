import { useState, useMemo } from 'react';
import CustomSelect from './CustomSelect';

// IMPORTANT: These premiums are indicative estimates
// for illustration purposes. Actual premiums depend on
// age, medical history, and underwriter assessment.
// Update with real quoted premiums from underwriters.
const medicalPlans = [
  // ── FIRST ASSURANCE ──
  { underwriter: "First Assurance", plan: "First-Med 500K", inpatient: 500000, outpatient: 50000, maternity: 50000, dental: 10000, optical: 10000, premium_individual: 17500, premium_family_2: 35000, premium_family_3: 48000, premium_family_4: 58000 },
  { underwriter: "First Assurance", plan: "First-Med 1M", inpatient: 1000000, outpatient: 75000, maternity: 75000, dental: 15000, optical: 15000, premium_individual: 28000, premium_family_2: 56000, premium_family_3: 75000, premium_family_4: 90000 },
  { underwriter: "First Assurance", plan: "First-Med 2M", inpatient: 2000000, outpatient: 100000, maternity: 100000, dental: 20000, optical: 20000, premium_individual: 45000, premium_family_2: 90000, premium_family_3: 118000, premium_family_4: 140000 },
  // ── BRITAM ──
  { underwriter: "Britam", plan: "Afya Bora Bronze", inpatient: 500000, outpatient: 30000, maternity: 40000, dental: 8000, optical: 8000, premium_individual: 16000, premium_family_2: 32000, premium_family_3: 44000, premium_family_4: 54000 },
  { underwriter: "Britam", plan: "Afya Bora Silver", inpatient: 1000000, outpatient: 60000, maternity: 60000, dental: 12000, optical: 12000, premium_individual: 26000, premium_family_2: 52000, premium_family_3: 70000, premium_family_4: 84000 },
  { underwriter: "Britam", plan: "Afya Bora Gold", inpatient: 2000000, outpatient: 90000, maternity: 90000, dental: 18000, optical: 18000, premium_individual: 42000, premium_family_2: 84000, premium_family_3: 110000, premium_family_4: 132000 },
  // ── JUBILEE ──
  { underwriter: "Jubilee Insurance", plan: "Afya Imara Bronze", inpatient: 500000, outpatient: 25000, maternity: 35000, dental: 7500, optical: 7500, premium_individual: 15500, premium_family_2: 31000, premium_family_3: 43000, premium_family_4: 52000 },
  { underwriter: "Jubilee Insurance", plan: "Afya Imara Silver", inpatient: 1000000, outpatient: 55000, maternity: 55000, dental: 11000, optical: 11000, premium_individual: 25000, premium_family_2: 50000, premium_family_3: 67000, premium_family_4: 80000 },
  { underwriter: "Jubilee Insurance", plan: "Afya Imara Gold", inpatient: 2000000, outpatient: 85000, maternity: 85000, dental: 17000, optical: 17000, premium_individual: 40000, premium_family_2: 80000, premium_family_3: 106000, premium_family_4: 127000 },
  // ── APA INSURANCE ──
  { underwriter: "APA Insurance", plan: "Afya Plus Bronze", inpatient: 500000, outpatient: 28000, maternity: 38000, dental: 8000, optical: 8000, premium_individual: 16500, premium_family_2: 33000, premium_family_3: 45000, premium_family_4: 55000 },
  { underwriter: "APA Insurance", plan: "Afya Plus Silver", inpatient: 1000000, outpatient: 58000, maternity: 58000, dental: 12000, optical: 12000, premium_individual: 27000, premium_family_2: 54000, premium_family_3: 72000, premium_family_4: 86000 },
  // ── OLD MUTUAL ──
  { underwriter: "Old Mutual", plan: "Comprehensive Bronze", inpatient: 500000, outpatient: 30000, maternity: 40000, dental: 9000, optical: 9000, premium_individual: 17000, premium_family_2: 34000, premium_family_3: 46000, premium_family_4: 56000 },
  { underwriter: "Old Mutual", plan: "Comprehensive Silver", inpatient: 1000000, outpatient: 65000, maternity: 65000, dental: 13000, optical: 13000, premium_individual: 27500, premium_family_2: 55000, premium_family_3: 73000, premium_family_4: 88000 },
  // ── ICEA LION ──
  { underwriter: "ICEA Lion", plan: "Afya Care Bronze", inpatient: 500000, outpatient: 27000, maternity: 36000, dental: 7000, optical: 7000, premium_individual: 15000, premium_family_2: 30000, premium_family_3: 41000, premium_family_4: 50000 },
  { underwriter: "ICEA Lion", plan: "Afya Care Silver", inpatient: 1000000, outpatient: 52000, maternity: 52000, dental: 10500, optical: 10500, premium_individual: 24500, premium_family_2: 49000, premium_family_3: 65000, premium_family_4: 78000 },
  { underwriter: "ICEA Lion", plan: "Afya Care Gold", inpatient: 2000000, outpatient: 82000, maternity: 82000, dental: 16000, optical: 16000, premium_individual: 39000, premium_family_2: 78000, premium_family_3: 103000, premium_family_4: 124000 },
  // ── CIC INSURANCE ──
  { underwriter: "CIC Insurance", plan: "Afya Bima Bronze", inpatient: 500000, outpatient: 25000, maternity: 35000, dental: 7000, optical: 7000, premium_individual: 14500, premium_family_2: 29000, premium_family_3: 40000, premium_family_4: 48000 },
  { underwriter: "CIC Insurance", plan: "Afya Bima Silver", inpatient: 1000000, outpatient: 50000, maternity: 50000, dental: 10000, optical: 10000, premium_individual: 23500, premium_family_2: 47000, premium_family_3: 63000, premium_family_4: 75000 },
];

const UNDERWRITER_COLORS = {
  "First Assurance": "#0066cc",
  "Britam": "#e63946",
  "Jubilee Insurance": "#2d6a4f",
  "APA Insurance": "#f4a261",
  "Old Mutual": "#264653",
  "ICEA Lion": "#7b2cbf",
  "CIC Insurance": "#d62828",
};

const INPATIENT_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 500000, label: 'Ksh 500,000' },
  { value: 1000000, label: 'Ksh 1,000,000' },
  { value: 2000000, label: 'Ksh 2,000,000' },
  { value: 3000000, label: 'Ksh 3,000,000' },
  { value: 5000000, label: 'Ksh 5,000,000' },
];

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm text-[#1A1A1A]">{label}</span>
      <button type="button" role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#1DB8A8]' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}

function ksh(n) {
  return 'Ksh ' + n.toLocaleString();
}

export default function MedicalComparator() {
  const [coverType, setCoverType] = useState('individual');
  const [principalAge, setPrincipalAge] = useState('25-34');
  const [spouseAge, setSpouseAge] = useState('25-34');
  const [numChildren, setNumChildren] = useState('0');
  const [childrenAges, setChildrenAges] = useState('');
  const [inpatientLimit, setInpatientLimit] = useState(0);
  const [includeOutpatient, setIncludeOutpatient] = useState(true);
  const [includeMaternity, setIncludeMaternity] = useState(true);
  const [includeDental, setIncludeDental] = useState(true);
  const [includeOptical, setIncludeOptical] = useState(true);
  const [sortBy, setSortBy] = useState('premium_asc');
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const showSpouse = coverType === 'couple' || coverType === 'family';
  const showChildren = coverType === 'family';
  const childCount = parseInt(numChildren) || 0;

  const handleCompare = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 1000);
  };

  const results = useMemo(() => {
    if (!showResults) return [];

    let filtered = medicalPlans.filter(p => {
      if (inpatientLimit > 0 && p.inpatient < inpatientLimit) return false;
      return true;
    });

    // Calculate premium for each plan
    const withPremium = filtered.map(p => {
      let basePremium;
      if (coverType === 'individual') basePremium = p.premium_individual;
      else if (coverType === 'couple') basePremium = p.premium_family_2;
      else if (coverType === 'family' && childCount <= 2) basePremium = p.premium_family_3;
      else basePremium = p.premium_family_4;

      let discount = 0;
      if (!includeOutpatient) discount += 0.15;
      if (!includeDental) discount += 0.05;
      if (!includeOptical) discount += 0.03;
      const adjustedPremium = Math.round(basePremium * (1 - discount));
      const hasDiscount = discount > 0;

      return { ...p, displayPremium: adjustedPremium, hasDiscount };
    });

    // Sort
    withPremium.sort((a, b) => {
      if (sortBy === 'premium_asc') return a.displayPremium - b.displayPremium;
      if (sortBy === 'premium_desc') return b.displayPremium - a.displayPremium;
      if (sortBy === 'inpatient_desc') return b.inpatient - a.inpatient;
      return 0;
    });

    return withPremium;
  }, [showResults, coverType, childCount, inpatientLimit, includeOutpatient, includeDental, includeOptical, sortBy]);

  const bestValueId = results.length > 0
    ? results.reduce((min, p) => p.displayPremium < min.displayPremium ? p : min, results[0]).plan
    : null;

  const uniqueUnderwriters = new Set(results.map(r => r.underwriter)).size;

  const handleGetCover = (plan) => {
    // Pre-fill the product dropdown in the quote form by dispatching a custom event
    window.dispatchEvent(new CustomEvent('engishu-prefill-quote', {
      detail: { product: 'Medical Insurance (First-Med)', note: `Interested in ${plan?.plan || 'Medical Insurance'} from ${plan?.underwriter || ''}. Estimated premium: KES ${plan?.displayPremium?.toLocaleString() || 'N/A'}.` }
    }));
    const quoteSection = document.getElementById('quote');
    if (quoteSection) quoteSection.scrollIntoView({ behavior: 'smooth' });
  };

  const labelClass = "block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide";
  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-[#1A1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8] focus:border-transparent";

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* ── FORM ── */}
      <form onSubmit={handleCompare} className="p-5 sm:p-6 md:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-[#633806] mb-1">Compare Medical Insurance</h3>
        <p className="text-xs sm:text-sm text-[#6B7280] mb-6">Find the best medical cover from Kenya's top underwriters</p>

        {/* Cover Type */}
        <div className="mb-5">
          <label className={labelClass}>Cover Type</label>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'individual', label: 'Individual' },
              { val: 'couple', label: 'Individual + Spouse' },
              { val: 'family', label: 'Family (with children)' },
            ].map(opt => (
              <button key={opt.val} type="button" onClick={() => { setCoverType(opt.val); setShowResults(false); }}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  coverType === opt.val
                    ? 'bg-[#633806] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age fields + Inpatient limit row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className={labelClass}>Principal's Age</label>
            <CustomSelect
              value={principalAge}
              onChange={setPrincipalAge}
              options={AGE_RANGES.map(a => ({ value: a, label: a }))}
              placeholder="Select age"
            />
          </div>

          {showSpouse && (
            <div>
              <label className={labelClass}>Spouse's Age</label>
              <CustomSelect
                value={spouseAge}
                onChange={setSpouseAge}
                options={AGE_RANGES.map(a => ({ value: a, label: a }))}
                placeholder="Select age"
              />
            </div>
          )}

          {showChildren && (
            <div>
              <label className={labelClass}>Number of Children</label>
              <CustomSelect
                value={numChildren}
                onChange={setNumChildren}
                options={['1', '2', '3', '4', '5+'].map(n => ({ value: n, label: n }))}
                placeholder="Select"
              />
            </div>
          )}

          {showChildren && childCount > 0 && (
            <div>
              <label className={labelClass}>Children's Ages</label>
              <input type="text" placeholder="e.g. 3, 7, 12" value={childrenAges}
                onChange={e => setChildrenAges(e.target.value)} className={inputClass} />
              <p className="text-[10px] text-gray-400 mt-1">Ages affect premium calculation</p>
            </div>
          )}

          <div>
            <label className={labelClass}>Desired Inpatient Limit</label>
            <CustomSelect
              value={inpatientLimit}
              onChange={(v) => setInpatientLimit(Number(v))}
              options={INPATIENT_OPTIONS}
              placeholder="Select limit"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
          <ToggleSwitch checked={includeOutpatient} onChange={v => { setIncludeOutpatient(v); setShowResults(false); }} label="Outpatient" />
          <ToggleSwitch checked={includeMaternity} onChange={v => { setIncludeMaternity(v); setShowResults(false); }} label="Maternity" />
          <ToggleSwitch checked={includeDental} onChange={v => { setIncludeDental(v); setShowResults(false); }} label="Dental" />
          <ToggleSwitch checked={includeOptical} onChange={v => { setIncludeOptical(v); setShowResults(false); }} label="Optical" />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full sm:w-auto bg-[#633806] text-white rounded-full py-3 px-8 font-semibold text-sm hover:bg-[#4a2800] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? 'Comparing...' : showResults ? 'Compare Again' : 'Compare Medical Covers'}
        </button>
      </form>

      {/* ── RESULTS ── */}
      {showResults && results.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="p-5 sm:p-6 md:p-8 pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Showing <strong className="text-[#633806]">{results.length}</strong> plans from <strong className="text-[#633806]">{uniqueUnderwriters}</strong> underwriters
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowResults(false)}
                  className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#633806] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Close results
                </button>
                <span className="text-xs text-gray-500">Sort by:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1DB8A8]">
                  <option value="premium_asc">Premium (Low to High)</option>
                  <option value="premium_desc">Premium (High to Low)</option>
                  <option value="inpatient_desc">Inpatient Limit (High to Low)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[800px]">
              <thead>
                <tr className="bg-[#1DB8A8] text-white">
                  <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-[#1DB8A8] z-10 min-w-[140px]">Underwriter</th>
                  <th className="text-left px-3 py-3 font-semibold">Plan</th>
                  <th className="text-right px-3 py-3 font-semibold">Inpatient</th>
                  <th className="text-right px-3 py-3 font-semibold">Outpatient</th>
                  <th className="text-right px-3 py-3 font-semibold">Maternity</th>
                  <th className="text-right px-3 py-3 font-semibold">Dental</th>
                  <th className="text-right px-3 py-3 font-semibold">Optical</th>
                  <th className="text-right px-3 py-3 font-semibold">Annual Premium</th>
                  <th className="text-center px-3 py-3 font-semibold sticky right-0 bg-[#1DB8A8] z-10">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((p, i) => {
                  const isBest = p.plan === bestValueId;
                  return (
                    <tr key={p.plan + i} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isBest ? 'bg-[#1DB8A8]/5' : ''}`}>
                      <td className={`px-4 py-3 sticky left-0 bg-white z-10 ${isBest ? '!bg-[#1DB8A8]/5' : ''}`}>
                        <div className="flex items-center gap-2">
                          {/* // TODO: add real logos */}
                          <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: UNDERWRITER_COLORS[p.underwriter] || '#999' }} />
                          <div>
                            <span className="font-semibold text-[#633806] text-xs">{p.underwriter}</span>
                            {isBest && (
                              <span className="block mt-0.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold w-fit">Best Value</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#1A1A1A] font-medium">{p.plan}</td>
                      <td className="px-3 py-3 text-right text-[#1A1A1A]">{ksh(p.inpatient)}</td>
                      <td className="px-3 py-3 text-right">
                        {includeOutpatient
                          ? <span className="text-[#1A1A1A]">{ksh(p.outpatient)}</span>
                          : <span className="italic text-gray-400">Not included</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {includeMaternity
                          ? <span className="text-[#1A1A1A]">{ksh(p.maternity)}</span>
                          : <span className="italic text-gray-400">Not included</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {includeDental
                          ? <span className="text-[#1A1A1A]">{ksh(p.dental)}</span>
                          : <span className="italic text-gray-400">Not included</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {includeOptical
                          ? <span className="text-[#1A1A1A]">{ksh(p.optical)}</span>
                          : <span className="italic text-gray-400">Not included</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold text-[#1DB8A8] text-sm">{ksh(p.displayPremium)}</span>
                        {p.hasDiscount && <span className="block text-[9px] text-gray-400">*adjusted</span>}
                      </td>
                      <td className="px-3 py-3 text-center sticky right-0 bg-white z-10">
                        <button onClick={() => handleGetCover(p)} type="button"
                          className="bg-[#633806] text-white text-xs px-3 py-1.5 rounded-full font-medium hover:bg-[#4a2800] transition-colors whitespace-nowrap">
                          Get This Cover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-5 sm:p-6 md:p-8 pt-4">
            {results.some(r => r.hasDiscount) && (
              <p className="text-[10px] sm:text-xs text-gray-400 mb-2">*Premium adjusted for removed benefits (outpatient -15%, dental -5%, optical -3%)</p>
            )}
            <p className="text-[10px] sm:text-xs text-gray-400 italic">
              Premiums shown are estimates for comparison purposes. Final premiums are subject to underwriter assessment based on age, medical history, and other factors. Engishu Insurance will provide you with official quotations upon request.
            </p>
          </div>
        </div>
      )}

      {showResults && results.length === 0 && (
        <div className="p-8 text-center border-t border-gray-100">
          <p className="text-[#6B7280]">No plans match your selected criteria. Try adjusting the inpatient limit.</p>
        </div>
      )}
    </div>
  );
}
