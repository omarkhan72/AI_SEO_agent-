import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Layers, 
  LineChart, 
  Search, 
  Loader2, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useAgentAPI } from '../../hooks/useAgentAPI.js';

export default function AddPropertyModal({ isOpen, onClose, onSuccess }) {
  const { loadingStates, addProperty } = useAgentAPI();
  const [step, setStep] = useState(1);
  const [domainUrl, setDomainUrl] = useState('');
  const [cmsPlatform, setCmsPlatform] = useState('nextjs');
  const [connectGsc, setConnectGsc] = useState(true);
  const [urlError, setUrlError] = useState('');

  if (!isOpen) return null;

  // Validate URL format before proceeding to Step 2
  const handleNextStep = () => {
    setUrlError('');
    const trimUrl = domainUrl.trim();
    
    if (!trimUrl) {
      setUrlError('Website URL is required.');
      return;
    }

    // Standard URL validation checks
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (!urlPattern.test(trimUrl)) {
      setUrlError('Invalid URL format. (e.g., https://example.com)');
      return;
    }

    setStep(2);
  };

  const handleBackStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUrlError('');

    try {
      const result = await addProperty(domainUrl, cmsPlatform, connectGsc);
      if (result && result.success && result.data) {
        onSuccess(result.data);
        resetForm();
      }
    } catch (err) {
      console.error('Failed to link website property:', err);
    }
  };

  const resetForm = () => {
    setStep(1);
    setDomainUrl('');
    setCmsPlatform('nextjs');
    setConnectGsc(true);
    setUrlError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphic/translucent backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={resetForm}
      />

      {/* Stark white / Vercel style Modal Panel */}
      <div className="bg-white/95 border border-gray-200/80 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative z-10 transition-all duration-300 transform scale-100 flex flex-col backdrop-blur-md">
        
        {/* Header bar */}
        <div className="px-6 py-5 border-b border-gray-150 flex items-center justify-between bg-white/50">
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Link New Property
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mt-0.5">
              Step {step} of 2 &bull; {step === 1 ? 'Configure' : 'Connect'}
            </p>
          </div>
          <button 
            onClick={resetForm}
            className="p-1 rounded-lg border border-gray-150 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Modal body */}
          <div className="p-6 space-y-5 flex-1">
            {step === 1 ? (
              <div className="space-y-4">
                {/* Website URL Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Website URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="https://example.com"
                      value={domainUrl}
                      onChange={(e) => setDomainUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 text-xs font-semibold"
                    />
                  </div>
                  {urlError ? (
                    <p className="text-[11px] text-rose-600 font-medium">{urlError}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      What website do you want the AI to optimize?
                    </p>
                  )}
                </div>

                {/* CMS Platform Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    CMS Platform
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <select
                      value={cmsPlatform}
                      onChange={(e) => setCmsPlatform(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 text-xs font-semibold cursor-pointer"
                    >
                      <option value="nextjs">Next.js</option>
                      <option value="wordpress">WordPress</option>
                      <option value="webflow">Webflow</option>
                      <option value="shopify">Shopify</option>
                      <option value="custom">Other / Custom</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  How should SEO Studio access your search engine analytics?
                </p>

                {/* Connect GSC Card Option A */}
                <div 
                  onClick={() => setConnectGsc(true)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    connectGsc 
                      ? 'border-indigo-600 bg-indigo-50/10' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                      connectGsc ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-gray-300'
                    }`}>
                      {connectGsc && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        Connect Google Search Console
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-extrabold uppercase">
                          Recommended
                        </span>
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                        Authorize organic search query mappings, crawls data, and indexing reports immediately.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skip GSC Card Option B */}
                <div 
                  onClick={() => setConnectGsc(false)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    !connectGsc 
                      ? 'border-indigo-600 bg-indigo-50/10' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                      !connectGsc ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-gray-300'
                    }`}>
                      {!connectGsc && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-900">
                        Skip GSC connection
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                        Skip integrations check for now. Run technical audit reports and public crawling diagnostics only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer bar */}
          <div className="px-6 py-4.5 border-t border-gray-150 bg-gray-50/50 flex justify-between gap-3">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-lg cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  Next Step
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={loadingStates.addProperty}
                  onClick={handleBackStep}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-lg cursor-pointer bg-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loadingStates.addProperty}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {loadingStates.addProperty ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Website
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline fallback check if check icon wasn't fully resolved
function CheckCircle2({ className }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
