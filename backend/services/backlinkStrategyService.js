import admin from 'firebase-admin';
import { fetchLiveSearchContext } from './searchService.js';
import { generateStructuredJSON } from './aiBrainService.js';

/**
 * Discovers backlink opportunities (Guest Posts guidelines and Unlinked Brand Mentions) using Brave Search.
 * 
 * @param {string} keyword - Niche keyword to search for guest contributions.
 * @param {string} brandName - Name of the sender brand.
 * @param {string} targetDomain - Domain name of the sender website.
 * @returns {Promise<Object>} Object containing guest_post_targets and unlinked_mentions.
 */
export async function discoverLinkOpportunities(keyword, brandName, targetDomain) {
  console.log(`[Backlink Engine] Initiating backlink discovery for keyword: "${keyword}", Brand: "${brandName}"`);

  // Step 1: Guest Post Finder (Advanced operators)
  const guestPostSearch = await fetchLiveSearchContext(`"${keyword}" "write for us"`);

  // Step 2: Unlinked Mention Scanner (Exclude target domain)
  // Clean targetDomain to remove http/https/www prefixes if present
  const cleanDomain = targetDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
  const unlinkedMentionSearch = await fetchLiveSearchContext(`"${brandName}" -site:${cleanDomain}`);

  // Step 3: Run AI Brain opportunity parsing
  const userContent = `Guest Post Search Results:
${guestPostSearch}

Unlinked Brand Mention Search Results:
${unlinkedMentionSearch}
`;

  const parserResult = await generateStructuredJSON('BACKLINK_OPPORTUNITY_PARSER', userContent);

  return {
    guest_post_targets: parserResult.guest_post_targets || [],
    unlinked_mentions: parserResult.unlinked_mentions || []
  };
}

/**
 * Generates a personalized outreach email template highlighting mutually beneficial information gain.
 * 
 * @param {string} targetUrl - Target website URL to contact.
 * @param {string} opportunityType - Type of opportunity ("Guest Post" or "Unlinked Mention").
 * @param {string} brandName - Sender brand name.
 * @returns {Promise<Object>} Object containing subject_line and email_body.
 */
export async function generateOutreachTemplate(targetUrl, opportunityType, brandName) {
  console.log(`[Backlink Engine] Generating outreach email for url: "${targetUrl}" (Type: "${opportunityType}")`);

  const variables = {
    opportunity_type: opportunityType,
    target_url: targetUrl,
    brand_name: brandName
  };

  const userContent = `Generate a personalized email pitching the editor at URL: ${targetUrl}`;

  const outreachResult = await generateStructuredJSON('OUTREACH_TEMPLATE_GENERATOR', userContent, variables);

  return {
    subject_line: outreachResult.subject_line,
    email_body: outreachResult.email_body
  };
}
