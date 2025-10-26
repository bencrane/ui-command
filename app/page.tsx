import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-2xl font-bold text-red-600 mb-4">apple</div>
        <h1 className="text-3xl font-bold mb-4">UI Command Center</h1>
        <p className="text-gray-500 mb-8">Campaign Staging Dashboard</p>

        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-600 mb-6">
            This is an internal staging dashboard for managing outbound campaign contacts.
            Select contacts, apply campaign-specific transformations, and stage them for delivery.
          </p>

          <Link href="/contacts">
            <Button>View Contacts</Button>
          </Link>
        </div>

        <div className="mt-8 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Run the database schema: <code className="bg-gray-100 px-1 py-0.5 rounded">database/schema.sql</code></li>
            <li>Seed sample data: <code className="bg-gray-100 px-1 py-0.5 rounded">database/seed.sql</code></li>
            <li>Configure environment variables (see .env.example)</li>
            <li>Start the dev server: <code className="bg-gray-100 px-1 py-0.5 rounded">npm run dev</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
