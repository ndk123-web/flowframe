import React from "react";
import { 
  SiReact, SiNextdotjs, SiVuedotjs, SiSvelte, SiAngular, SiApple, SiAndroid,
  SiGooglecloud, SiNginx, SiCloudflare, SiNodedotjs, SiGo, SiPython, SiDotnet, SiRuby, SiPhp, SiRust,
  SiPostgresql, SiSupabase, SiPlanetscale, SiCockroachlabs, SiRedis, SiUpstash,
  SiKong, SiTraefikproxy, SiFastly, SiAkamai, SiRabbitmq, SiApachekafka
} from "react-icons/si";
import { TbBrandAws, TbBrandAzure } from "react-icons/tb";
import { FaJava } from "react-icons/fa";
import { FiGlobe } from "react-icons/fi";

interface IconProps {
  className?: string;
  type: string;
}

export function ComponentIcon({ type, className = "w-5 h-5" }: IconProps) {
  const normalizedType = String(type || "").toLowerCase();

  switch (normalizedType) {
    case "client":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <rect x="2" y="3" width="20" height="13" rx="2" />
          <path d="M9 21h6" />
          <path d="M12 16v5" />
          <line x1="5" y1="6" x2="8" y2="6" strokeWidth={1.5} />
          <line x1="10" y1="6" x2="19" y2="6" strokeWidth={1.5} opacity={0.6} />
          <rect x="5" y="9" width="6" height="4" rx="0.5" opacity={0.7} />
          <line x1="13" y1="9" x2="19" y2="9" strokeWidth={1.5} opacity={0.5} />
          <line x1="13" y1="11" x2="17" y2="11" strokeWidth={1.5} opacity={0.5} />
        </svg>
      );

    case "dns":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M16.5 7.5h.01M7.5 16.5h.01" strokeWidth={3} strokeLinecap="round" />
        </svg>
      );

    case "cdn":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <circle cx="12" cy="5" r="3" />
          <circle cx="5" cy="17" r="3" />
          <circle cx="19" cy="17" r="3" />
          <path d="M9 7l-2.5 7M15 7l2.5 7M8 17h8" strokeDasharray="2 2" />
          <path d="M12 11a2.5 2.5 0 0 1 0 5" opacity={0.8} />
          <circle cx="12" cy="13" r="1" fill="currentColor" />
        </svg>
      );

    case "api-gateway":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M12 3v6M12 15v6" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity={0.12} />
          <path d="M10 12h4" />
        </svg>
      );

    case "load-balancer":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
          <path d="M7 6.5C8.3 5 10.1 4 12 4s3.7 1 5 2.5" />
          <path d="M17 17.5c-1.3 1.5-3.1 2.5-5 2.5s-3.7-1-5-2.5" />
        </svg>
      );

    case "server":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <rect x="2" y="4" width="20" height="7" rx="1.5" />
          <line x1="5" y1="7.5" x2="13" y2="7.5" strokeWidth={1.5} opacity={0.7} />
          <circle cx="17" cy="7.5" r="0.75" fill="currentColor" />
          <circle cx="19" cy="7.5" r="0.75" fill="currentColor" />
          <rect x="2" y="13" width="20" height="7" rx="1.5" />
          <line x1="5" y1="16.5" x2="13" y2="16.5" strokeWidth={1.5} opacity={0.7} />
          <circle cx="17" cy="16.5" r="0.75" fill="currentColor" />
          <circle cx="19" cy="16.5" r="0.75" fill="currentColor" opacity={0.5} />
        </svg>
      );

    case "redis":
    case "redis_cache":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <path d="M3 7l9-4 9 4-9 4-9-4z" fill="currentColor" fillOpacity={0.1} />
          <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
          <path
            d="M13 6l-4 6h5v6l4-6h-5V6z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1.2}
            className="text-amber-400"
          />
        </svg>
      );

    case "postgres":
    case "postgres_database":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <path d="M12 22c5.523 0 10-1.79 10-4V6c0-2.21-4.477-4-10-4S2 3.79 2 6v12c0 2.21 4.477 4 10 4z" />
          <path d="M22 6c0 2.21-4.477 4-10 4S2 8.21 2 6M2 12c0 2.21 4.477 4 10 4s10-1.79 10-4" />
          <line x1="7" y1="12" x2="17" y2="12" strokeWidth={1.2} opacity={0.6} />
          <line x1="7" y1="18" x2="17" y2="18" strokeWidth={1.2} opacity={0.6} />
        </svg>
      );

    case "storage":
    case "storage_system":
    case "cloud_storage":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <path d="M18 10h.01M12 6c-3 0-5 2-5 5H6c-1.7 0-3 1.3-3 3s1.3 3 3 3h12c2.2 0 4-1.8 4-4s-1.8-4-4-4h-1c-.5-1.8-2-3-4-3z" />
          <path d="M12 12v4M9 14l3-3 3 3" />
        </svg>
      );

    case "message-queue":
    case "message_queue":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <rect x="3" y="4" width="18" height="4" rx="1" fill="currentColor" fillOpacity={0.1} />
          <rect x="3" y="10" width="18" height="4" rx="1" fill="currentColor" fillOpacity={0.15} />
          <rect x="3" y="16" width="18" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
          <path d="M7 6h10M7 12h10M7 18h10" strokeWidth={1.2} opacity={0.6} />
        </svg>
      );

    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
}

// ─── High-Fidelity Brand Logo Lookup ───

interface BrandLogoMapEntry {
  component?: React.ComponentType<{ className?: string; color?: string }>;
  color?: string;
  custom?: (className?: string) => React.ReactNode;
}

const BRAND_LOGO_MAP: Record<string, BrandLogoMapEntry> = {
  react: { component: SiReact, color: "#61DAFB" },
  nextjs: { component: SiNextdotjs, color: "#000000" },
  vue: { component: SiVuedotjs, color: "#4FC08D" },
  svelte: { component: SiSvelte, color: "#FF3E00" },
  angular: { component: SiAngular, color: "#DD0031" },
  ios: { component: SiApple, color: "#000000" },
  android: { component: SiAndroid, color: "#3DDC84" },
  browser: { component: FiGlobe, color: "#a78bfa" },

  generic: { component: FiGlobe, color: "#60a5fa" },
  "aws-alb": { component: TbBrandAws, color: "#FF9900" },
  "aws-nlb": { component: TbBrandAws, color: "#FF9900" },
  "azure-lb": { component: TbBrandAzure, color: "#0089D6" },
  "gcp-lb": { component: SiGooglecloud, color: "#4285F4" },
  nginx: { component: SiNginx, color: "#009639" },
  haproxy: {
    custom: (className) => (
      <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="#00A2E8" strokeWidth="2"/>
        <path d="M8 12h8M12 8v8" stroke="#35495E" strokeWidth="2"/>
      </svg>
    )
  },
  cloudflare: { component: SiCloudflare, color: "#F38020" },

  nodejs: { component: SiNodedotjs, color: "#339933" },
  go: { component: SiGo, color: "#00ADD8" },
  python: { component: SiPython, color: "#3776AB" },
  java: { component: FaJava, color: "#ED8B00" },
  dotnet: { component: SiDotnet, color: "#512BD4" },
  ruby: { component: SiRuby, color: "#CC342D" },
  php: { component: SiPhp, color: "#777BB4" },
  rust: { component: SiRust, color: "#A72C15" },

  "aws-apigw": { component: TbBrandAws, color: "#FF9900" },
  kong: { component: SiKong, color: "#1A1A1A" },
  traefik: { component: SiTraefikproxy, color: "#24A1C1" },
  "nginx-gw": { component: SiNginx, color: "#009639" },

  redis: { component: SiRedis, color: "#DC382D" },
  upstash: { component: SiUpstash, color: "#00E599" },
  elasticache: { component: TbBrandAws, color: "#FF9900" },
  memcached: { component: SiRedis, color: "#DC382D" },

  postgres: { component: SiPostgresql, color: "#4169E1" },
  supabase: { component: SiSupabase, color: "#3ECF8E" },
  "aws-rds": { component: TbBrandAws, color: "#FF9900" },
  planetscale: { component: SiPlanetscale, color: "#000000" },
  cockroachdb: { component: SiCockroachlabs, color: "#244C5A" },

  s3: { component: TbBrandAws, color: "#FF9900" },
  gcs: { component: SiGooglecloud, color: "#4285F4" },
  "azure-blob": { component: TbBrandAzure, color: "#0089D6" },
  r2: { component: SiCloudflare, color: "#F38020" },

  "cloudflare-cdn": { component: SiCloudflare, color: "#F38020" },
  cloudfront: { component: TbBrandAws, color: "#FF9900" },
  fastly: { component: SiFastly, color: "#E21F26" },
  akamai: { component: SiAkamai, color: "#0099CC" },

  route53: { component: TbBrandAws, color: "#FF9900" },
  "cloudflare-dns": { component: SiCloudflare, color: "#F38020" },
  "gcp-dns": { component: SiGooglecloud, color: "#4285F4" },
  rabbitmq: { component: SiRabbitmq, color: "#FF6600" },
  kafka: { component: SiApachekafka, color: "#000000" },
  sqs: { component: TbBrandAws, color: "#FF9900" },
  "redis-mq": { component: SiRedis, color: "#DC382D" },
};

export function BrandLogo({ id, className = "w-5 h-5" }: { id: string; className?: string }) {
  const normId = String(id || "").toLowerCase();
  const entry = BRAND_LOGO_MAP[normId];

  if (!entry) {
    return <FiGlobe className={className} style={{ color: "#a78bfa" }} />;
  }

  if (entry.custom) {
    return <>{entry.custom(className)}</>;
  }

  const LogoComponent = entry.component;
  if (!LogoComponent) {
    return <FiGlobe className={className} style={{ color: "#a78bfa" }} />;
  }

  // If Next.js, Kong, or Planetscale, let's keep it black/white style based on dark mode or custom coloring
  const isNeutral = normId === "nextjs" || normId === "kong" || normId === "planetscale";
  const inlineColor = isNeutral ? undefined : entry.color;

  return <LogoComponent className={className} color={inlineColor} />;
}

export interface FlavorOption {
  id: string;
  label: string;
  shortLabel: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}

export const NODE_FLAVORS: Record<string, FlavorOption[]> = {
  client: [
    { id: "browser", label: "Web Browser", shortLabel: "Browser", textClass: "text-violet-300", bgClass: "bg-violet-500/10", borderClass: "border-violet-500/20" },
    { id: "react", label: "React App", shortLabel: "React", textClass: "text-cyan-300", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-400/20" },
    { id: "nextjs", label: "Next.js App", shortLabel: "Next.js", textClass: "text-slate-100", bgClass: "bg-slate-600/30", borderClass: "border-slate-400/20" },
    { id: "vue", label: "Vue.js App", shortLabel: "Vue", textClass: "text-emerald-300", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-400/20" },
    { id: "svelte", label: "Svelte App", shortLabel: "Svelte", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "angular", label: "Angular App", shortLabel: "Angular", textClass: "text-red-300", bgClass: "bg-red-500/10", borderClass: "border-red-400/20" },
    { id: "ios", label: "iOS App", shortLabel: "iOS", textClass: "text-slate-200", bgClass: "bg-slate-600/30", borderClass: "border-slate-400/20" },
    { id: "android", label: "Android App", shortLabel: "Android", textClass: "text-green-300", bgClass: "bg-green-500/10", borderClass: "border-green-400/20" },
  ],
  "load-balancer": [
    { id: "generic", label: "Generic Load Balancer", shortLabel: "Generic", textClass: "text-blue-300", bgClass: "bg-blue-500/10", borderClass: "border-blue-400/20" },
    { id: "aws-alb", label: "AWS Application Load Balancer (ALB)", shortLabel: "AWS ALB", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "aws-nlb", label: "AWS Network Load Balancer (NLB)", shortLabel: "AWS NLB", textClass: "text-orange-200", bgClass: "bg-orange-600/10", borderClass: "border-orange-400/20" },
    { id: "azure-lb", label: "Azure Load Balancer", shortLabel: "Azure LB", textClass: "text-blue-200", bgClass: "bg-blue-600/10", borderClass: "border-blue-400/20" },
    { id: "gcp-lb", label: "Google Cloud Load Balancing", shortLabel: "GCP LB", textClass: "text-yellow-300", bgClass: "bg-yellow-500/10", borderClass: "border-yellow-400/20" },
    { id: "nginx", label: "Nginx Load Balancer", shortLabel: "Nginx", textClass: "text-green-300", bgClass: "bg-green-500/10", borderClass: "border-green-400/20" },
    { id: "haproxy", label: "HAProxy", shortLabel: "HAProxy", textClass: "text-teal-300", bgClass: "bg-teal-500/10", borderClass: "border-teal-400/20" },
    { id: "cloudflare", label: "Cloudflare Load Balancer", shortLabel: "CF LB", textClass: "text-orange-400", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
  ],
  server: [
    { id: "nodejs", label: "Node.js Server", shortLabel: "Node.js", textClass: "text-green-300", bgClass: "bg-green-500/10", borderClass: "border-green-400/20" },
    { id: "go", label: "Go (Golang) Server", shortLabel: "Go", textClass: "text-cyan-300", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-400/20" },
    { id: "python", label: "Python / FastAPI Server", shortLabel: "Python", textClass: "text-yellow-300", bgClass: "bg-yellow-500/10", borderClass: "border-yellow-400/20" },
    { id: "java", label: "Java / Spring Boot", shortLabel: "Java", textClass: "text-amber-300", bgClass: "bg-amber-500/10", borderClass: "border-amber-400/20" },
    { id: "dotnet", label: ".NET Core / C# Server", shortLabel: ".NET", textClass: "text-purple-300", bgClass: "bg-purple-500/10", borderClass: "border-purple-400/20" },
    { id: "ruby", label: "Ruby on Rails Server", shortLabel: "Ruby", textClass: "text-red-300", bgClass: "bg-red-500/10", borderClass: "border-red-400/20" },
    { id: "php", label: "PHP Server", shortLabel: "PHP", textClass: "text-indigo-300", bgClass: "bg-indigo-500/10", borderClass: "border-indigo-400/20" },
    { id: "rust", label: "Rust Server", shortLabel: "Rust", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
  ],
  "api-gateway": [
    { id: "generic", label: "Generic API Gateway", shortLabel: "Generic", textClass: "text-fuchsia-300", bgClass: "bg-fuchsia-500/10", borderClass: "border-fuchsia-400/20" },
    { id: "aws-apigw", label: "AWS API Gateway", shortLabel: "AWS GW", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "kong", label: "Kong API Gateway", shortLabel: "Kong", textClass: "text-blue-300", bgClass: "bg-blue-500/10", borderClass: "border-blue-400/20" },
    { id: "traefik", label: "Traefik Proxy", shortLabel: "Traefik", textClass: "text-cyan-300", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-400/20" },
    { id: "nginx-gw", label: "Nginx API Gateway", shortLabel: "Nginx GW", textClass: "text-green-300", bgClass: "bg-green-500/10", borderClass: "border-green-400/20" },
  ],
  redis: [
    { id: "redis", label: "Redis Cache", shortLabel: "Redis", textClass: "text-red-300", bgClass: "bg-red-500/10", borderClass: "border-red-400/20" },
    { id: "upstash", label: "Upstash Serverless Redis", shortLabel: "Upstash", textClass: "text-emerald-300", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-400/20" },
    { id: "elasticache", label: "AWS ElastiCache Redis", shortLabel: "ElastiCache", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "memcached", label: "Memcached Database", shortLabel: "Memcached", textClass: "text-amber-300", bgClass: "bg-amber-500/10", borderClass: "border-amber-400/20" },
  ],
  postgres: [
    { id: "postgres", label: "PostgreSQL Database", shortLabel: "Postgres", textClass: "text-cyan-300", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-400/20" },
    { id: "supabase", label: "Supabase Postgres DB", shortLabel: "Supabase", textClass: "text-emerald-300", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-400/20" },
    { id: "aws-rds", label: "AWS RDS PostgreSQL", shortLabel: "AWS RDS", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "planetscale", label: "PlanetScale DB", shortLabel: "PlanetScale", textClass: "text-violet-300", bgClass: "bg-violet-500/10", borderClass: "border-violet-400/20" },
    { id: "cockroachdb", label: "CockroachDB", shortLabel: "CockroachDB", textClass: "text-blue-300", bgClass: "bg-blue-500/10", borderClass: "border-blue-400/20" },
  ],
  storage: [
    { id: "s3", label: "AWS S3 Object Storage", shortLabel: "S3", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "gcs", label: "Google Cloud Storage (GCS)", shortLabel: "GCS", textClass: "text-blue-300", bgClass: "bg-blue-500/10", borderClass: "border-blue-400/20" },
    { id: "azure-blob", label: "Azure Blob Storage", shortLabel: "Azure Blob", textClass: "text-blue-200", bgClass: "bg-blue-600/10", borderClass: "border-blue-400/20" },
    { id: "r2", label: "Cloudflare R2 Storage", shortLabel: "CF R2", textClass: "text-orange-400", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
  ],
  cdn: [
    { id: "cloudflare-cdn", label: "Cloudflare CDN", shortLabel: "Cloudflare", textClass: "text-orange-400", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "cloudfront", label: "AWS CloudFront CDN", shortLabel: "CloudFront", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "fastly", label: "Fastly CDN", shortLabel: "Fastly", textClass: "text-red-300", bgClass: "bg-red-500/10", borderClass: "border-red-400/20" },
    { id: "akamai", label: "Akamai CDN", shortLabel: "Akamai", textClass: "text-blue-300", bgClass: "bg-blue-500/10", borderClass: "border-blue-400/20" },
  ],
  dns: [
    { id: "route53", label: "AWS Route 53 DNS", shortLabel: "Route 53", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "cloudflare-dns", label: "Cloudflare DNS", shortLabel: "CF DNS", textClass: "text-orange-400", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "gcp-dns", label: "Google Cloud DNS", shortLabel: "GCP DNS", textClass: "text-blue-300", bgClass: "bg-blue-500/10", borderClass: "border-blue-400/20" },
  ],
  "message-queue": [
    { id: "rabbitmq", label: "RabbitMQ Broker", shortLabel: "RabbitMQ", textClass: "text-orange-300", bgClass: "bg-orange-500/10", borderClass: "border-orange-400/20" },
    { id: "kafka", label: "Apache Kafka Event Stream", shortLabel: "Kafka", textClass: "text-red-300", bgClass: "bg-red-500/10", borderClass: "border-red-400/20" },
    { id: "sqs", label: "AWS Simple Queue Service (SQS)", shortLabel: "AWS SQS", textClass: "text-orange-200", bgClass: "bg-orange-600/10", borderClass: "border-orange-400/20" },
    { id: "redis-mq", label: "Redis Message Queue", shortLabel: "Redis MQ", textClass: "text-red-400", bgClass: "bg-red-500/10", borderClass: "border-red-400/20" },
  ],
};

/** Returns the first (default) flavor id for a given node type. */
export function getDefaultFlavor(type: string): string {
  const flavors = NODE_FLAVORS[type];
  return flavors && flavors.length > 0 ? flavors[0].id : "";
}

/** Finds a specific flavor config by type + id. */
export function getFlavor(type: string, flavorId: string): FlavorOption | undefined {
  return NODE_FLAVORS[type]?.find((f) => f.id === flavorId);
}

// ─── Custom Brand-Logo Dropdown Component ───────────────────────────────────

interface CustomDropdownProps {
  type: string;
  value: string;
  onChange: (value: string) => void;
}

export function CustomDropdown({ type, value, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const options = NODE_FLAVORS[type] || [];
  const selectedOption = options.find((o) => o.id === value) || options[0];

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[color:var(--foreground)] text-left hover:border-violet-500/50 transition cursor-pointer outline-none shadow-sm"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedOption && (
            <div className="w-5 h-5 flex items-center justify-center bg-black/10 dark:bg-white/5 rounded p-0.5 shrink-0">
              <BrandLogo id={selectedOption.id} className="w-4 h-4" />
            </div>
          )}
          <span className="truncate font-semibold">{selectedOption?.label}</span>
        </div>
        <span className="text-[9px] text-[color:var(--foreground)]/45 select-none transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-1 scrollbar-thin">
          {options.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-left rounded-md transition cursor-pointer ${
                  isSelected
                    ? "bg-violet-500/10 text-violet-400 font-bold"
                    : "hover:bg-[var(--surface-muted)] text-[color:var(--foreground)]/80"
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center bg-black/10 dark:bg-white/5 rounded p-0.5 shrink-0">
                  <BrandLogo id={opt.id} className="w-4 h-4" />
                </div>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
