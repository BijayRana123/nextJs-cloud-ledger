export const metadata = {
  title: 'Cloud Ledger | Accounting',
  description: 'Double-entry accounting system with subledgers',
};

export default function AccountingLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Cloud Ledger</h1>
          <nav className="mt-2">
            <ul className="flex space-x-4">
              <li>
                <a href="/" className="hover:underline">Home</a>
              </li>
              <li>
                <a href="/accounting" className="hover:underline">Dashboard</a>
              </li>
              <li>
                <a href="/accounting/journals" className="hover:underline">Journals</a>
              </li>
              <li>
                <a href="/accounting/chart-of-accounts" className="hover:underline">Chart of Accounts</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-gray-100 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Cloud Ledger. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 
