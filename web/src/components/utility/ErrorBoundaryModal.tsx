import { ErrorBoundary } from 'react-error-boundary';
import { IoIosWarning } from 'react-icons/io';

export default function ErrorBoundaryModal({
  pageType,
  children,
}: {
  pageType: string;
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div className="m-auto rounded-lg border border-dashed border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-10 px-20 flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-fit border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] rounded-xl p-3 mb-2">
            <IoIosWarning className="text-[var(--accent-primary)] text-3xl" />
          </div>
          <p className="anotation text-[var(--accent-primary)]! text-base! uppercase tracking-wide">
            Error Loading {pageType}
          </p>
          <p className="body-text text-white/80 text-sm! max-w-[560px] break-words">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
