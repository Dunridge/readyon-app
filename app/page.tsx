import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ReadyOn</h1>
          <p className="text-gray-500 mt-2">Time-Off Management System</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/employee"
            className="block w-full rounded-xl bg-indigo-600 text-white py-3 px-6 font-semibold hover:bg-indigo-700 transition-colors"
          >
            Employee View
            <span className="block text-xs font-normal text-indigo-200 mt-0.5">
              Alice Johnson (emp-001) — submit requests, view balances
            </span>
          </Link>
          <Link
            href="/manager"
            className="block w-full rounded-xl bg-slate-700 text-white py-3 px-6 font-semibold hover:bg-slate-800 transition-colors"
          >
            Manager View
            <span className="block text-xs font-normal text-slate-300 mt-0.5">
              Bob Smith (emp-002) — review and approve/deny requests
            </span>
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          Demo app · Mock HCM API · Optimistic updates with reconciliation
        </p>
      </div>
    </main>
  );
}
