import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#0a0a0a]">
      <div className="max-w-sm w-full space-y-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            <path d="M8 14L12 10L16 14L12 18L8 14Z" fill="white" fillOpacity="0.6"/>
            <path d="M14 10L20 14L14 18V10Z" fill="white"/>
          </svg>
          <span className="text-white font-semibold text-lg tracking-tight">ReadyOn</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
            Time-Off Management
          </h1>
          <p className="text-[#666] text-sm leading-relaxed">
            Real-time balances, optimistic updates, and graceful HCM reconciliation.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/employee"
            className="flex items-center justify-between w-full rounded-xl bg-white text-black px-5 py-4 font-medium text-sm hover:bg-[#f0f0f0] transition-colors group"
          >
            <div>
              <div className="font-semibold">Employee View</div>
              <div className="text-[#666] text-xs mt-0.5 font-normal">Alice Johnson · submit requests</div>
            </div>
            <svg className="w-4 h-4 text-[#999] group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/manager"
            className="flex items-center justify-between w-full rounded-xl bg-[#141414] border border-[#2a2a2a] text-white px-5 py-4 font-medium text-sm hover:bg-[#1c1c1c] hover:border-[#3a3a3a] transition-colors group"
          >
            <div>
              <div className="font-semibold">Manager View</div>
              <div className="text-[#666] text-xs mt-0.5 font-normal">Bob Smith · approve requests</div>
            </div>
            <svg className="w-4 h-4 text-[#444] group-hover:text-[#888] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <p className="text-[#3a3a3a] text-xs">
          Demo · Mock HCM API · v0.1
        </p>
      </div>
    </main>
  );
}
