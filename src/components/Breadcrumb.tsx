import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbMap: { [key: string]: string } = {
    admin: 'Admin',
    users: 'Usuários',
    requests: 'Solicitações',
    messages: 'Mensagens',
  };

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link to="/admin" className="text-gray-400 hover:text-white">
            Home
          </Link>
        </li>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;

          return (
            <li key={name} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-500 mx-1" />
              {isLast ? (
                <span className="text-gray-200">{breadcrumbMap[name] || name}</span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-gray-400 hover:text-white"
                >
                  {breadcrumbMap[name] || name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
