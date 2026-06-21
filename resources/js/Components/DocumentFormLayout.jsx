export default function DocumentFormLayout({
    title,
    subtitle,
    aside,
    header,
    notes,
    details,
    totals,
    workflow,
    actions,
    onSubmit,
}) {
    const content = (
        <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-950">{title}</h3>
                        {subtitle && <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>}
                    </div>
                    {aside}
                </div>
            </div>

            <DocumentSection title={header?.title}>{header?.content}</DocumentSection>
            <DocumentSection title={details?.title} actions={details?.actions}>{details?.content}</DocumentSection>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
                <DocumentSection title={notes?.title} className="border-b border-slate-200 lg:border-b-0 lg:border-e">
                    {notes?.content}
                </DocumentSection>
                <DocumentSection title={totals?.title}>{totals?.content}</DocumentSection>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div>
                        {workflow?.title && <DocumentSectionTitle>{workflow.title}</DocumentSectionTitle>}
                        {workflow?.content}
                    </div>
                    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                </div>
            </div>
        </section>
    );

    if (!onSubmit) {
        return content;
    }

    return (
        <form onSubmit={onSubmit}>
            {content}
        </form>
    );
}

export function DocumentSectionTitle({ children }) {
    return <h4 className="text-sm font-black text-slate-900">{children}</h4>;
}

function DocumentSection({ title, actions, children, className = '' }) {
    return (
        <div className={`border-b border-slate-200 px-4 py-4 last:border-b-0 ${className}`}>
            {(title || actions) && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {title && <DocumentSectionTitle>{title}</DocumentSectionTitle>}
                    {actions}
                </div>
            )}
            {children && <div className={title || actions ? 'mt-3' : ''}>{children}</div>}
        </div>
    );
}
