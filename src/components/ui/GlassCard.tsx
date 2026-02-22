type Props = {
    children: React.ReactNode;
    className?: string;
};

export default function GlassCard({ children, className = "" }: Props) {
    return (
        <div
            className={`
        relative rounded-2xl p-6
        bg-white/90 dark:bg-cardDark/80
        backdrop-blur-md
        border border-primary/20 dark:border-primary/30
        shadow-xl dark:shadow-[0_30px_90px_rgba(0,0,0,0.7)]

        before:absolute before:inset-0 before:rounded-2xl
        before:bg-gradient-to-br before:from-primary/10 before:to-transparent
        before:pointer-events-none

        ${className}
      `}
        >
            {children}
        </div>
    );
}
