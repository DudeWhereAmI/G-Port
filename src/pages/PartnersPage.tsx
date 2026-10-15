import React, { useState } from "react";
import { MOCK_PARTNERS } from "../data/mockPortData";
import { 
  Handshake, 
  ExternalLink, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  Clock,
  Layers,
  Search,
  Check
} from "lucide-react";

export const PartnersPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [contactPartner, setContactPartner] = useState<any | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);

  const filteredPartners = MOCK_PARTNERS.filter(p => 
    selectedCategory === "ALL" || p.category === selectedCategory
  );

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactPartner(null);
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">Technology Ecosystem</span>
            <span aria-hidden="true">·</span>
            <span>Decarbonization Partners & Integrations</span>
            <span aria-hidden="true">·</span>
            <span>IEC 61850 / DCSA Standards</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Decarbonization Technology & Hardware Partners
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Certified technical equipment vendors, high-voltage shore connection manufacturers, battery storage integrators, and open TOS API partners.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {["ALL", "Equipment", "Infrastructure", "Energy", "Software"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">{partner.category}</span>
                  <h3 className="font-black text-slate-900 text-base mt-0.5">{partner.name}</h3>
                  <div className="text-xs text-[#004B91] font-semibold">{partner.tagline}</div>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono font-bold text-[11px]">
                  {partner.logoText}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {partner.description}
              </p>

              <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Emission Reduction Impact:</span>
                  <strong className="text-emerald-700 font-bold">{partner.impactMetric}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Estimated Payback Period:</span>
                  <strong className="text-slate-800 font-bold">{partner.roiYears}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Key Reference System:</span>
                  <span className="text-slate-800 font-semibold truncate max-w-[160px]">{partner.featuredTech}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setContactPartner(partner)}
                className="w-full py-2 bg-[#004B91] hover:bg-[#00386E] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Technical Inquiry & Datasheet</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: CONTACT PARTNER */}
      {contactPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-[#004B91] uppercase tracking-wider">Vendor Inquiry</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{contactPartner.name}</h3>
                <p className="text-xs text-slate-500">{contactPartner.featuredTech}</p>
              </div>
              <button
                onClick={() => setContactPartner(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {contactSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-black text-slate-900 text-base">Inquiry Successfully Transmitted</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Technical representatives from {contactPartner.name} will provide technical documentation within 1 business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Terminal / Port Authority:</label>
                  <input
                    type="text"
                    required
                    defaultValue="Cat Lai & Cai Mep Deep-Sea Terminals (SNP)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Technical Lead Name & Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Chief Technical Officer / Energy Dispatch Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Official Contact Email:</label>
                  <input
                    type="email"
                    required
                    placeholder="energy.ops@snp-terminals.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Scope of Requirements:</label>
                  <textarea
                    rows={3}
                    defaultValue={`Requesting technical specifications and integration protocols for ${contactPartner.featuredTech} to support Scope 1/2 reduction compliance.`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setContactPartner(null)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#004B91] hover:bg-[#00386E] text-white rounded-lg font-bold shadow-2xs"
                  >
                    Submit Technical Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
