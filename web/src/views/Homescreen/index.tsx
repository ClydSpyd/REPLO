import { Suspense } from 'react';
import TodayBlock from './components/TodayBlock';
import VolumeAnalysisBlock from './components/VolumeAnalysisBlock';
import MuscleAnalysisBlock from './components/MusclAnalysisBlock';
import RecordsBlock from './components/RecordsBlock';
import { formatDate } from '../../utility/dates';
import ReploLoader from '../../components/ui/loaders/ReploLoader';
import ErrorBoundaryModal from '../../components/utility/ErrorBoundaryModal.tsx';

export default function Homescreen() {
  return (
    <ErrorBoundaryModal pageType="Homescreen">
      <div className="h-full grow p-4 flex flex-col gap-3 w-full page-wrapper">
        <div className="flex flex-col gap-0 my-6">
          <p className="anotation">{formatDate(new Date())}</p>
          <h2 className="heading-two">welcome back, baloo</h2>
        </div>
        <Suspense
          fallback={
            <div
              className="flex flex-col gap-1 justify-center items-center h-[185px] rounded-lg border border-dashed border-white/30 p-4 text-sm text-white/70"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--dark-one) 60%, transparent)',
              }}
            >
              <ReploLoader size={50} speed={'fast'} />
              <p className="text-xs! anotation text-[var(--contrast-two)]!">
                Loading today's workout...
              </p>
            </div>
          }
        >
          <TodayBlock />
        </Suspense>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VolumeAnalysisBlock />
          </div>
          <div className="flex flex-col gap-4">
            <MuscleAnalysisBlock />
            <RecordsBlock />
          </div>
        </div>
      </div>
    </ErrorBoundaryModal>
  );
}
