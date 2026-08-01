import { useState } from 'react';
import { CgChevronUp } from 'react-icons/cg';

export default function TimerModule() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<'total' | 'rest'>('total');

  return (
    <div className="flex flex-col w-full h-fit rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)]">
      <div className="w-full flex justify-center items-center h-[35px] border-b border-b-[var(--contrast-one)]">
        <div
          className={`w-1/2 h-full  flex justify-center items-center border-b-3  ${selected === 'total' && open ? 'text-[var(--accent-primary)] border-b-[var(--accent-primary)]' : 'text-white border-b-transparent'} cursor-pointer`}
          onClick={() => setSelected('total')}
        >
          <p className="text-xs">TOTAL TIME</p>
        </div>
        <div
          className={`w-1/2 h-full flex justify-center items-center border-b-3 ${selected === 'rest' && open ? 'text-[var(--accent-primary)] border-b-[var(--accent-primary)]' : 'text-white border-b-transparent'} cursor-pointer`}
          onClick={() => setSelected('rest')}
        >
          <p className="text-xs">REST TIME</p>
        </div>
      </div>
      <div
        className={`flex-grow w-full transition-all duration-200 ease-in-out overflow-hidden ${open ? 'h-[150px]' : 'h-0'}`}
      >
        <div className="flex items-center justify-center h-full pointer-events-none">
          <div className="relative w-30 h-30">
            {/* Outer ring for lapsed time */}
            <svg
              className="absolute inset-0 w-full h-full z-10"
              viewBox="0 0 192 192"
            >
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="var(--accent-secondary)"
                strokeWidth="12"
                strokeDasharray="552"
                strokeDashoffset="138"
              />
            </svg>
            {/* Circular border - transparent to show ring */}
            <div className="absolute inset-0 rounded-full border-8 border-[var(--contrast-one)] bg-transparent z-0" />
            {/* Time in the center */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <span className="text-3xl font-bold text-[var(--accent-secondary)]">
                12:34
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`h-[30px] w-full flex items-center justify-center ${open ? ' border-t border-t-[var(--contrast-one)]' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <CgChevronUp
          className={`text-xl text-[var(--accent-primary)] transition-transform duration-200 ${!open ? 'rotate-180' : 'rotate-0'}`}
        />
      </div>
    </div>
  );
}
