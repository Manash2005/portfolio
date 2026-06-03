
function Navbar() {
  return (
    <nav className="bg-secondary/20 flex items-center justify-center font-mono rounded-b-3xl shadow-lg shadow-orange-700">
      <ul className="px-2">
        <li className="inline-block p-4 text-primary text-sm font-medium hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md">Home</li>
        <li className="inline-block p-4 text-primary text-sm font-medium hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md">About</li>
        <li className="inline-block p-4 text-primary text-sm font-medium hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md">Projects</li>
        <li className="inline-block p-4 text-primary text-sm font-medium hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md">Contact</li>
      </ul>
    </nav>
  )
}

export default Navbar