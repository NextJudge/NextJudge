interface WelcomeSectionProps {
	name: string;
}

export function WelcomeSection({ name }: WelcomeSectionProps) {
	const displayName = name.trim() || "there";

	return (
		<section className="mb-8">
			<h1 className="text-3xl font-bold tracking-tight">
				Welcome back, {displayName}
			</h1>
			<p className="mt-2 text-muted-foreground">
				Track your progress, join contests, and keep solving.
			</p>
		</section>
	);
}
