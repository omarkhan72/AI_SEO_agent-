import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api';

export function useAgentAPI() {
  const [loadingStates, setLoadingStates] = useState({
    planContent: false,
    siteAudit: false,
    trackPerformance: false,
    suggestions: false,
    chat: false,
    gscAudit: false,
    keywordResearch: false,
    linkDiscovery: false,
    outreachGeneration: false,
    fetchProperties: false,
    addProperty: false
  });

  const setSingleLoading = (key, value) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Triggers the AI Content Planner to draft an outline for a keyword.
   */
  const planContent = async (keyword) => {
    setSingleLoading('planContent', true);
    const toastId = toast.loading(`Planning outline for "${keyword}"...`);
    try {
      const response = await axios.post(`${API_BASE}/plan-content`, { keyword });
      if (response.data && response.data.success) {
        toast.success(`Success! Outline blueprint created for "${keyword}".`, { id: toastId });
        return response.data;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error planning content: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setSingleLoading('planContent', false);
    }
  };

  /**
   * Triggers the site SEO Auditor to run a 6-dimension evaluation.
   */
  const runSiteAudit = async (targetDomain) => {
    setSingleLoading('siteAudit', true);
    const toastId = toast.loading(`Initiating SEO audit for "${targetDomain}"...`);
    try {
      const response = await axios.post(`${API_BASE}/site-audit`, { targetDomain });
      if (response.data && response.data.success) {
        toast.success(`Success! Technical audit report finalized for "${targetDomain}".`, { id: toastId });
        return response.data;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error auditing site: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setSingleLoading('siteAudit', false);
    }
  };

  /**
   * Runs organic search ranking check and logs snapshot.
   */
  const trackPerformance = async (documentId) => {
    setSingleLoading('trackPerformance', true);
    const toastId = toast.loading('Executing live ranking tracking check...');
    try {
      const response = await axios.post(`${API_BASE}/performance/track`, { documentId });
      if (response.data && response.data.success) {
        const payload = response.data.data;
        if (payload.is_win) {
          toast.success(`🎉 SEO Win! Ranking improved to position #${payload.current_position}!`, { id: toastId, duration: 5000 });
        } else {
          toast.success(`Rank tracked successfully. Current position: #${payload.current_position}.`, { id: toastId });
        }
        return payload;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error tracking performance: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setSingleLoading('trackPerformance', false);
    }
  };

  /**
   * Fetches automated improvement suggestions for slipping articles.
   */
  const getSuggestions = async (documentId) => {
    setSingleLoading('suggestions', true);
    const toastId = toast.loading('Analyzing position trajectory and diagnosing gaps...');
    try {
      const response = await axios.get(`${API_BASE}/performance/suggestions/${documentId}`);
      if (response.data && response.data.success) {
        const payload = response.data.data;
        if (payload.status === 'needs_optimization') {
          toast.success('Analysis complete: Gaps identified. Recommendations generated.', { id: toastId });
        } else {
          toast.success('Analysis complete: Rankings are stable. No optimization required.', { id: toastId });
        }
        return payload;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error fetching suggestions: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setSingleLoading('suggestions', false);
    }
  };

  /**
   * Sends a message to the AI Consultant and logs/retrieves history.
   */
  const sendChatMessage = async (domain, sessionId, message) => {
    setSingleLoading('chat', true);
    try {
      const response = await axios.post(`${API_BASE}/chat/message`, {
        domain,
        sessionId,
        message
      });
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Consultation failed: ${errMsg}`);
      throw err;
    } finally {
      setSingleLoading('chat', false);
    }
  };

  /**
   * Triggers GSC performance audit for site.
   */
  const runGscAudit = async (siteUrl) => {
    setSingleLoading('gscAudit', true);
    const toastId = toast.loading(`Initiating GSC performance audit for "${siteUrl}"...`);
    try {
      const response = await axios.post(`${API_BASE}/gsc-audit`, { siteUrl });
      if (response.data && response.data.success) {
        toast.success(`Success! GSC audit finalized for "${siteUrl}".`, { id: toastId });
        return response.data;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error running GSC audit: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setSingleLoading('gscAudit', false);
    }
  };

  /**
   * Discovers and clusters keywords based on seed phrase.
   */
  const researchKeywords = async (seedTopic, siteDA = 30, intent = 'all') => {
    setSingleLoading('keywordResearch', true);
    const toastId = toast.loading(`Searching semantic clusters for "${seedTopic}"...`);
    try {
      const response = await axios.post(`${API_BASE}/research-keywords`, { seedTopic, siteDA, intent });
      if (response.data && response.data.success) {
        toast.success(`Success! Keyword clusters discovered for "${seedTopic}".`, { id: toastId });
        return response.data;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error researching keywords: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setSingleLoading('keywordResearch', false);
    }
  };

  /**
   * Discovers Guest Post targets and Unlinked Mentions.
   */
  const discoverLinks = async (keyword, brandName, targetDomain) => {
    setSingleLoading('linkDiscovery', true);
    const toastId = toast.loading('Searching guest post directories and unlinked brand mentions...');
    try {
      const response = await axios.post(`${API_BASE}/backlinks/discover`, { keyword, brandName, targetDomain });
      if (response.data && response.data.success) {
        toast.success('Success! Outreach prospects discovered.', { id: toastId });
        return response.data;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error discovering backlink targets: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setSingleLoading('linkDiscovery', false);
    }
  };

  /**
   * Generates a digital PR outreach template.
   */
  const generateOutreach = async (targetUrl, opportunityType, brandName) => {
    setSingleLoading('outreachGeneration', true);
    const toastId = toast.loading(`Drafting AI outreach pitch for "${targetUrl}"...`);
    try {
      const response = await axios.post(`${API_BASE}/backlinks/outreach`, { targetUrl, opportunityType, brandName });
      if (response.data && response.data.success) {
        toast.success('Success! AI outreach pitch drafted.', { id: toastId });
        return response.data;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error generating outreach pitch: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setSingleLoading('outreachGeneration', false);
    }
  };

  /**
   * Fetches all registered web properties for the user.
   */
  const fetchProperties = async () => {
    setSingleLoading('fetchProperties', true);
    try {
      const response = await axios.get(`${API_BASE}/properties`);
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error loading websites: ${errMsg}`);
      throw err;
    } finally {
      setSingleLoading('fetchProperties', false);
    }
  };

  /**
   * Links a new website property to SEO Studio.
   */
  const addProperty = async (domainUrl, cmsPlatform, connectGsc = false) => {
    setSingleLoading('addProperty', true);
    const toastId = toast.loading(`Linking website "${domainUrl}"...`);
    try {
      const response = await axios.post(`${API_BASE}/properties/add`, { domainUrl, cmsPlatform, connectGsc });
      if (response.data && response.data.success) {
        toast.success(`Success! Website linked to your dashboard.`, { id: toastId });
        return response.data;
      }
      throw new Error(response.data?.error || "Invalid response format");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      toast.error(`Error linking website: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setSingleLoading('addProperty', false);
    }
  };

  return {
    loadingStates,
    planContent,
    runSiteAudit,
    trackPerformance,
    getSuggestions,
    sendChatMessage,
    runGscAudit,
    researchKeywords,
    discoverLinks,
    generateOutreach,
    fetchProperties,
    addProperty
  };
}
