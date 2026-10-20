export function GET() {
  const d = new Date().toISOString().slice(0, 10);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://lizzy.my.id/</loc><lastmod>${d}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url></urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
