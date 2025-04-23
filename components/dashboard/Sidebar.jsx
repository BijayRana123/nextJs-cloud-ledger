export default function Sidebar() {
  return (
    <div className="flex flex-col w-64 bg-gray-800 text-white">
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <span className="text-xl font-semibold uppercase">Dashboard</span>
      </div>
      <nav className="flex-1 px-2 py-4 bg-gray-800">
        {/* Sidebar links will go here */}
        <a href="#" className="block px-2 py-1 text-gray-300 hover:bg-gray-700 hover:text-white rounded">Link 1</a>
        <a href="#" className="block px-2 py-1 text-gray-300 hover:bg-gray-700 hover:text-white rounded">Link 2</a>
      </nav>
    </div>
  );
}
