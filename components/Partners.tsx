'use client';

import React, { useState } from 'react';
import { translations, Language } from '@/lib/translations';
import { BookOpen, HelpCircle, HeartHandshake, Briefcase } from 'lucide-react';

export function PartnersSection({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [showModal, setShowModal] = useState(false);
  
  const [cName, setCname] = useState('');
  const [cChurch, setCchurch] = useState('');
  const [cPhone, setCphone] = useState('');
  const [cNeed, setCneed] = useState('');

  const [modalTitle, setModalTitle] = useState('');

  const handleConsulting = (e: React.MouseEvent) => {
    e.preventDefault();
    setModalTitle(t.partnerConsulting);
    setShowModal(true);
  };

  const handleNonprofit = (e: React.MouseEvent) => {
    e.preventDefault();
    setModalTitle(t.partnerNonprofit);
    setShowModal(true);
  };

  const handleSendEmail = () => {
    const body = `Assunto: ${modalTitle}%0DNome: ${cName}%0DIgreja: ${cChurch}%0DTelefone: ${cPhone}%0DNecessidade: ${cNeed}`;
    window.location.href = `mailto:jobzezz@adpmcp.org?subject=${modalTitle} AMI Planner&body=${body}`;
    setShowModal(false);
  };

  const handleSendWhatsapp = () => {
    const text = `*${modalTitle} AMI Planner*%0A%0ANome: ${cName}%0AIgreja: ${cChurch}%0ATelefone: ${cPhone}%0ANecessidade: ${cNeed}`;
    window.open(`https://wa.me/244948750831?text=${text}`, '_blank');
    setShowModal(false);
  };

  return (
    <>
      <div className="bg-[#101112] text-white rounded-xl p-6 h-full border border-[#226f68]/30 relative z-10">
        <div className="text-[13px] font-bold uppercase tracking-wider mb-6 flex justify-between items-center text-[#cba052]">
          Apoie e Evolua com AMI
        </div>

        <div className="space-y-4">
          <a href="#" onClick={handleConsulting} className="block group border border-[#226f68]/50 bg-[#1a1b1d] rounded-lg p-4 hover:border-[#db7b35] transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-[#226f68] p-2 rounded-md group-hover:bg-[#db7b35] transition-colors">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[13px] text-gray-100">{t.partnerConsulting}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">jobzezz@adpmcp.org</p>
              </div>
            </div>
          </a>

          <a href="#" className="block group border border-[#226f68]/50 bg-[#1a1b1d] rounded-lg p-4 hover:border-[#db7b35] transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-[#226f68] p-2 rounded-md group-hover:bg-[#db7b35] transition-colors">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[13px] text-gray-100">{t.partnerBook}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.partnerBookDesc}</p>
              </div>
            </div>
          </a>

          <a href="#" className="block group border border-[#226f68]/50 bg-[#1a1b1d] rounded-lg p-4 hover:border-[#db7b35] transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-[#226f68] p-2 rounded-md group-hover:bg-[#db7b35] transition-colors">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[13px] text-gray-100">{t.partnerWorkshop}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.partnerWorkshopDesc}</p>
              </div>
            </div>
          </a>

          <a href="#" onClick={handleNonprofit} className="block group border border-[#226f68]/50 bg-[#1a1b1d] rounded-lg p-4 hover:border-[#db7b35] transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-[#226f68] p-2 rounded-md group-hover:bg-[#db7b35] transition-colors">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[13px] text-gray-100">{t.partnerNonprofit}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{t.partnerNonprofitDesc}</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <h3 className="text-xl font-bold text-[#101112] mb-2">{modalTitle}</h3>
            <p className="text-sm text-gray-600 mb-6">{t.consultingDesc}</p>
            
            <div className="space-y-4 mb-8">
               <input type="text" placeholder={t.cName} value={cName} onChange={e=>setCname(e.target.value)} className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm focus:border-[#db7b35] outline-none text-[#101112]"/>
               <input type="text" placeholder={t.cChurch} value={cChurch} onChange={e=>setCchurch(e.target.value)} className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm focus:border-[#db7b35] outline-none text-[#101112]"/>
               <input type="text" placeholder={t.cPhone} value={cPhone} onChange={e=>setCphone(e.target.value)} className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm focus:border-[#db7b35] outline-none text-[#101112]"/>
               <textarea placeholder={t.cNeed} value={cNeed} onChange={e=>setCneed(e.target.value)} className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm focus:border-[#db7b35] outline-none h-24 resize-none text-[#101112]"></textarea>
            </div>

            <div className="space-y-3">
              <button disabled={!cName} onClick={handleSendEmail} className="w-full bg-[#226f68] hover:bg-[#1a5a54] text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-50">
                {t.btnEmail}
              </button>
              <button disabled={!cName} onClick={handleSendWhatsapp} className="w-full bg-[#25D366] hover:bg-[#1faa53] text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-50">
                {t.btnWhatsapp}
              </button>
              <button onClick={() => setShowModal(false)} className="w-full bg-transparent text-gray-500 hover:text-gray-800 font-bold text-sm py-2 rounded-xl transition-colors">
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
