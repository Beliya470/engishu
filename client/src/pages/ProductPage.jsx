import { useParams, Link } from 'react-router-dom';
import { allProducts } from '../lib/products';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import QuoteForm from '../components/QuoteForm';
import MotorQuoteCalc from '../components/MotorQuoteCalc';
import MotorDocsUpload from '../components/MotorDocsUpload';

export default function ProductPage() {
  const { slug } = useParams();
  const product = allProducts.find(p => p.slug === slug);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#633806] mb-4">Product not found</h1>
        <Link to="/" className="text-[#1DB8A8] hover:underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1DB8A8] mb-6">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#633806] mb-4">{product.name}</h1>
              <p className="text-lg text-[#6B7280] mb-6 leading-relaxed">{product.description}</p>
              <a href="#product-quote" className="inline-block bg-[#1DB8A8] text-white px-7 py-3 rounded-full font-medium hover:bg-[#28bfb3] transition-colors">
                Get a Quote for {product.name}
              </a>
            </div>
            {product.image ? (
              <div className="hidden lg:block">
                <img src={product.image} alt={product.name}
                  className="w-full h-[320px] rounded-2xl object-cover shadow-lg"
                  style={{ objectPosition: 'center center' }} />
              </div>
            ) : (
              <div className="hidden lg:flex h-[320px] rounded-2xl items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #1DB8A8 0%, #1a9e94 50%, #0d7a72 100%)' }}>
                <p className="text-white text-2xl font-bold">{product.name}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What it covers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-[#633806] mb-6">What it covers</h2>
            <div className="space-y-3">
              {product.covers.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-[#1DB8A8] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#6B7280]">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#633806] mb-4">Who is it for?</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">{product.whoFor}</p>
            </div>

            <div className="bg-[#F7FFFE] rounded-xl border border-[#1DB8A8]/20 p-5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Underwritten by</p>
              <p className="font-semibold text-[#633806]">{product.underwriter}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Motor Insurance Quote Calculator */}
      {slug === 'motor-insurance' && (
        <section className="bg-[#F7FFFE] py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MotorQuoteCalc />
          </div>
        </section>
      )}

      {/* Motor Insurance — Document Upload */}
      {slug === 'motor-insurance' && (
        <section className="bg-white py-12 md:py-16 border-t border-gray-100">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
            <MotorDocsUpload />
          </div>
        </section>
      )}

      {/* Quote Form — hidden for motor insurance which has its own calculator above */}
      {slug !== 'motor-insurance' && (
        <section id="product-quote" className="bg-[#3D1A00]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">Get a {product.name} Quote</h2>
            <p className="text-white/80 mb-8">Fill in your details and we'll get back to you within 24 hours</p>
            <QuoteForm preselectedProduct={product.name} dark />
          </div>
        </section>
      )}
    </div>
  );
}
