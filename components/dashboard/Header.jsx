export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b-4 border-indigo-600">
      <div className="flex items-center">
        {/* Header content will go here */}
        <h2 className="text-xl font-semibold text-gray-700">Dashboard</h2>
      </div>
      <div className="flex items-center">
        {/* User/profile info will go here */}
        <span className="mr-2 text-gray-600">User Name</span>
        {/* User dropdown/avatar will go here */}
      </div>
    </header>
  );
}
