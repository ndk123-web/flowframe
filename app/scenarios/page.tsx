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

const DIFFICULTY_META = {
	Beginner: {
		color: "border-emerald-500/40 bg-emerald-500/8 text-emerald-400",
		dot: "bg-emerald-400",
	},
	Intermediate: {
		color: "border-amber-500/40 bg-amber-500/8 text-amber-400",
		dot: "bg-amber-400",
	},
	Advanced: {
		color: "border-red-500/40 bg-red-500/8 text-red-400",
		dot: "bg-red-400",
	},
};

function ScenarioCard({ scenario, index }: { scenario: ScenarioCard; index: number }) {
	const [hovered, setHovered] = useState(false);
	const meta = DIFFICULTY_META[scenario.difficulty];

	return (
		<motion.article
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.07 }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-violet-500/30 hover:-translate-y-1"
			style={{ boxShadow: hovered ? "0 20px 40px -15px rgba(139,92,246,0.18)" : "0 4px 20px -10px rgba(0,0,0,0.12)" }}
		>
			{/* Top accent bar */}
			<div className={`h-0.5 w-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

			<div className="p-6 flex flex-col flex-1">
				{/* Header row */}
				<div className="flex items-start justify-between mb-4">
					{/* Index number */}
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-violet-500/10 to-blue-500/10 text-xs font-bold text-violet-400">
						{String(index + 1).padStart(2, "0")}
					</div>
					{/* Difficulty badge */}
					<span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${meta.color}`}>
						{scenario.difficulty}
					</span>
				</div>

				{/* Title + description */}
				<div className="flex-1 space-y-2 mb-4">
					<h2 className="text-lg font-bold leading-snug text-[color:var(--foreground)] group-hover:text-violet-400 transition-colors duration-200">
						{scenario.title}
					</h2>
					<p className="text-sm text-[color:var(--foreground)]/60 leading-relaxed">
						{scenario.description}
					</p>
				</div>

				{/* System flow — visible on hover */}
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: hovered ? "auto" : 0, opacity: hovered ? 1 : 0 }}
					transition={{ duration: 0.22, ease: "easeInOut" }}
					className="overflow-hidden mb-3"
				>
					<div className="rounded-xl border border-[var(--border)]/60 bg-[var(--surface-muted)]/40 px-3 py-2.5 space-y-1.5">
						<p className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/40">System Flow</p>
						<p className="text-[11px] font-mono text-[color:var(--foreground)]/80 break-all">{scenario.flowDiagram}</p>
					</div>
				</motion.div>

				{/* Focus tags */}
				<div className="flex flex-wrap gap-1.5 mb-4">
					{scenario.focus.map((tag) => (
						<span
							key={tag}
							className="rounded-full border border-[var(--border)]/50 bg-[var(--surface-muted)]/40 px-2.5 py-0.5 text-[10px] font-medium text-[color:var(--foreground)]/55 transition-colors duration-200"
							style={{
								borderColor: hovered ? "rgba(139,92,246,0.3)" : undefined,
								color: hovered ? "rgba(167,139,250,0.85)" : undefined,
							}}
						>
							{tag}
						</span>
					))}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-[var(--border)]/40 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--foreground)]/35 mb-4">
					<span>{scenario.expectedFrames} frames</span>
					<span>Updated {scenario.updatedAt}</span>
				</div>

				{/* CTA */}
				<Link
					href={scenario.href}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500/80 to-violet-600/80 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:from-blue-500 hover:to-violet-600 hover:shadow-[0_8px_20px_-8px_rgba(139,92,246,0.5)] active:scale-[0.98]"
				>
					<span>Run Simulation</span>
					<motion.span animate={{ x: hovered ? 3 : 0 }} transition={{ duration: 0.15 }}>→</motion.span>
				</Link>
			</div>
		</motion.article>
	);
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

	const stats = useMemo(() => ({
		total: SCENARIOS.length,
		beginner: SCENARIOS.filter((s) => s.difficulty === "Beginner").length,
		avgFrames: SCENARIOS.length > 0
			? Math.round(SCENARIOS.reduce((sum, s) => sum + s.expectedFrames, 0) / SCENARIOS.length)
			: 0,
	}), []);

	return (
		<main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[color:var(--foreground)]">
			{/* Background */}
			<div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-30" />
			<div className="pointer-events-none absolute -left-24 top-[-80px] -z-10 h-[320px] w-[320px] rounded-full bg-cyan-500/12 blur-[90px]" />
			<div className="pointer-events-none absolute -right-16 top-[220px] -z-10 h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-[100px]" />

			<SiteHeader
				theme={theme}
				showHomeLink
				badgeText="Simulation Library"
				onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
			/>

			{/* ── Hero ─────────────────────────────────────────────────── */}
			<section className="mx-auto w-full max-w-6xl px-5 sm:px-8 pt-12 pb-8">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
					className="rounded-3xl border border-[var(--border)]/70 bg-[var(--surface)]/50 backdrop-blur-xl p-7 sm:p-10 shadow-[0_24px_72px_-40px_var(--glow)] relative overflow-hidden"
				>
					{/* Decorative glow */}
					<div className="absolute right-0 top-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-violet-500/6 blur-[60px] pointer-events-none" />

					<p className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-blue-500/10 px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-[0.18em] text-[color:var(--foreground)]/75">
						<span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-blue-400" />
						Scenario Library
					</p>

					<h1 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-[color:var(--foreground)] via-[color:var(--foreground)]/90 to-violet-400/85 bg-clip-text text-transparent max-w-2xl">
						Pre-built System Simulations
					</h1>

					<p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-[color:var(--foreground)]/65">
						Explore pre-configured distributed system scenarios. Hover any card to preview the system flow, then launch it to watch network packets travel across components in real time.
					</p>

					{/* Stats */}
					<div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-sm">
						{[
							{ label: "Total Scenarios", value: stats.total, accent: "text-violet-400" },
							{ label: "Beginner Tier", value: stats.beginner, accent: "text-emerald-400" },
							{ label: "Avg Frames", value: stats.avgFrames, accent: "text-blue-400" },
						].map((s) => (
							<div key={s.label} className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-muted)]/40 p-4 sm:p-5 hover:border-violet-500/20 transition-colors duration-200">
								<p className="text-[10px] uppercase font-bold tracking-wider text-[color:var(--foreground)]/45">{s.label}</p>
								<p className={`mt-2 text-3xl font-bold ${s.accent}`}>{s.value}</p>
							</div>
						))}
					</div>
				</motion.div>
			</section>

			{/* ── Scenario Cards Grid ──────────────────────────────────── */}
			<section className="mx-auto w-full max-w-6xl px-5 sm:px-8 pb-12">
				<p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--foreground)]/35 mb-5">
					{SCENARIOS.length} Scenarios Available
				</p>
				<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{SCENARIOS.map((scenario, index) => (
						<ScenarioCard key={scenario.id} scenario={scenario} index={index} />
					))}
				</div>
			</section>

			{/* ── Sandbox CTA ────────────────────────────────────────── */}
			<section className="mx-auto w-full max-w-6xl px-5 sm:px-8 pb-14">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30 backdrop-blur-md p-6 sm:flex sm:items-center sm:justify-between gap-6 shadow-sm"
				>
					<div>
						<p className="font-semibold text-[color:var(--foreground)]">Want to design something custom?</p>
						<p className="text-sm text-[color:var(--foreground)]/50 mt-0.5">
							Use the Interactive Sandbox to draw any architecture from scratch and run your own simulation.
						</p>
					</div>
					<Link
						href="/workspace"
						target="_blank"
						rel="noopener noreferrer"
						className="mt-4 sm:mt-0 shrink-0 inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 px-5 py-2.5 text-sm font-bold text-violet-400 hover:text-violet-300 transition-all duration-200 whitespace-nowrap"
					>
						Launch Custom Sandbox 🛠️
					</Link>
				</motion.div>
			</section>

			<SiteFooter />
		</main>
	);
}
