import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { breadcrumbLabelMap } from '../../utils/breadcrumbMap';

/**
 * Minimalist Interactive Breadcrumb
 * - Transparent background (removed pill shape)
 * - "Home" as the root segment (replacing role injection)
 * - Hover highlight effects
 * - Bold current page styling
 */
export default function Breadcrumb() {
  const { pathname } = useLocation();

  const breadcrumbs = useMemo(() => {
    // Split path and filter out empty strings
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Ignore the 'dashboard' segment as a label but use it for logic
    const segments = pathSegments.filter(s => s !== 'dashboard');
    
    const result = [];

    // 1. Static "Home" Root (replacing the old icon/role injection)
    result.push({
      label: 'Home',
      path: '/dashboard',
      active: segments.length === 0
    });

    // 2. Build segments from URL
    let currentPath = '/dashboard';
    segments.forEach((slug, index) => {
      currentPath += `/${slug}`;
      const isLast = index === segments.length - 1;
      
      // UUID/ID Detection Logic
      // If the slug looks like a UUID or is a long numeric ID, alias it
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug) || 
                   (!isNaN(slug) && slug.length > 5);
      
      let label = breadcrumbLabelMap[slug] || slug;
      if (isId) {
        label = segments[index - 1] === 'employees' ? 'Employee Profile' : 'Details';
      }

      result.push({
        label: label,
        path: currentPath,
        active: isLast
      });
    });

    return result;
  }, [pathname]);

  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center py-2">
      <ol className="flex items-center gap-1.5 list-none p-0 m-0">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path + index} className="flex items-center">
            {/* Separator — hide before the first item */}
            {index > 0 && (
              <ChevronRight size={14} className="text-[#6b7280] mx-1 shrink-0" />
            )}
            
            {crumb.active ? (
              <span className="text-[#10b981] font-black text-sm tracking-tight px-1.5 py-1">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-card-hover)] px-2 py-1 rounded-md text-sm font-bold transition-all duration-200"
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
