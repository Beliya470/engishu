import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Clock, FileText, CheckCircle, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { individualProducts, corporateProducts, allProducts } from '../lib/products';
import QuoteForm from '../components/QuoteForm';
import MedicalComparator from '../components/MedicalComparator';

const ROTATING_WORDS = [
  "Motor Insurance", "First-Med Insurance", "Domestic Package Insurance",
  "Travel Insurance", "Personal Accident Insurance", "Golfers Insurance",
  "Political Violence & Terrorism Insurance", "ICPAK Professional Indemnity",
  "ICPAK Motor Private Insurance",
];

function RotatingHeadline() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase('out');
      setTimeout(() => {
        setIndex(prev => (prev + 1) % ROTATING_WORDS.length);
        setPhase('in');
      }, 400);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <span className="block mt-1 min-h-[1.2em] sm:min-h-[1.2em] overflow-hidden">
        <span
          className="text-[#1DB8A8] italic"
          style={{
            display: 'inline-block',
            transform: phase === 'in' ? 'translateY(0)' : 'translateY(-100%)',
            opacity: phase === 'in' ? 1 : 0,
            transitionProperty: 'transform, opacity',
            transitionDuration: '400ms',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {ROTATING_WORDS[index]}
        </span>
      </span>
      <span className="block mt-1">for every Kenyan.</span>
    </>
  );
}

/* ── Animated counter hook ── */
function useCountUp(target, duration = 2000, triggered) {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!triggered || hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [triggered, target, duration]);

  return value;
}

/* ── Why Engishu Section ── */
function WhyEngishuSection() {
  const statsRef = useRef(null);
  const cardsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    const statsObs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); statsObs.disconnect(); } },
      { threshold: 0.3 }
    );
    const cardsObs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setCardsVisible(true); cardsObs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (statsRef.current) statsObs.observe(statsRef.current);
    if (cardsRef.current) cardsObs.observe(cardsRef.current);
    return () => { statsObs.disconnect(); cardsObs.disconnect(); };
  }, []);

  const c1 = useCountUp(500, 2000, statsVisible);
  const c2 = useCountUp(10, 2000, statsVisible);
  const c3 = useCountUp(20, 2000, statsVisible);
  const c4 = useCountUp(24, 2000, statsVisible);

  const stats = [
    { value: c1, suffix: '+', label: 'Clients Served' },
    { value: c2, suffix: '+', label: 'Partner Underwriters' },
    { value: c3, suffix: '+', label: 'Insurance Products' },
    { value: c4, suffix: 'hr', label: 'Average Turnaround' },
  ];

  const features = [
    { badge: 'Licensed', heading: 'IRA Licensed & Regulated', text: "Fully licensed by the Insurance Regulatory Authority of Kenya. Your cover is always legitimate and legally backed." },
    { badge: 'Choice', heading: '10+ Partner Underwriters', text: "We work with First Assurance, Britam, Jubilee, CIC and more, so we always find you the best cover at the best price." },
    { badge: 'Expertise', heading: 'Deep Local Knowledge', text: "Our team lives and breathes Kenya's insurance market. We give honest, tailored advice, not generic sales pitches." },
    { badge: 'Speed', heading: 'Fast Turnaround', text: "From quote to policy issuance, we move fast. Cover notes issued within hours for time-sensitive needs." },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* PART 1: Animated stats */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 text-center">
          {stats.map((s, i) => (
            <div key={s.label} className={`${i < 3 ? 'md:border-r md:border-slate-200' : ''} px-2 md:px-6`}>
              <p className="text-4xl sm:text-5xl font-extrabold text-[#633806] leading-none">
                {s.value}<span className="text-[#1DB8A8]">{s.suffix}</span>
              </p>
              <p className="text-xs sm:text-sm uppercase tracking-widest text-[#6B7280] mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* PART 2: Heading */}
        <div className="text-center mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-[#633806]">Why clients choose Engishu</h2>
          <p className="text-[#6B7280] text-sm md:text-base mt-2 max-w-lg mx-auto">
            Kenya's trusted insurance intermediary. Licensed, experienced, and on your side.
          </p>
        </div>

        {/* PART 3: Feature cards with fade-up */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mt-10">
          {features.map((f, i) => (
            <div
              key={f.badge}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-[#1DB8A8] transition-all duration-200"
              style={{
                opacity: cardsVisible ? 1 : 0,
                transform: cardsVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s, border-color 0.2s, box-shadow 0.2s`,
              }}
            >
              <span className="inline-block bg-[#1DB8A8]/10 text-[#1DB8A8] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {f.badge}
              </span>
              <h3 className="font-semibold text-[#633806] text-lg mb-2">{f.heading}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const productTabs = [
  {
    id: 'motor', label: 'Motor Insurance',
    tagline: 'Drive with confidence, fully covered.',
    description: "Whether it's your personal car or a commercial fleet, we find you the best motor cover from Kenya's top underwriters. Comprehensive or third-party, we've got you.",
    bullets: ['Comprehensive cover for accidents, theft and fire', 'Third-party only (legally required for all vehicles)', 'Fast claims processing through First Assurance & Britam', 'Cover for private vehicles, PSVs and commercial fleets'],
    slug: 'motor-insurance',
    image: '/products/motor-insurance.jpg',
  },
  {
    id: 'medical', label: 'Medical Insurance',
    tagline: 'Quality healthcare for you and your family.',
    description: 'From individual First-Med covers to full family medical plans, we connect you to inpatient, outpatient, dental, optical and maternity benefits.',
    bullets: ['Inpatient cover from Ksh 500,000 up to Ksh 5 million per family', 'Outpatient, dental, and optical included', 'Maternity benefits available', '30-day waiting period for illness (0 days for accidents)'],
    slug: 'first-med',
    image: '/products/medical-insurance.jpg',
  },
  {
    id: 'home', label: 'Home Insurance',
    tagline: 'Protect your home and everything in it.',
    description: 'Our Domestic Package covers your building, contents, and portable valuables against fire, theft, flooding and more, all in one policy.',
    bullets: ['Buildings cover: walls, gates, garage, outbuildings', 'Contents cover: furniture, valuables, personal effects', 'All-risks cover for cameras, laptops, jewellery (worldwide)', 'Optional cover for domestic workers (WIBA-D)'],
    slug: 'home-insurance',
    image: '/products/home-insurance.jpg',
  },
  {
    id: 'business', label: 'Business Insurance',
    tagline: 'Protect your business from every angle.',
    description: 'Whether you run a small shop or a large enterprise, our SME Package covers fire, burglary, public liability, WIBA, electronics, money, and more. 13 sections in one policy.',
    bullets: ['Fire & perils, burglary, and all-risks', 'Work Injury Benefits Act (WIBA), legally required for all employers', 'Public liability and fidelity guarantee', 'Goods in transit and political violence cover'],
    slug: 'sme-package',
    image: '/products/business-insurance.jpg',
  },
  {
    id: 'teams', label: 'Medical for Teams',
    tagline: 'Keep your team healthy, keep your business growing.',
    description: 'First Afya Biashara is designed for businesses with 3 to 19 employees. No waiting periods, no medical checks, comprehensive cover from day one.',
    bullets: ['No waiting period, coverage starts immediately', 'No medical checks required on enrolment', 'Mental health, chronic disease, and IVF cover included', 'Annual health check-ups up to Ksh 50,000'],
    slug: 'first-afya-biashara',
    image: '/products/medical-teams.jpg',
  },
  {
    id: 'travel', label: 'Travel Insurance',
    tagline: 'Travel anywhere with total peace of mind.',
    description: 'Short-term cover for business and leisure travel. Medical emergencies, evacuation, trip cancellation, lost baggage and passport, all covered.',
    bullets: ['Emergency medical cover including Covid-19', 'Emergency evacuation and repatriation', 'Loss of passport and baggage delay compensation', '24-hour assistance service worldwide'],
    slug: 'travel-insurance',
    image: '/products/travel-insurance.jpg',
  },
  {
    id: 'pi', label: 'Professional Indemnity',
    tagline: 'Protect your professional reputation.',
    description: 'Covers accountants, auditors, lawyers and other professionals against claims arising from errors, omissions or negligence in their work. Mandatory for ICPAK members.',
    bullets: ['Covers professional errors and omissions', 'Legal defence costs included', 'Mandatory cover for ICPAK-registered accountants', 'Available for all licensed professionals in Kenya'],
    slug: 'professional-indemnity',
    image: '/products/professional-indemnity.jpg',
  },
  {
    id: 'marine', label: 'Marine & Cargo',
    tagline: 'Move goods across borders with confidence.',
    description: 'Covers imported and exported cargo against loss or damage during sea, air or inland transit. Now mandatory digitally as of February 2026 under IRA regulations.',
    bullets: ['Covers total and partial cargo loss', 'Sea, air and inland waterway transit', 'Now digitally mandatory for all importers (IRA 2026)', 'Fast policy issuance through First Assurance'],
    slug: 'marine-insurance',
  },
];

const productCards = [
  { name: 'Motor Insurance', desc: 'Comprehensive and third-party cover for your vehicle', slug: 'motor-insurance' },
  { name: 'Medical Insurance (First-Med)', desc: 'Quality healthcare for you and your family', slug: 'first-med' },
  { name: 'Home Insurance', desc: 'Protect your home and everything in it', slug: 'home-insurance' },
  { name: 'Travel Insurance', desc: 'Travel with peace of mind, anywhere in the world', slug: 'travel-insurance' },
  { name: 'Personal Accident', desc: 'Financial protection against accidental injury or death', slug: 'personal-accident' },
  { name: 'Golfers Insurance', desc: 'Specialised cover for golf enthusiasts', slug: 'golfers-insurance' },
  { name: 'Political Violence & Terrorism', desc: 'Cover against political unrest and terrorism risks', slug: 'pvt-insurance' },
  { name: 'ICPAK Professional Indemnity', desc: 'Tailored PI cover for accountants and auditors', slug: 'icpak-professional-indemnity' },
  { name: 'ICPAK Motor Private', desc: 'Special motor rates for ICPAK members', slug: 'icpak-motor-private' },
  { name: 'Group Medical Insurance', desc: 'Comprehensive medical cover for your employees', slug: 'group-medical' },
  { name: 'First Afya Biashara', desc: 'Medical cover for businesses with 3 to 19 staff', slug: 'first-afya-biashara' },
  { name: 'SME Package', desc: '13-section comprehensive cover for small businesses', slug: 'sme-package' },
  { name: 'Engineering Insurance', desc: 'Cover for construction, machinery and equipment', slug: 'engineering-insurance' },
  { name: 'Marine Insurance', desc: 'Cargo cover for imports and exports', slug: 'marine-insurance' },
  { name: 'Goods in Transit', desc: 'Cover for goods transported by road', slug: 'goods-in-transit' },
  { name: 'Fire Insurance', desc: 'Protect your property against fire and related perils', slug: 'fire-insurance' },
  { name: 'Liabilities', desc: 'Public liability, WIBA, employers liability and more', slug: 'liabilities-insurance' },
  { name: 'Corporate Travel', desc: 'Business travel cover for your team', slug: 'corporate-travel' },
  { name: 'Bima Taasisi', desc: 'Insurance for SACCOs, chamas and institutions', slug: 'bima-taasisi' },
  { name: 'Professional Indemnity', desc: 'Cover for professionals against errors and omissions', slug: 'professional-indemnity' },
  { name: 'WIBA', desc: 'Legally required cover for all employers in Kenya', slug: 'wiba' },
];

const faqs = [
  { q: 'What insurance products do you offer?', a: 'We offer a full range of individual and corporate insurance products including motor, medical, home, travel, personal accident, SME packages, group medical, engineering, marine, fire, liabilities, WIBA, professional indemnity, and more.' },
  { q: 'How do I get a quote?', a: 'Simply fill out our quote request form on this page or call us at +254 759 840614. Our team will get back to you within 24 hours with the best options from our partner underwriters.' },
  { q: 'Which underwriters do you work with?', a: 'We partner with leading underwriters including First Assurance (Absa Group), Britam, Jubilee Insurance, CIC, APA, ICEA Lion, AAR, Madison, and UAP Old Mutual.' },
  { q: 'How long does it take to get covered?', a: 'Once you approve a quote and provide the required documents, we can have your policy issued within 24-48 hours. For urgent motor covers, we can issue cover notes within hours.' },
  { q: 'Is Engishu Insurance licensed in Kenya?', a: 'Yes. Engishu Insurance Agency is fully licensed and regulated by the Insurance Regulatory Authority of Kenya (IRA). We are a registered insurance intermediary.' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('motor');
  const [fadeIn, setFadeIn] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const tabScrollRef = useRef(null);

  const handleTabSwitch = (id) => {
    if (id === activeTab) return;
    setFadeIn(false);
    setTimeout(() => {
      setActiveTab(id);
      setFadeIn(true);
    }, 150);
  };

  const currentProduct = productTabs.find(t => t.id === activeTab);

  return (
    <div>
      {/* ═══════ HERO — with background image ═══════ */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <img src="/hero-bg.jpg" alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center" />
        {/* Dark overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(10,5,0,0.82) 0%, rgba(10,5,0,0.65) 45%, rgba(10,5,0,0.35) 100%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-28">
          <div className="text-center">
            {/* 1. Pill badge */}
            <span className="inline-flex items-center gap-1.5 bg-[#1DB8A8] text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-8">
              <CheckCircle size={14} /> IRA Licensed Insurance Agency
            </span>

            {/* 2. Headline with rotating word */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-[800px] mx-auto">
              <span className="block">The right</span>
              <RotatingHeadline />
            </h1>

            {/* 3. Subtext */}
            <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-[560px] mx-auto mt-4 md:mt-5 px-2 sm:px-0">
              From motor and medical to home, travel and business cover. Engishu works with Kenya's top underwriters to find you the right policy at the right price.
            </p>

            {/* 4. CTA */}
            <div className="mt-8">
              <a href="#quote"
                className="inline-block bg-[#633806] text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-[#4a2800] transition-colors shadow-lg shadow-black/25">
                Get a Free Quote
              </a>
            </div>

            {/* 5. Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 mt-7 text-xs md:text-sm text-white/70">
              <span className="flex items-center gap-1.5"><Shield size={15} className="text-[#1DB8A8]" /> IRA Licensed</span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span className="flex items-center gap-1.5"><Building2 size={15} className="text-[#1DB8A8]" /> 10+ Underwriters</span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span className="flex items-center gap-1.5"><Clock size={15} className="text-[#1DB8A8]" /> Fast Turnaround</span>
            </div>
          </div>

          {/* 6. Medical Insurance Comparator Tool */}
          <div className="mt-12 max-w-[960px] mx-auto text-left">
            <MedicalComparator />
          </div>
        </div>
      </section>



      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-[#633806] text-center mb-12">Getting covered has never been easier</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', icon: FileText, title: 'Fill in your details', desc: 'Tell us what you need cover for using our quick quote form.' },
            { step: '2', icon: Users, title: 'We find the best cover', desc: 'We compare options from top underwriters to get you the best deal.' },
            { step: '3', icon: CheckCircle, title: 'Get covered', desc: 'Receive your policy documents and enjoy peace of mind.' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-14 h-14 bg-[#1DB8A8]/10 text-[#1DB8A8] rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                {s.step}
              </div>
              <h3 className="text-lg font-semibold text-[#633806] mb-2">{s.title}</h3>
              <p className="text-sm text-[#6B7280]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ TABBED PRODUCTS — Swiftacare dark card ═══════ */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#633806] leading-tight">
              Find the cover that fits your world
            </h2>
            <p className="text-[#6B7280] text-base md:text-lg leading-relaxed md:pt-2">
              Engishu connects you to Kenya's best insurance covers across multiple underwriters, so you always get the right protection at the right price, all through one trusted agency.
            </p>
          </div>

          <div ref={tabScrollRef} className="flex gap-2.5 mb-8 overflow-x-auto pb-2 hide-scrollbar">
            {productTabs.map(tab => (
              <button key={tab.id} onClick={() => handleTabSwitch(tab.id)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#1DB8A8] text-white shadow-md shadow-[#1DB8A8]/25'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className={`rounded-3xl overflow-hidden transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'linear-gradient(135deg, #4a2800 0%, #2d1800 50%, #1a0a00 100%)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center">
                <p className="text-white/50 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-4 sm:mb-5">
                  Engishu Insurance for {currentProduct?.label}
                </p>
                <h3 className="text-[#1DB8A8] text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4 sm:mb-5">
                  {currentProduct?.tagline}
                </h3>
                <p className="text-white/80 text-base leading-relaxed mb-8">
                  {currentProduct?.description}
                </p>
                <div className="space-y-4 mb-8">
                  {currentProduct?.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1DB8A8] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle size={13} className="text-white" />
                      </div>
                      <span className="text-white/90 text-sm leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <Link to={`/products/${currentProduct?.slug}`}
                    className="inline-block bg-[#1DB8A8] text-white px-7 py-3 rounded-lg font-semibold text-sm hover:bg-[#28bfb3] transition-colors">
                    Get a Quote
                  </Link>
                </div>
              </div>

              {/* Desktop image */}
              <div className="relative hidden lg:flex items-center justify-center p-8">
                {currentProduct?.image ? (
                  <img src={currentProduct.image} alt={currentProduct.label}
                    className="w-full h-full min-h-[400px] rounded-xl object-cover"
                    style={{ objectPosition: 'left center' }} />
                ) : (
                  /* TODO: replace with real product image */
                  <div className="w-full h-full min-h-[400px] rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(160deg, #1DB8A8 0%, #1a9e94 50%, #0d7a72 100%)' }}>
                    <div className="text-center px-8">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield size={32} className="text-white" />
                      </div>
                      <p className="text-white text-2xl font-bold">{currentProduct?.label}</p>
                      <p className="text-white/70 text-sm mt-2">Engishu Insurance Agency</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile image */}
              <div className="lg:hidden p-6 pt-0">
                {currentProduct?.image ? (
                  <img src={currentProduct.image} alt={currentProduct.label}
                    className="w-full h-48 rounded-xl object-cover"
                    style={{ objectPosition: 'left center' }} />
                ) : (
                  /* TODO: replace with real product image */
                  <div className="w-full h-48 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(160deg, #1DB8A8 0%, #1a9e94 50%, #0d7a72 100%)' }}>
                    <div className="text-center">
                      <Shield size={28} className="text-white mx-auto mb-2" />
                      <p className="text-white font-bold">{currentProduct?.label}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ WHY ENGISHU — animated stats + feature cards ═══════ */}
      <WhyEngishuSection />

      {/* ═══════ QUOTE FORM ═══════ */}
      <section id="quote" className="bg-[#3D1A00]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Get your free quote today</h2>
          <p className="text-white/80 mb-8">Fill in your details and our team will get back to you within 24 hours</p>
          <QuoteForm dark />
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-[#633806] text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="font-medium text-[#633806] text-sm">{faq.q}</span>
                {openFaq === i ? <ChevronUp size={18} className="text-[#1DB8A8]" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-[#6B7280]">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
