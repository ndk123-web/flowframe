"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type Theme = "light" | "dark";

type ScenarioCard = {
	id: string;
	title: string;
	description: string;
	href: string;
	difficulty: "Beginner" | "Intermediate" | "Advanced";
	focus: string[];
	expectedFrames: number;
	updatedAt: string;
	flowDiagram: string;
	systemBehavior: string;
};

const SCENARIOS: ScenarioCard[] = [
	{
		id: "simple-load-balancer",
		title: "Simple Load Balancer",
		description:
			"Watch round-robin request routing across multiple backend servers and inspect each frame in the sequence.",
		href: "/scenarios/simple-load-balancer",
		difficulty: "Beginner",
		focus: ["Round Robin", "Request Routing", "Traffic Visualization"],
		expectedFrames: 16,
		updatedAt: "2026-03-12",
		flowDiagram: "Client → Load Balancer → Server 1/2/3",
		systemBehavior: "Requests distribute across servers in round-robin order. Each server handles requests sequentially.",
	},
	{
		id: "simple-cache",
		title: "Simple Cache (Redis + Postgres)",
		description:
			"Observe cache hit, cache miss fallback to Postgres, and invalid-key lookups with per-frame debug details.",
		href: "/scenarios/simple-cache",
		difficulty: "Beginner",
		focus: ["Cache Aside", "Redis Hit/Miss", "DB Fallback"],
		expectedFrames: 6,
		updatedAt: "2026-03-13",
		flowDiagram: "Client → Redis ↔ Postgres",
		systemBehavior: "Requests check Redis first. On miss, they fallback to Postgres and update the cache.",
	},
	{
		id: "simple-api-gateway",
		title: "Simple API Gateway (Routing + Cache)",
		description:
			"Track endpoint-based routing from API Gateway to backend services with Redis/Postgres flow snapshots.",
		href: "/scenarios/simple-api-gateway",
		difficulty: "Intermediate",
		focus: ["Endpoint Routing", "Round Robin", "Gateway + Data Stores"],
		expectedFrames: 7,
		updatedAt: "2026-03-22",
		flowDiagram: "Client → API Gateway → LB → Servers, Cache, DB",
		systemBehavior: "Gateway routes endpoints to appropriate services. Full chain with caching and persistence.",
	},
	{
		id: "simple-valet-key",
		title: "Simple Valet Key (Direct Upload)",
		description:
			"Simulate signed URL upload flow where server issues a valet key and client uploads directly to cloud storage.",
		href: "/scenarios/simple-valet-key",
		difficulty: "Intermediate",
		focus: ["Signed URL", "Direct Upload", "Storage Offload"],
		expectedFrames: 24,
		updatedAt: "2026-03-29",
		flowDiagram: "Client → Server → signedURL → Client → Storage",
		systemBehavior: "Client gets a signed URL from server, then uploads directly to storage, offloading traffic from server.",
	},
];

function Reveal({
	children,
	delay = 0,
}: {
	children: React.ReactNode;
	delay?: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
		>
			{children}
		</motion.div>
	);
}

function ScenarioCardContent({ 
	scenario, 
	index,
	isHovered,
	onHoverChange,
}: { 
	scenario: ScenarioCard; 
	index: number;
	isHovered: boolean;
	onHoverChange: (hovered: boolean) => void;
}) {
	return (
		<article 
			onMouseEnter={() => onHoverChange(true)}
			onMouseLeave={() => onHoverChange(false)}
			className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]/45 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-violet-500/40 hover:bg-[var(--surface)]/75"
			style={{
				boxShadow: isHovered 
					? "0 20px 40px -15px rgba(139, 92, 246, 0.22)" 
					: "0 4px 20px -10px rgba(0, 0, 0, 0.15)"
			}}
		>
			{/* Hover gradient glow */}
			<div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-violet-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

			{/* Difficulty badge */}
			<div className={`absolute right-4 top-4 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
				scenario.difficulty === "Beginner"
					? "border-emerald-500/45 bg-emerald-500/10 text-emerald-400"
					: scenario.difficulty === "Intermediate"
						? "border-amber-500/45 bg-amber-500/10 text-amber-400"
						: "border-red-500/45 bg-red-500/10 text-red-400"
			}`}>
				{scenario.difficulty}
			</div>

			{/* Number indicator */}
			<div className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-violet-500/10 to-blue-500/10 text-xs font-bold text-violet-400 shadow-sm">
				{String(index + 1).padStart(2, "0")}
			</div>

			{/* Title */}
			<h2 className="text-xl font-bold tracking-tight text-[color:var(--foreground)] group-hover:text-violet-400 transition-colors">
				{scenario.title}
			</h2>
			
			{/* Description */}
			<p className="mt-2.5 text-xs text-[color:var(--foreground)]/70 line-clamp-2 leading-relaxed">
				{scenario.description}
			</p>

			{/* System flow diagram */}
			<motion.div
				initial={{ opacity: 0, height: 0 }}
				animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? "auto" : 0 }}
				transition={{ duration: 0.25, ease: "easeInOut" }}
				className="mt-4 overflow-hidden"
			>
				<div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--surface-muted)]/30 p-3 shadow-inner">
					<p className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/50 mb-1.5">System Flow</p>
					<p className="text-[11px] text-[color:var(--foreground)]/80 font-mono break-all">{scenario.flowDiagram}</p>
				</div>
			</motion.div>

			{/* System behavior */}
			<motion.div
				initial={{ opacity: 0, height: 0 }}
				animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? "auto" : 0 }}
				transition={{ duration: 0.25, ease: "easeInOut", delay: 0.05 }}
				className="mt-3 overflow-hidden"
			>
				<div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--surface-muted)]/30 p-3 shadow-inner">
					<p className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/50 mb-1">Behavior</p>
					<p className="text-[11px] text-[color:var(--foreground)]/75 leading-relaxed">{scenario.systemBehavior}</p>
				</div>
			</motion.div>

			{/* Focus Tags */}
			<div className="mt-5 flex flex-wrap gap-1.5">
				{scenario.focus.map((tag) => (
					<span
						key={tag}
						className="rounded-full border border-[var(--border)]/50 bg-[var(--surface-muted)]/40 px-2.5 py-0.5 text-[9px] font-medium text-[color:var(--foreground)]/65 transition-all duration-300"
						style={{
							borderColor: isHovered ? "rgba(139, 92, 246, 0.35)" : undefined,
							backgroundColor: isHovered ? "rgba(139, 92, 246, 0.06)" : undefined,
						}}
					>
						{tag}
					</span>
				))}
			</div>

			{/* Footer stats */}
			<div className="mt-5 flex items-center justify-between border-t border-[var(--border)]/40 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--foreground)]/45">
				<span>{scenario.expectedFrames} frames</span>
				<span>Updated {scenario.updatedAt}</span>
			</div>

			{/* CTA Button */}
			<Link
				href={scenario.href}
				className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500/80 to-violet-600/80 px-4 py-3 text-xs font-bold text-white transition-all duration-300 hover:from-blue-500 hover:to-violet-600 hover:shadow-[0_10px_25px_-10px_rgba(139,92,246,0.5)] active:scale-95 shadow-sm"
			>
				<span>Run Simulation</span>
				<motion.span
					animate={{ x: isHovered ? 3 : 0 }}
					transition={{ duration: 0.2 }}
				>
					→
				</motion.span>
			</Link>
		</article>
	);
}

function ScenarioCardState({ scenario, index }: { scenario: ScenarioCard; index: number }) {
	const [isHovered, setIsHovered] = useState(false);
	return <ScenarioCardContent scenario={scenario} index={index} isHovered={isHovered} onHoverChange={setIsHovered} />;
}

export default function ScenariosPage() {
	const [theme, setTheme] = useState<Theme>("dark");

	useEffect(() => {
		const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
		if (saved === "light" || saved === "dark") {
			setTheme(saved);
		} else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
			setTheme("light");
		}
	}, []);

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		window.localStorage.setItem("flowframe-theme", theme);
	}, [theme]);

	const stats = useMemo(() => {
		return {
			total: SCENARIOS.length,
			beginner: SCENARIOS.filter((item) => item.difficulty === "Beginner").length,
			avgFrames:
				SCENARIOS.length > 0
					? Math.round(
							SCENARIOS.reduce((sum, item) => sum + item.expectedFrames, 0) / SCENARIOS.length,
						)
					: 0,
		};
	}, []);

	return (
		<main className="relative min-h-screen overflow-hidden">
			<div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-40" />
			<div className="pointer-events-none absolute -left-20 top-[-100px] -z-10 h-[320px] w-[320px] rounded-full bg-cyan-500/18 blur-[90px]" />
			<div className="pointer-events-none absolute -right-16 top-[180px] -z-10 h-[360px] w-[360px] rounded-full bg-violet-500/14 blur-[100px]" />

			<SiteHeader
				theme={theme}
				showHomeLink
				badgeText="Simulation Scenario Library"
				onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
			/>

			{/* Hero Section */}
			<section className="mx-auto w-full max-w-6xl px-6 pb-8 pt-12">
				<Reveal>
					<div className="rounded-[2.5rem] border border-[var(--border)]/70 bg-[var(--surface)]/50 backdrop-blur-xl p-8 shadow-[0_30px_80px_-48px_var(--glow)] md:p-10 relative overflow-hidden group">
						<div className="absolute right-0 top-0 -mr-16 -mt-16 h-60 w-60 rounded-full bg-violet-500/5 blur-[60px]" />
						
						<p className="inline-flex rounded-full border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-blue-500/10 px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-[0.2em] text-[color:var(--foreground)]/85 shadow-sm">
							<span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-blue-400 mr-2 self-center" />
							Scenario Library
						</p>
						<h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl bg-gradient-to-r from-[color:var(--foreground)] via-[color:var(--foreground)]/95 to-violet-400/90 bg-clip-text text-transparent">
							Select a Scenario
						</h1>
						<p className="mt-3.5 max-w-3xl text-sm leading-relaxed text-[color:var(--foreground)]/70 md:text-base">
							Explore pre-configured distributed system structures. Hover over any scenario card to preview the system flow paths, then launch it to watch network packets travel in real-time.
						</p>

						<div className="mt-8 grid gap-4 sm:grid-cols-3">
							<div className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-muted)]/40 p-5 shadow-sm hover:border-violet-500/30 transition duration-300">
								<p className="text-[10px] uppercase font-bold tracking-wider text-[color:var(--foreground)]/50">Total Scenarios</p>
								<p className="mt-2 text-4xl font-bold text-violet-400">{stats.total}</p>
							</div>
							<div className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-muted)]/40 p-5 shadow-sm hover:border-emerald-500/30 transition duration-300">
								<p className="text-[10px] uppercase font-bold tracking-wider text-[color:var(--foreground)]/50">Beginner Tier</p>
								<p className="mt-2 text-4xl font-bold text-emerald-400">{stats.beginner}</p>
							</div>
							<div className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-muted)]/40 p-5 shadow-sm hover:border-blue-500/30 transition duration-300">
								<p className="text-[10px] uppercase font-bold tracking-wider text-[color:var(--foreground)]/50">Avg Time Frames</p>
								<p className="mt-2 text-4xl font-bold text-blue-400">{stats.avgFrames}</p>
							</div>
						</div>
					</div>
				</Reveal>
			</section>

			{/* Scenario Cards Grid */}
			<section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-16 md:grid-cols-2 lg:grid-cols-3">
				{SCENARIOS.map((scenario, index) => (
					<Reveal key={scenario.id} delay={index * 0.08}>
						<ScenarioCardState scenario={scenario} index={index} />
					</Reveal>
				))}
			</section>

			{/* Footer Info */}
			<section className="mx-auto w-full max-w-6xl px-6 pb-12">
				<Reveal>
					<div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30 backdrop-blur-md p-6 text-xs text-[color:var(--foreground)]/70 md:flex md:items-center md:justify-between shadow-sm">
						<div>
							<p className="font-semibold text-[color:var(--foreground)]">Looking to design custom scenarios?</p>
							<p className="text-[color:var(--foreground)]/55 mt-0.5">Use the Interactive Sandbox Workspace to draw any architecture from scratch!</p>
						</div>
						<Link
							href="/workspace"
							className="mt-4 inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-4 py-2 text-xs font-bold hover:bg-[var(--surface-muted)] transition shadow-sm md:mt-0"
						>
							Launch Custom Sandbox 🛠️
						</Link>
					</div>
				</Reveal>
			</section>

			<SiteFooter />
		</main>
	);
}
