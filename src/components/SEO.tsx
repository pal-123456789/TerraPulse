import { Helmet } from "react-helmet-async";

const SITE = "https://www.terraguardians.us";
const DEFAULT_IMAGE = `${SITE}/og-image.jpg`;
const FOUNDER = "Pal Ghevariya";
const BRAND_KEYWORDS =
  "terra, terra pulse, terra guardians, terraguardians, terrapulse, guardians, anomaly detection, natural anomaly detection, nature anomaly detection, AI environmental monitoring, NASA satellite data, Pal Ghevariya";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

const SEO = ({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = "website",
  keywords,
  schema,
}: SEOProps) => {
  const url = `${SITE}${path}`;
  const fullTitle = title.includes("Terra Guardians")
    ? title
    : `${title} | Terra Guardians`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: title, item: url },
    ],
  };

  const schemas = Array.isArray(schema) ? schema : schema ? [schema] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={`Terra Guardians — Founded by ${FOUNDER}`} />
      <meta name="founder" content={FOUNDER} />
      <meta name="keywords" content={keywords ? `${keywords}, ${BRAND_KEYWORDS}` : BRAND_KEYWORDS} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Terra Guardians" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content="en_US" />
      <meta property="article:author" content={FOUNDER} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@terraguardians" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />
      <meta name="twitter:creator" content={`@${FOUNDER.replace(/\s+/g, "")}`} />

      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
