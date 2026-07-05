/**
 * Configuration
 * 
 * Update these values once, they're used throughout the system
 */

export const config = {
  // Your custom domain
  domain: process.env.CRISIS_DOMAIN || "crisisrelief.org",
  
  // Site metadata
  siteName: "Crisis Relief Dashboard",
  siteDescription: "Real-time global crisis information. Who needs help today?",
  siteAuthor: "Your Name",
  
  // Contact
  contactEmail: "contact@crisisrelief.org",
  
  // Social
  twitterHandle: "@crisisrelief",
  
  // Discord webhook (for form submissions)
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || "",
  
  // Crisis data
  dataFile: "data/crises.json",
  outputDir: "public",
  
  // URLs that get generated
  urls: {
    base: () => `https://${config.domain}`,
    home: () => `${config.urls.base()}/`,
    crisis: (slug: string) => `${config.urls.base()}/crises/${slug}/`,
    submit: () => `${config.urls.base()}/submit.html`,
    api: () => `${config.urls.base()}/api/crises.json`
  }
};

// Export for use in other files
export function getBaseUrl() {
  return config.urls.base();
}

export function getCrisisUrl(slug: string) {
  return config.urls.crisis(slug);
}

export function getSubmitUrl() {
  return config.urls.submit();
}
