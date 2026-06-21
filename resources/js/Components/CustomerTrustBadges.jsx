const tierStyles = {
    bronze: {
        wrap: 'border-orange-200 bg-orange-50 text-orange-800 ring-orange-100',
        icon: 'bg-orange-100 text-orange-700',
        label: 'موثق برونزي',
    },
    silver: {
        wrap: 'border-slate-200 bg-slate-50 text-slate-700 ring-slate-100',
        icon: 'bg-slate-200 text-slate-700',
        label: 'موثق فضي',
    },
    gold: {
        wrap: 'border-amber-200 bg-amber-50 text-amber-800 ring-amber-100',
        icon: 'bg-amber-100 text-amber-700',
        label: 'موثق ذهبي',
    },
};

export function ApprovalBadge({ approved, archived = false, compact = false }) {
    if (archived) {
        return (
            <span className={badgeClass('border-slate-200 bg-slate-100 text-slate-700 ring-slate-100', compact)}>
                <ArchiveIcon />
                مؤرشف
            </span>
        );
    }

    if (!approved) {
        return (
            <span className={badgeClass('border-amber-200 bg-amber-50 text-amber-800 ring-amber-100', compact)}>
                <PendingIcon />
                قيد الاعتماد
            </span>
        );
    }

    return (
        <span className={badgeClass('border-sky-200 bg-sky-50 text-sky-800 ring-sky-100', compact)}>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
                <CheckIcon />
            </span>
            معتمد
        </span>
    );
}

export function VerificationBadge({ tier, showEmpty = false, compact = false }) {
    if (!tier || tier === 'none') {
        if (!showEmpty) return null;

        return (
            <span className={badgeClass('border-slate-200 bg-white text-slate-500 ring-slate-100', compact)}>
                <CrownIcon />
                غير موثق
            </span>
        );
    }

    const style = tierStyles[tier] ?? tierStyles.bronze;

    return (
        <span className={badgeClass(`${style.wrap}`, compact)}>
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${style.icon}`}>
                <CrownIcon />
            </span>
            {style.label}
        </span>
    );
}

export function StatusBadge({ status, label, compact = false }) {
    const tone = statusTone(status);

    return (
        <span className={badgeClass(tone.colors, compact)}>
            {tone.icon}
            {label ?? status}
        </span>
    );
}

export function CreditBadge({ label, value, compact = false }) {
    return (
        <span className={[
            'inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-100',
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
        ].join(' ')}>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                <CreditIcon />
            </span>
            <span className="grid">
                <span className="text-[11px] font-black text-emerald-700">{label}</span>
                <span className="font-black tabular-nums">{value}</span>
            </span>
        </span>
    );
}

function badgeClass(colors, compact) {
    return [
        'inline-flex items-center gap-1.5 rounded-full border font-black shadow-sm ring-1',
        compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
        colors,
    ].join(' ');
}

function statusTone(status) {
    if (['approved', 'active', 'completed', 'delivered', 'closed', 'received', 'invoiced', 'finished'].includes(status)) {
        return {
            colors: 'border-emerald-200 bg-emerald-50 text-emerald-800 ring-emerald-100',
            icon: <CheckMiniIcon />,
        };
    }

    if (['rejected', 'cancelled', 'archived', 'inactive', 'suspended'].includes(status)) {
        return {
            colors: 'border-rose-200 bg-rose-50 text-rose-800 ring-rose-100',
            icon: <StopIcon />,
        };
    }

    if (String(status ?? '').startsWith('pending') || ['draft', 'sales_officer_review', 'submitted', 'planning_review', 'not_ready', 'pending_accounting'].includes(status)) {
        return {
            colors: 'border-amber-200 bg-amber-50 text-amber-800 ring-amber-100',
            icon: <PendingIcon />,
        };
    }

    return {
        colors: 'border-slate-200 bg-slate-50 text-slate-700 ring-slate-100',
        icon: <InfoIcon />,
    };
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5" fill="none">
            <path d="M4.5 10.5 8.2 14 15.5 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CrownIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5" fill="none">
            <path d="m3.5 7 3.7 3.1L10 4.5l2.8 5.6L16.5 7l-1.3 7.5H4.8L3.5 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M5.2 16h9.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function PendingIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none">
            <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10 6.7v3.8l2.5 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CheckMiniIcon() {
    return (
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-current/10">
            <CheckIcon />
        </span>
    );
}

function StopIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none">
            <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m7.5 7.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function InfoIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none">
            <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10 9.5v4M10 6.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function CreditIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none">
            <path d="M4 6.5h12v8H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M4 8.5h12M7 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function ArchiveIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none">
            <path d="M4 6h12M5.2 6v9h9.6V6M7.5 10h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 4h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}
