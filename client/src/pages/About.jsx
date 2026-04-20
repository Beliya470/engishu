import { Shield, Target, Eye, Award, Users } from 'lucide-react';

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-3xl">
            <span className="inline-block bg-[#1DB8A8]/10 text-[#1DB8A8] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              About Us
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#633806] mb-6">Your Trusted Insurance Partner in Kenya</h1>
            <p className="text-lg text-[#6B7280] leading-relaxed">
              Engishu Insurance Agency is a licensed insurance intermediary based in Nairobi, Kenya. We connect individuals and businesses with the best insurance solutions from Kenya's leading underwriters.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-[#633806] mb-4">Our Story</h2>
            <p className="text-[#6B7280] mb-4 leading-relaxed">
              Founded in Nairobi, Engishu Insurance Agency was born from a simple belief: every Kenyan deserves access to quality, affordable insurance with honest advice and fast service.
            </p>
            <p className="text-[#6B7280] mb-4 leading-relaxed">
              The name "Engishu" comes from the Maasai word for cattle, a symbol of wealth, security, and protection in Maasai culture. Just as the Maasai protect their most valued assets, we exist to protect yours.
            </p>
            <p className="text-[#6B7280] leading-relaxed">
              Today, we work with over 10 leading underwriters including First Assurance (Absa Group), Britam, Jubilee Insurance, and CIC to offer a comprehensive range of insurance products for individuals and businesses across Kenya.
            </p>
          </div>

          <div className="space-y-6">
            {/* Mission */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 flex gap-4">
              <div className="w-12 h-12 bg-[#1DB8A8]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target size={22} className="text-[#1DB8A8]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#633806] mb-1">Our Mission</h3>
                <p className="text-sm text-[#6B7280]">To protect the wealth, health, and assets of Kenyans by connecting them with the best insurance solutions through transparency, speed, and integrity.</p>
              </div>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 flex gap-4">
              <div className="w-12 h-12 bg-[#1DB8A8]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye size={22} className="text-[#1DB8A8]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#633806] mb-1">Our Vision</h3>
                <p className="text-sm text-[#6B7280]">To be the most trusted insurance agency in Kenya, known for exceptional service, fair advice, and reliable cover.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#633806] text-center mb-10">Leadership</h2>
          <div className="max-w-sm mx-auto text-center">
            <div className="w-24 h-24 bg-[#633806] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl font-bold">WK</span>
            </div>
            <h3 className="text-xl font-semibold text-[#633806]">William Kiriba</h3>
            <p className="text-[#1DB8A8] font-medium text-sm mb-3">Executive Director</p>
            <p className="text-sm text-[#6B7280]">
              Leading Engishu Insurance with a commitment to client-first service, deep industry knowledge, and a passion for making insurance accessible to all Kenyans.
            </p>
          </div>
        </div>
      </section>

      {/* IRA Badge & Partners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#F7FFFE] rounded-xl border border-[#1DB8A8]/20 p-8 text-center">
            <Award size={48} className="text-[#1DB8A8] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#633806] mb-2">IRA Licensed</h3>
            <p className="text-sm text-[#6B7280]">
              Engishu Insurance Agency is fully licensed and regulated by the Insurance Regulatory Authority of Kenya (IRA), ensuring compliance with all regulatory standards.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users size={24} className="text-[#1DB8A8]" />
              <h3 className="text-xl font-bold text-[#633806]">Our Partner Underwriters</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['First Assurance (Absa Group)', 'Britam', 'Jubilee Insurance', 'CIC Insurance', 'APA Insurance', 'ICEA Lion', 'AAR Insurance', 'Madison Insurance', 'UAP Old Mutual'].map(p => (
                <div key={p} className="bg-[#F7FFFE] rounded-lg px-3 py-2 text-sm text-[#6B7280] border border-slate-50">
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
