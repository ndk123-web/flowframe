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
	flowDiagram: string; // ASCII flow like "Client → LB → Servers"
	systemBehavior: string; // Description of what happens
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
		flowDiagram: "Client → Load Balancer → Server 1/2",
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
		systemBehavior: "requests check Redis first. On miss, fallback to Postgres. Data flows both directions.",
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
			initial={{ opacity: 0, y: 26 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
		>
			{children}
		</motion.div>
	);
}

function FlowDiagram({ flow }: { flow: string }) {
	return (
		<svg className="h-12 w-full" viewBox="0 0 280 48" xmlns="http://www.w3.org/2000/svg">
			{/* Draw simple flow diagram */}
			<circle cx="20" cy="24" r="8" fill="rgba(139, 92, 246, 0.6)" stroke="rgba(139, 92, 246, 0.8)" strokeWidth="1.5" />
			<line x1="28" y1="24" x2="52" y2="24" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="2" />
			<circle cx="60" cy="24" r="8" fill="rgba(59, 130, 246, 0.6)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="1.5" />
			<line x1="68" y1="24" x2="92" y2="24" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="2" />
			<circle cx="100" cy="24" r="8" fill="rgba(16, 185, 129, 0.6)" stroke="rgba(16, 185, 129, 0.8)" strokeWidth="1.5" />
			<line x1="108" y1="24" x2="132" y2="24" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="2" />
			<circle cx="140" cy="24" r="8" fill="rgba(16, 185, 129, 0.6)" stroke="rgba(16, 185, 129, 0.8)" strokeWidth="1.5" />
			
			<text x="20" y="40" textAnchor="middle" fontSize="8" fill="rgba(148, 163, 184, 0.7)">C</text>
			<text x="60" y="40" textAnchor="middle" fontSize="8" fill="rgba(148, 163, 184, 0.7)">LB</text>
			<text x="100" y="40" textAnchor="middle" fontSize="8" fill="rgba(148, 163, 184, 0.7)">S</text>
			<text x="140" y="40" textAnchor="middle" fontSize="8" fill="rgba(148, 163, 184, 0.7)">DB</text>
		</svg>
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
			className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]/50 p-5 transition-all duration-300 hover:-translate-y-2 hover:bg-[var(--surface)]/80"
			style={{
				boxShadow: isHovered 
					? "0 0 20px rgba(139, 92, 246, 0.25), 0 15px 40px rgba(0, 0, 0, 0.2)" 
					: "0 8px 20px rgba(0, 0, 0, 0.1)"
			}}
		>
			{/* Difficulty badge */}
			<div className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide transition-all duration-300 ${
				scenario.difficulty === "Beginner"
					? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
					: scenario.difficulty === "Intermediate"
						? "border-amber-500/50 bg-amber-500/10 text-amber-300"
						: "border-red-500/50 bg-red-500/10 text-red-300"
			}`}>
				{scenario.difficulty}
			</div>

			{/* Number badge */}
			<div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-violet-500/25 to-blue-500/20 text-sm font-semibold text-violet-300">
				{String(index + 1).padStart(2, "0")}
			</div>

			{/* Title */}
			<h2 className="text-lg font-semibold tracking-tight">{scenario.title}</h2>
			
			{/* Description */}
			<p className="mt-2.5 text-sm text-[color:var(--foreground)]/70 line-clamp-2">{scenario.description}</p>

			{/* Flow diagram */}
			<motion.div
				initial={{ opacity: 0, height: 0 }}
				animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? "auto" : 0 }}
				transition={{ duration: 0.2 }}
				className="mt-3 overflow-hidden"
			>
				<div className="rounded-lg border border-[var(--border)]/50 bg-[var(--surface-muted)]/30 p-2.5">
					<p className="text-[10px] uppercase tracking-widest text-[color:var(--foreground)]/50 mb-2">System Flow</p>
					<p className="text-xs text-[color:var(--foreground)]/70 font-mono">{scenario.flowDiagram}</p>
				</div>
			</motion.div>

			{/* System behavior (on hover) */}
			<motion.div
				initial={{ opacity: 0, height: 0 }}
				animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? "auto" : 0 }}
				transition={{ duration: 0.2, delay: 0.05 }}
				className="mt-3 overflow-hidden"
			>
				<div className="rounded-lg border border-[var(--border)]/50 bg-[var(--surface-muted)]/30 p-2.5">
					<p className="text-[10px] uppercase tracking-widest text-[color:var(--foreground)]/50 mb-1.5">Behavior</p>
					<p className="text-xs text-[color:var(--foreground)]/70">{scenario.systemBehavior}</p>
				</div>
			</motion.div>

			{/* Tags */}
			<div className="mt-4 flex flex-wrap gap-1.5">
				{scenario.focus.map((tag) => (
					<span
						key={tag}
						className="rounded-full border border-[var(--border)]/50 bg-[var(--surface-muted)]/50 px-2 py-0.5 text-[10px] text-[color:var(--foreground)]/60 transition-all duration-200"
						style={{
							borderColor: isHovered ? "rgba(139, 92, 246, 0.4)" : undefined,
							backgroundColor: isHovered ? "rgba(139, 92, 246, 0.08)" : undefined,
						}}
					>
						{tag}
					</span>
				))}
			</div>

			{/* Footer */}
			<div className="mt-5 flex items-center justify-between border-t border-[var(--border)]/50 pt-3.5 text-[11px] text-[color:var(--foreground)]/55">
				<span>{scenario.expectedFrames} frames</span>
				<span>Updated {scenario.updatedAt}</span>
			</div>

			{/* Button */}
			<Link
				href={scenario.href}
				className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500/80 to-violet-600/80 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:from-violet-500 hover:to-violet-600"
				style={{
					boxShadow: isHovered 
						? "0 0 15px rgba(139, 92, 246, 0.5)" 
						: "0 2px 8px rgba(139, 92, 246, 0.2)"
				}}
			>
				<span>Run Simulation</span>
				<motion.span
					animate={{ x: isHovered ? 4 : 0 }}
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
	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window === "undefined") {
			return "dark";
		}

		const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
		if (saved === "light" || saved === "dark") {
			return saved;
		}

		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	});

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
			<div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-45" />
			<div className="pointer-events-none absolute -left-20 top-[-100px] -z-10 h-[300px] w-[300px] rounded-full bg-cyan-500/20 blur-[90px]" />
			<div className="pointer-events-none absolute -right-16 top-[180px] -z-10 h-[340px] w-[340px] rounded-full bg-blue-500/15 blur-[100px]" />

			<SiteHeader
				theme={theme}
				showHomeLink
				badgeText="Simulation Scenario Library"
				onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
			/>

			{/* Hero Section */}
			<section className="mx-auto w-full max-w-6xl px-6 pb-8 pt-10">
				<Reveal>
					<div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/85 p-6 shadow-[0_30px_80px_-48px_var(--glow)] md:p-8">
						<p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">
							Scenario Launcher
						</p>
						<h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
							Select a Scenario
						</h1>
						<p className="mt-3 max-w-3xl text-sm text-[color:var(--foreground)]/70 md:text-base">
							Each scenario demonstrates a core distributed system pattern. Hover to preview the system flow, then run the simulation to watch it in action.
						</p>

						<div className="mt-7 grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/80 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)]/55">Scenarios</p>
								<p className="mt-2 text-3xl font-semibold">{stats.total}</p>
							</div>
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/80 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)]/55">Beginner</p>
								<p className="mt-2 text-3xl font-semibold">{stats.beginner}</p>
							</div>
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/80 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)]/55">Avg Frames</p>
								<p className="mt-2 text-3xl font-semibold">{stats.avgFrames}</p>
							</div>
						</div>
					</div>
				</Reveal>
			</section>

			{/* Scenario Cards Grid */}
			<section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-14 md:grid-cols-2 xl:grid-cols-3">
				{SCENARIOS.map((scenario, index) => (
					<Reveal key={scenario.id} delay={index * 0.08}>
						<ScenarioCardState scenario={scenario} index={index} />
					</Reveal>
				))}
			</section>

			{/* Footer Info */}
			<section className="mx-auto w-full max-w-6xl px-6 pb-6">
				<div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/65 p-5 text-sm text-[color:var(--foreground)]/70 md:flex md:items-center md:justify-between">
					<p>Add new scenarios in src/scenarios/all.ts</p>
					<Link
						href="/scenarios/simple-cache"
						className="mt-3 inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 font-medium md:mt-0 hover:bg-[var(--surface-muted)]/80"
					>
						Launch Cache Demo
					</Link>
				</div>
			</section>

			<SiteFooter />
		</main>
	);
}
