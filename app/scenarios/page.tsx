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

			<section className="mx-auto w-full max-w-6xl px-6 pb-8 pt-10">
				<Reveal>
					<div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/85 p-6 shadow-[0_30px_80px_-48px_var(--glow)] md:p-8">
						<p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">
							Scenario Catalog
						</p>
						<h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
							Choose a Simulation and Explore Request Flow End-to-End
						</h1>
						<p className="mt-4 max-w-3xl text-sm text-[color:var(--foreground)]/70 md:text-base">
							Start with ready-to-run hardcoded scenarios. As you add more system models,
							this page can keep growing as your simulation library.
						</p>

						<div className="mt-7 grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/80 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)]/55">Total Scenarios</p>
								<p className="mt-2 text-3xl font-semibold">{stats.total}</p>
							</div>
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/80 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)]/55">Beginner Friendly</p>
								<p className="mt-2 text-3xl font-semibold">{stats.beginner}</p>
							</div>
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/80 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)]/55">Average Frames</p>
								<p className="mt-2 text-3xl font-semibold">{stats.avgFrames}</p>
							</div>
						</div>
					</div>
				</Reveal>
			</section>

			<section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-14 md:grid-cols-2 xl:grid-cols-3">
				{SCENARIOS.map((scenario, index) => (
					<Reveal key={scenario.id} delay={index * 0.08}>
						<article className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]/85 p-5 shadow-[0_26px_70px_-45px_var(--glow)] transition duration-300 hover:-translate-y-1">
							<div className="absolute right-3 top-3 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-medium tracking-wide text-[color:var(--foreground)]/75">
								{scenario.difficulty}
							</div>

							<div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-cyan-500/25 to-blue-500/20 text-sm font-semibold">
								{String(index + 1).padStart(2, "0")}
							</div>

							<h2 className="text-xl font-semibold tracking-tight">{scenario.title}</h2>
							<p className="mt-3 text-sm text-[color:var(--foreground)]/70">{scenario.description}</p>

							<div className="mt-4 flex flex-wrap gap-2">
								{scenario.focus.map((tag) => (
									<span
										key={tag}
										className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)]/70 px-2.5 py-1 text-xs text-[color:var(--foreground)]/70"
									>
										{tag}
									</span>
								))}
							</div>

							<div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[color:var(--foreground)]/65">
								<span>{scenario.expectedFrames} frames</span>
								<span>Updated {scenario.updatedAt}</span>
							</div>

							<Link
								href={scenario.href}
								className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_45px_-24px_var(--glow)] transition group-hover:brightness-105"
							>
								Open Scenario
							</Link>
						</article>
					</Reveal>
				))}
			</section>

			<section className="mx-auto w-full max-w-6xl px-6 pb-6">
				<div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/65 p-5 text-sm text-[color:var(--foreground)]/70 md:flex md:items-center md:justify-between">
					<p>Add new hardcoded scenario IDs in src/scenarios/all.ts and they can be listed here.</p>
					<Link
						href="/scenarios/simple-cache"
						className="mt-3 inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 font-medium md:mt-0"
					>
						Launch Cache Demo
					</Link>
				</div>
			</section>

			<SiteFooter />
		</main>
	);
}
