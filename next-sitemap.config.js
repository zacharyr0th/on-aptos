/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://onaptos.com",
  generateRobotsTxt: true,
  exclude: ["/api/*", "/server-sitemap.xml"],
  robotsTxtOptions: {
    additionalSitemaps: ["https://onaptos.com/server-sitemap.xml"],
  },
};
