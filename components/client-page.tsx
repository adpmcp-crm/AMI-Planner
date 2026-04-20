'use client';

import React, { useState } from 'react';
import { Loader2, TrendingUp, DollarSign, Download, PlayCircle, Home, Instagram, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '@/lib/translations';
import { PartnersSection } from '@/components/Partners';

// Top level AI instantiation removed. API is dynamically imported inside the handlers to avoid Vercel client-side crashes on initial load if the environment or SDK throws an error.

type Tab = 'home' | 'about' | 'budget' | 'growth' | 'start';
type FocusType = 'media' | 'sound';

type AIBudgetResult = {
  summary: string;
  totalEstimated: number | string;
  categories: {
    name: string;
    items: {
      productName: string;
      priceTxt: string;
      reason: string;
      buyUrl: string;
    }[];
  }[];
};

type AIGrowthResult = {
  diagnostics: string;
  metrics: { label: string; value: string; desc: string }[];
  solutions: { title: string; strategy: string }[];
};

export function ClientPage() {
  const [lang, setLang] = useState<Language>('pt');
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Loaders & Errors
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Budget State
  const [budgetResult, setBudgetResult] = useState<AIBudgetResult | null>(null);
  const [focus, setFocus] = useState<FocusType>('media');
  const [churchName, setChurchName] = useState('');
  const [members, setMembers] = useState('');
  const [growth, setGrowth] = useState('growthModerate');
  const [currentLevel, setCurrentLevel] = useState('mediaLevel1');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('locBR');

  // Change focus handler
  const handleFocusChange = (newFocus: FocusType) => {
    setFocus(newFocus);
    setCurrentLevel(newFocus === 'media' ? 'mediaLevel1' : 'soundLevel1');
  };

  // Growth State
  const [socialLink, setSocialLink] = useState('');
  const [growthResult, setGrowthResult] = useState<AIGrowthResult | null>(null);

  // Generates PDF
  const handleDownloadPDF = async (elementId: string, filename: string, instName?: string) => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const el = document.getElementById(elementId);
      if (!el) return;
      
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let page = 1;
      const title = instName || 'AMI Planner';

      pdf.setFontSize(14);
      pdf.setTextColor(219, 123, 53);
      pdf.text(title, margin, margin + 5);
      
      pdf.addImage(imgData, 'PNG', margin, margin + 15, contentWidth, imgHeight);
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`A Midia da Igreja (C) Desde 2026 - Pág. ${page}`, margin, pdfHeight - 8);
      
      heightLeft -= (pdfHeight - 35);
      
      while (heightLeft > 0) {
        pdf.addPage();
        page++;
        
        pdf.setFontSize(14);
        pdf.setTextColor(219, 123, 53);
        pdf.text(title, margin, margin + 5);

        const offset = -(imgHeight - heightLeft) + margin + 15;
        pdf.addImage(imgData, 'PNG', margin, offset, contentWidth, imgHeight);
        
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`A Midia da Igreja (C) Desde 2026 - Pág. ${page}`, margin, pdfHeight - 8);
        
        heightLeft -= (pdfHeight - 35);
      }
      
      pdf.save(filename);
    } catch (e) {
      console.error(e);
      alert('Could not generate PDF right now. Try resizing your window or checking elements.');
    }
  };

  const handleBudgetGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchName || !members || !budget) {
      setErrorMsg(t.errorRequired);
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setBudgetResult(null);

    const promptData = {
      churchName, members, budget,
      focusText: focus === 'media' ? t.focusMedia : t.focusSound,
      growthText: (t as any)[growth],
      levelText: (t as any)[currentLevel],
      locText: (t as any)[location],
    };

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
      }
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Você é um planejador e consultor especialista em Mídia e Audiovisual para Igrejas (AMI Planner).
Baseado nestes dados:
- Igreja: ${promptData.churchName}
- Foco do Projeto: ${promptData.focusText}
- Tamanho: ${promptData.members}
- Crescimento: ${promptData.growthText}
- Equipamento Atual: ${promptData.levelText}
- Orçamento: ${promptData.budget}
- Região/Moeda: ${promptData.locText}

Crie um orçamento realista focado EXCLUSIVAMENTE em ${promptData.focusText}. USE A MOEDA CORRETA DA REGIÃO (${promptData.locText}) nos preços.
A recomendação dos materiais deve apresentar o link de uma loja com entrega na região selecionada no menor tempo possível, preferencialmente lojas locais do país informado (adicione "?tag=igrejamidia-20" na url ou parâmetros afiliados simulados mas com o domínio da loja local).
A resposta OBRIGATORIAMENTE DEVE SER EM ${lang.toUpperCase()}!

Retorne apenas este formato JSON (valido):
{
  "summary": "Resumo executivo da estratégia do projeto.",
  "totalEstimated": "Valor exato com simbolo da moeda",
  "categories": [
    {
      "name": "Nome Categoria",
      "items": [
        { "productName": "Nome", "priceTxt": "Preço c/ símbolo", "reason": "Motivo", "buyUrl": "url" }
      ]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'models/gemini-3.1-pro-preview',
        contents: prompt,
      });

      let jsonStr = response.text || "{}";
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\n?/, '');
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\n?/, '');
      jsonStr = jsonStr.replace(/```$/, '').trim();

      setBudgetResult(JSON.parse(jsonStr));
    } catch (error) {
      console.error(error);
      setErrorMsg("Error generating format. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrowthAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialLink) return;
    setErrorMsg('');
    setIsLoading(true);
    setGrowthResult(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
      }
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Atue como Especialista de Crescimento Digital para Igrejas (AMI Manager). Você precisa analisar de forma consultiva a estratégia para o link social: ${socialLink}. Crie soluções reais. IDIOMA DA RESPOSTA: ${lang.toUpperCase()}.

Retorne EXATAMENTE este JSON:
{
  "diagnostics": "Breve diagnóstico situacional assumido e encorajador.",
  "metrics": [
    { "label": "Taxa Engajamento (Estimada)", "value": "2-5%", "desc": "Contexto da importância" }
  ],
  "solutions": [
    { "title": "Otimização de Vídeos Curtos", "strategy": "Focar em mensagens 1-minuto do sermão." }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'models/gemini-3.1-pro-preview',
        contents: prompt,
      });

      let jsonStr = response.text || "{}";
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\n?/, '');
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\n?/, '');
      jsonStr = jsonStr.replace(/```$/, '').trim();

      setGrowthResult(JSON.parse(jsonStr));
    } catch (error) {
      console.error(error);
      setErrorMsg("Error creating diagnostics.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f9fafb] text-[#101112] font-sans flex flex-col relative">
      
      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/244948750831" target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-[0_10px_25px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform z-50 flex items-center justify-center">
         <MessageCircle className="w-8 h-8" />
      </a>

      {/* Top Header / Menu */}
      <header className="bg-[#101112] text-white border-b border-[#226f68]/40 sticky top-0 z-40 shadow-md">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="https://i.postimg.cc/vHyrH0DH/ami-planner-logo-site.png" alt="AMI Planner" className="h-10 md:h-12 w-auto object-contain" onError={(e) => { 
                e.currentTarget.style.display = 'none'; 
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
             }} />
             <h1 className="hidden text-xl md:text-2xl font-black tracking-tighter uppercase leading-none text-[#db7b35]">
                AMI Planner
             </h1>
          </div>
          
          <div className="flex gap-4 md:gap-2">
            {(['en', 'fr', 'es', 'pt'] as Language[]).map((l: Language) => (
              <span 
                key={l} 
                onClick={() => setLang(l)}
                className={`cursor-pointer text-[10px] md:text-[11px] font-bold tracking-widest uppercase transition-all px-2 py-1 rounded ${lang === l ? 'bg-[#cba052] text-[#101112]' : 'text-[#f3f4f6] hover:text-white'}`}
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Top Navigation */}
        <nav className="bg-[#1a1b1d] border-t border-white/5">
           <ul className="w-full max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-6 overflow-x-auto whitespace-nowrap text-[12px] font-bold uppercase tracking-wider text-[#9ca3af] py-3">
             {[
               { id: 'home', label: t.menuHome },
               { id: 'budget', label: t.menuBudget },
               { id: 'growth', label: t.menuGrowth },
               { id: 'start', label: t.menuStart },
               { id: 'about', label: t.menuAbout || "Quem Somos" }
             ].map(tab => (
               <li 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as Tab)}
                 className={`cursor-pointer py-1 border-b-2 transition-colors ${activeTab === tab.id ? 'border-[#db7b35] text-white' : 'border-transparent hover:text-white/80'}`}
               >
                 {tab.label}
               </li>
             ))}
           </ul>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        
        {/* --- TAB: HOME --- */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-[#101112] rounded-3xl p-8 md:p-16 text-center text-white border border-[#226f68]/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
               <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#226f68] rounded-full mix-blend-screen filter blur-[100px] opacity-40"></div>
               <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#db7b35] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
               <div className="relative z-10">
                 <Home className="w-16 h-16 text-[#cba052] mx-auto mb-6" />
                 <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">{t.homeWelcome}</h2>
                 <p className="text-lg md:text-xl text-[#d1d5db] max-w-3xl mx-auto leading-relaxed">{t.homeDesc}</p>
                 <div className="flex justify-center gap-4 mt-8 flex-wrap">
                   <button onClick={() => setActiveTab('budget')} className="bg-[#db7b35] hover:bg-[#c26a2b] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg">
                      {t.menuBudget}
                   </button>
                   <button onClick={() => setActiveTab('growth')} className="bg-[#226f68] hover:bg-[#1a5a54] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg">
                      {t.menuGrowth}
                   </button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* --- TAB: QUEM SOMOS (ABOUT) --- */}
        {activeTab === 'about' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
             <div className="bg-[#101112] text-white rounded-3xl p-8 md:p-16 border border-[#226f68]/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#db7b35] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
               <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                 <div className="shrink-0 flex justify-center">
                    <img src="https://i.postimg.cc/vmTBPsKC/AMI-Planner-Final-100.jpg" alt="Equipe AMI Planner" className="w-full max-w-[300px] md:max-w-[400px] object-cover rounded-2xl shadow-lg border-2 border-[#226f68]/30" />
                 </div>
                 <div>
                    <h2 className="text-3xl md:text-4xl font-black mb-6 text-[#cba052]">{t.aboutSec1Title}</h2>
                    <p className="text-[#d1d5db] text-lg leading-relaxed">
                       {t.aboutSec1Text1}
                       <a href={t.aboutSec1Link1Url} target="_blank" rel="noreferrer" className="text-[#db7b35] hover:underline font-bold">{t.aboutSec1Link1Text}</a>
                       {t.aboutSec1Text2}
                       <a href={t.aboutSec1Link2Url} target="_blank" rel="noreferrer" className="text-[#db7b35] hover:underline font-bold">{t.aboutSec1Link2Text}</a>
                       {t.aboutSec1Text3}
                    </p>
                 </div>
               </div>
             </div>

             <div className="bg-[#ffffff] rounded-3xl p-8 md:p-16 border border-[#e5e7eb] shadow-sm relative overflow-hidden">
               <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                 <div className="shrink-0 flex justify-center">
                    <img src="https://i.postimg.cc/TPf1nbjf/Job-Zezz.png" alt="Job Zezz" className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl shadow-lg border-4 border-[#db7b35]" />
                 </div>
                 <div>
                    <h2 className="text-3xl md:text-4xl font-black mb-6 text-[#101112]">{t.aboutSec2Title}</h2>
                    <div className="space-y-4 text-[#4b5563] text-base leading-relaxed">
                       <p>{t.aboutSec2P1}</p>
                       <p>{t.aboutSec2P2}</p>
                       <p className="font-bold text-[#db7b35]">{t.aboutSec2P3}</p>
                       <p>{t.aboutSec2P4}</p>
                    </div>
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* --- TAB: COMO COMEÇAR --- */}
        {activeTab === 'start' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-[#101112] text-white rounded-3xl p-8 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#226f68]/30 relative overflow-hidden">
               <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#226f68] rounded-full mix-blend-screen filter blur-[100px] opacity-40"></div>
               <div className="absolute -right-40 top-1/2 w-96 h-96 bg-[#db7b35] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
               
               <div className="relative z-10">
                 <h2 className="text-4xl md:text-5xl font-black mb-12 text-[#cba052] border-b border-[#226f68]/40 pb-8">{t.startTitle}</h2>
                 
                 <div className="space-y-12">
                   {(t.startContent as {title: string, text: string, subItems?: string[]}[]).map((section, idx) => (
                      <div key={idx} className="space-y-4">
                        <h3 className="text-2xl font-black tracking-tight text-white">{section.title}</h3>
                        <p className="text-lg text-[#d1d5db] leading-relaxed max-w-5xl">{section.text}</p>
                        {section.subItems && (
                          <div className="mt-4 bg-[#1a1b1d] p-6 rounded-2xl border border-[#226f68]/40">
                             <ul className="space-y-3">
                               {section.subItems.map((sub, sIdx) => (
                                 <li key={sIdx} className="text-[#9ca3af] leading-relaxed">
                                    {sub}
                                 </li>
                               ))}
                             </ul>
                          </div>
                        )}
                      </div>
                   ))}
                 </div>
                 
                 <div className="mt-16 pt-8 border-t border-[#226f68]/40">
                    <div className="max-w-md">
                      <PartnersSection lang={lang} />
                    </div>
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* --- TAB: PROJEÇÃO DE CRESCIMENTO --- */}
        {activeTab === 'growth' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300 grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 border border-[#e5e7eb] rounded-3xl p-6 md:p-8 bg-[#ffffff] flex flex-col justify-between" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <form onSubmit={handleGrowthAnalysis} className="space-y-6">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="bg-[#db7b35] p-2.5 rounded-xl"><Instagram className="w-6 h-6 text-white"/></div>
                     <h3 className="font-bold text-xl uppercase tracking-tighter text-[#101112]">{t.menuGrowth}</h3>
                   </div>
                   
                   <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#6b7280] font-bold block mb-2">{t.socialLink}</label>
                      <input type="url" required value={socialLink} onChange={e=>setSocialLink(e.target.value)} placeholder={t.socialPlaceholder} className="w-full bg-[#f9fafb] border-2 border-[#e5e7eb] p-3 rounded-xl focus:border-[#226f68] focus:outline-none transition-colors" />
                   </div>

                   <button disabled={isLoading} className="w-full bg-[#226f68] hover:bg-[#1a5a54] text-white font-bold uppercase tracking-wider py-4 rounded-xl flex justify-center items-center gap-2 transition-all mt-8" style={{boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                     {isLoading ? <Loader2 className="animate-spin w-5 h-5"/> : t.analyzeBtn}
                   </button>
                </form>

                <div className="mt-12">
                   <PartnersSection lang={lang} />
                </div>
             </div>

             <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {!growthResult && !isLoading && (
                     <motion.div key="empty" initial={{ opacity:0 }} animate={{opacity:1}} exit={{opacity:0}} className="h-full min-h-[400px] border-2 border-dashed border-[#e5e7eb] rounded-3xl flex flex-col items-center justify-center p-8 bg-[#ffffff]">
                        <TrendingUp className="w-16 h-16 text-[#e5e7eb] mb-4" />
                        <div className="text-[#9ca3af] font-bold uppercase tracking-wider text-sm">{t.emptyBudget}</div>
                     </motion.div>
                  )}
                  {isLoading && !growthResult && (
                     <motion.div key="loading" initial={{ opacity:0 }} animate={{opacity:1}} exit={{opacity:0}} className="h-full min-h-[400px] flex flex-col items-center justify-center border border-[#e5e7eb] bg-white rounded-3xl">
                        <Loader2 className="w-16 h-16 animate-spin text-[#db7b35]" />
                        <div className="text-[#6b7280] font-bold mt-4 uppercase tracking-widest text-xs">{t.analyzing}</div>
                     </motion.div>
                  )}
                  {growthResult && !isLoading && (
                     <motion.div key="results" initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} className="space-y-6">
                        {/* Header for PDF capture container */}
                        <div className="flex justify-between items-end mb-2">
                          <h2 className="text-3xl font-black text-[#101112]">Diagnostic</h2>
                          <button onClick={() => handleDownloadPDF('growth-results-container', `AMI_Planner_Growth_Analysis_${Date.now()}.pdf`, 'Projeção de Crescimento')} className="bg-[#101112] text-white hover:bg-[#cba052] transition-colors hover:text-[#101112] px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            {t.downloadPDF}
                          </button>
                        </div>
                        
                        {/* Explicit hex codes applied globally inside container to prevent OKLCH html2canvas crash */}
                        <div id="growth-results-container" className="space-y-6 bg-[#f9fafb] p-1">
                          <div className="bg-[#101112] text-white p-8 rounded-3xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border-l-[8px] border-l-[#db7b35]">
                             <h2 className="text-2xl font-black tracking-tight mb-4 text-[#cba052]">{t.growthResultsTitle}</h2>
                             <p className="text-[#d1d5db] leading-relaxed text-sm md:text-base">{growthResult.diagnostics}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {growthResult.metrics.map((m, i) => (
                               <div key={i} className="bg-[#ffffff] border border-[#e5e7eb] p-6 rounded-2xl flex flex-col justify-center">
                                 <div className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider mb-2">{m.label}</div>
                                 <div className="text-3xl font-black text-[#226f68] mb-2">{m.value}</div>
                                 <div className="text-[11px] text-[#9ca3af] leading-tight">{m.desc}</div>
                               </div>
                             ))}
                          </div>

                          <div className="bg-[#ffffff] border-2 border-[#e5e7eb] p-8 rounded-3xl">
                             <h3 className="text-lg font-black uppercase tracking-wider mb-6 text-[#101112] border-b border-[#e5e7eb] pb-4">{t.solutionsLabel}</h3>
                             <div className="space-y-4">
                                {growthResult.solutions.map((s, i) => (
                                   <div key={i} className="flex gap-4 items-start p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
                                      <div className="bg-[#cba052] text-[#101112] w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">{i+1}</div>
                                      <div>
                                         <h4 className="font-bold text-[#101112]">{s.title}</h4>
                                         <p className="text-sm text-[#4b5563] mt-1">{s.strategy}</p>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                        </div>
                     </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        )}

        {/* --- TAB: ORÇAMENTO --- */}
        {activeTab === 'budget' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-4 flex flex-col space-y-8">
              <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-3xl p-6 md:p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <h3 className="text-[13px] font-bold uppercase tracking-wider mb-6 flex justify-between items-center border-b border-[#e5e7eb] pb-3 text-[#101112]">
                  <span>{t.formTitle}</span>
                  <DollarSign className="w-5 h-5 text-[#226f68]" />
                </h3>
                <form onSubmit={handleBudgetGenerate} className="space-y-4">
                  {errorMsg && <div className="text-xs font-bold text-[#ef4444] bg-[#fef2f2] p-3 rounded-lg border border-[#fee2e2]">{errorMsg}</div>}
                  
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#6b7280] font-bold block mb-1.5">{t.churchName}</label>
                    <input type="text" value={churchName} onChange={e=>setChurchName(e.target.value)} required className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm focus:border-[#db7b35] focus:outline-none" />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#6b7280] font-bold block mb-1.5">{t.focus}</label>
                    <select value={focus} onChange={e=>handleFocusChange(e.target.value as FocusType)} className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm font-medium focus:border-[#db7b35] focus:outline-none">
                      <option value="media">{t.focusMedia}</option>
                      <option value="sound">{t.focusSound}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#6b7280] font-bold block mb-1.5">{t.members}</label>
                      <input type="number" value={members} onChange={e=>setMembers(e.target.value)} required className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm focus:border-[#db7b35] focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#6b7280] font-bold block mb-1.5">{t.budget}</label>
                      <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} required placeholder={t.budgetPlaceholder} className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm focus:border-[#db7b35] focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#6b7280] font-bold block mb-1.5">{t.location}</label>
                    <select value={location} onChange={e=>setLocation(e.target.value)} className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm font-medium focus:border-[#db7b35] focus:outline-none">
                      <option value="locBR">{t.locBR}</option>
                      <option value="locPT">{t.locPT}</option>
                      <option value="locAO">{t.locAO}</option>
                      <option value="locMZ">{t.locMZ}</option>
                      <option value="locCV">{t.locCV}</option>
                      <option value="locEN">{t.locEN}</option>
                      <option value="locFR">{t.locFR}</option>
                      <option value="locES">{t.locES}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#6b7280] font-bold block mb-1.5">{t.currentLevel}</label>
                    <select value={currentLevel} onChange={e=>setCurrentLevel(e.target.value)} className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm font-medium focus:border-[#db7b35] focus:outline-none">
                      {focus === 'media' ? (
                        <>
                          <option value="mediaLevel0">{(t as any).mediaLevel0}</option>
                          <option value="mediaLevel1">{(t as any).mediaLevel1}</option>
                          <option value="mediaLevel2">{(t as any).mediaLevel2}</option>
                          <option value="mediaLevel3">{(t as any).mediaLevel3}</option>
                        </>
                      ) : (
                        <>
                          <option value="soundLevel0">{(t as any).soundLevel0}</option>
                          <option value="soundLevel1">{(t as any).soundLevel1}</option>
                          <option value="soundLevel2">{(t as any).soundLevel2}</option>
                          <option value="soundLevel3">{(t as any).soundLevel3}</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#6b7280] font-bold block mb-1.5">{t.growth}</label>
                    <select value={growth} onChange={e=>setGrowth(e.target.value)} className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm font-medium focus:border-[#db7b35] focus:outline-none">
                      <option value="growthStable">{t.growthStable}</option>
                      <option value="growthModerate">{t.growthModerate}</option>
                      <option value="growthHigh">{t.growthHigh}</option>
                    </select>
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full bg-[#db7b35] hover:bg-[#c26a2b] text-white text-[12px] uppercase tracking-widest font-black py-4 px-4 rounded-xl mt-4 disabled:opacity-50 flex items-center justify-center gap-2 transition-all border-none" style={{boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.generateBtn}
                  </button>
                </form>
              </div>
              <PartnersSection lang={lang} />
            </section>

            <section className="lg:col-span-8">
               <AnimatePresence mode="wait">
                {!budgetResult && !isLoading && (
                  <motion.div key="empty" initial={{ opacity:0 }} animate={{opacity:1}} exit={{opacity:0}} className="h-full min-h-[400px] border-2 border-dashed border-[#e5e7eb] bg-[#ffffff] rounded-3xl flex flex-col items-center justify-center p-10 text-center">
                     <DollarSign className="w-16 h-16 text-[#e5e7eb] mb-4" />
                     <div className="text-[13px] font-bold uppercase tracking-wider text-[#101112] mb-2">{t.emptyBudget}</div>
                     <div className="text-[13px] text-[#6b7280] font-medium">{t.emptyBudgetDesc}</div>
                  </motion.div>
                )}
                {isLoading && !budgetResult && (
                  <motion.div key="loading" initial={{ opacity:0 }} animate={{opacity:1}} exit={{opacity:0}} className="h-full min-h-[400px] border border-[#e5e7eb] bg-[#ffffff] rounded-3xl flex flex-col items-center justify-center p-10 text-center">
                     <Loader2 className="w-12 h-12 animate-spin text-[#226f68] mb-4" />
                     <div className="text-[12px] font-black uppercase tracking-widest text-[#101112]">{t.generating}</div>
                  </motion.div>
                )}
                {budgetResult && !isLoading && (
                  <motion.div key="results" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                    
                    <div className="flex justify-between items-end mb-6">
                      <h2 className="text-3xl font-black text-[#101112]">{t.resultsTitle}</h2>
                      <button onClick={() => handleDownloadPDF('budget-results-container', `AMI_Planner_Orcamento_${churchName || 'Projeto'}.pdf`, churchName || 'Orçamento AV')} className="bg-[#101112] text-white hover:bg-[#cba052] transition-colors hover:text-[#101112] px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        {t.downloadPDF}
                      </button>
                    </div>

                    {/* PDF Container, strictly hex colors to bypass any oklch parsing issues */}
                    <div id="budget-results-container" className="space-y-6 bg-[#f9fafb] rounded-3xl pb-8 p-1">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-[#ffffff] border-2 border-[#e5e7eb] rounded-2xl p-6 xl:p-8">
                           <div className="text-[10px] uppercase tracking-widest text-[#db7b35] mb-2 font-black">{t.summaryLabel}</div>
                           <div className="text-sm font-medium leading-[1.7] text-[#374151]">{budgetResult.summary}</div>
                         </div>
                         <div className="bg-[#226f68] text-[#ffffff] border border-[#226f68] rounded-2xl p-6 xl:p-8 flex flex-col justify-center items-center text-center">
                           <div className="text-[10px] uppercase tracking-widest text-[#cba052] mb-1 font-bold">{t.estimatedTotal}</div>
                           <div className="text-[2.5rem] font-black tracking-tighter">{budgetResult.totalEstimated}</div>
                         </div>
                       </div>

                       {budgetResult.categories.map((cat, idx) => (
                         <div key={idx} className="bg-[#ffffff] border border-[#e5e7eb] rounded-2xl p-6 xl:p-8">
                           <div className="text-[14px] font-black uppercase tracking-wider flex justify-between items-center mb-6 pb-4 border-b border-[#e5e7eb] text-[#101112]">
                             <span>{cat.name}</span>
                           </div>
                           <div className="space-y-2">
                             {cat.items.map((item, itemIdx) => (
                               <div key={itemIdx} className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-[#f3f4f6] last:border-0 gap-4">
                                 <div className="flex-1">
                                   <div className="font-bold text-[15px] tracking-tight text-[#101112] mb-1">{item.productName}</div>
                                   <div className="text-[13px] text-[#4b5563] leading-relaxed">
                                     <span className="font-black text-[#226f68] mr-2 bg-[#f0fdfa] px-2 py-0.5 rounded">{item.priceTxt}</span> 
                                     {item.reason}
                                   </div>
                                 </div>
                                 <a
                                   href={item.buyUrl}
                                   target="_blank"
                                   rel="noreferrer"
                                   className="bg-[#f0f2f5] hover:bg-[#db7b35] text-[#101112] hover:text-[#ffffff] text-[10px] uppercase font-black tracking-widest py-3 px-6 rounded-lg shrink-0 whitespace-nowrap text-center transition-all"
                                 >
                                   {t.buyLink}
                                 </a>
                               </div>
                             ))}
                           </div>
                         </div>
                       ))}
                    </div>

                  </motion.div>
                )}
               </AnimatePresence>
            </section>
          </div>
        )}
        
      </main>

      {/* Footer */}
      <footer className="bg-[#101112] text-center border-t border-white/5 py-8 mt-auto relative z-10 w-full">
         <div className="text-[#cba052] font-black tracking-widest text-[10px] uppercase">{t.footer}</div>
      </footer>
    </div>
  );
}
