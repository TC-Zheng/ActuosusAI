import Link from 'next/link';

const menuItems = [
  { label: `Models`, href: { pathname: '/models' } },
  { label: 'Text Generation', href: { pathname: '/models/text_generation' } },
];
export default function RootHeader() {
  return (
    <header className="flex bg-background-900 h-16">
      <h1 className="flex text-primary-300 items-center p-4">ActuosusAI</h1>
      <nav className="flex justify-center space-x-4">
        <ul className="flex flex-row">
          {menuItems.map(({ label, href }) => (
            <li key={label} className="flex items-center p-1 flex-1">
              <Link
                href={href}
                className="text-primary-400 hover:bg-background-700 transition duration-300 px-3 py-1 flex-1 rounded-md"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
