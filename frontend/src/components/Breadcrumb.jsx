import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";

export default function Breadcrumb() {
    const location = useLocation();

    const breadcrumbs = useMemo(() => {
        const paths = location.pathname.split('/').filter(Boolean);
        const crumbs = [];

        // Always start with Home
        crumbs.push({ label: 'Home', path: '/' });

        // Build breadcrumb trail
        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            
            // Format the label (capitalize, remove hyphens)
            const label = path
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            crumbs.push({
                label,
                path: currentPath,
                isLast: index === paths.length - 1
            });
        });

        return crumbs;
    }, [location.pathname]);

    // Don't show breadcrumbs on root or single-level paths
    if (breadcrumbs.length <= 1) {
        return null;
    }

    return (
        <nav 
            aria-label="Breadcrumb" 
            className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 lg:px-8"
        >
            <ol className="flex items-center space-x-2 py-3 text-sm">
                {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.path} className="flex items-center">
                        {index > 0 && (
                            <svg 
                                className="w-4 h-4 text-gray-400 mx-2" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                            >
                                <path 
                                    fillRule="evenodd" 
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                                    clipRule="evenodd" 
                                />
                            </svg>
                        )}
                        {crumb.isLast ? (
                            <span 
                                className="font-medium text-gray-900" 
                                aria-current="page"
                            >
                                {crumb.label}
                            </span>
                        ) : (
                            <Link 
                                to={crumb.path} 
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
