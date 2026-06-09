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
    chat: false
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

  return {
    loadingStates,
    planContent,
    runSiteAudit,
    trackPerformance,
    getSuggestions,
    sendChatMessage
  };
}
