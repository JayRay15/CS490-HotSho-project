import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";

export default function Breadcrumb() {

    const location = useLocation();
    const [jobLabel, setJobLabel] = React.useState(null);

    const breadcrumbs = useMemo(() => {
        const paths = location.pathname.split('/').filter(Boolean);
        const crumbs = [];

        // Always start with Home
        crumbs.push({ label: 'Home', path: '/' });

        // Check if we're on a detail page (last segment is ObjectId)
        const isDetailPage = paths.length > 0 && /^[a-f\d]{24}$/i.test(paths[paths.length - 1]);
        const isOnTechnicalPrepDetail = isDetailPage && paths.includes('technical-prep') && 
                                        (paths.includes('coding') || paths.includes('system-design') || paths.includes('case-study'));

        // Build breadcrumb trail
        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            let label = path
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            // Custom label for resumes page
            if (path === 'resumes') {
                label = 'Resumes & Cover Letters';
            }

            // If last segment looks like a MongoDB ObjectId, use jobLabel if available
            if (index === paths.length - 1 && /^[a-f\d]{24}$/i.test(path) && jobLabel) {
                label = jobLabel;
            }

            // Skip the intermediate path (coding/system-design/case-study) if on detail page
            if (isOnTechnicalPrepDetail && index === paths.length - 2 && 
                ['coding', 'system-design', 'case-study'].includes(path)) {
                return; // Skip this breadcrumb
            }

            crumbs.push({
                label,
                path: currentPath,
                isLast: index === paths.length - 1
            });
        });
        return crumbs;
    }, [location.pathname, jobLabel]);

    // Fetch job/challenge details if last segment is ObjectId
    React.useEffect(() => {
        const paths = location.pathname.split('/').filter(Boolean);
        const last = paths[paths.length - 1];
        if (/^[a-f\d]{24}$/i.test(last)) {
            if (paths.includes('goals')) {
                // Fetch goal details
                import('../api/goals').then(api => {
                    api.getGoalById(last).then(response => {
                        if (response && response.goal && response.goal.title) {
                            setJobLabel(response.goal.title);
                        } else {
                            setJobLabel(null);
                        }
                    }).catch(() => setJobLabel(null));
                });
            } else if (paths.includes('technical-prep')) {
                if (paths.includes('coding')) {
                    import('../api/technicalPrep').then(api => {
                        api.technicalPrepAPI.getCodingChallenge(last).then(challenge => {
                            if (challenge && challenge.title) {
                                setJobLabel(challenge.title);
                            } else {
                                setJobLabel(null);
                            }
                        }).catch(() => setJobLabel(null));
                    });
                } else if (paths.includes('system-design')) {
                    import('../api/technicalPrep').then(api => {
                        api.technicalPrepAPI.getSystemDesignQuestion(last).then(question => {
                            if (question && question.title) {
                                setJobLabel(question.title);
                            } else {
                                setJobLabel(null);
                            }
                        }).catch(() => setJobLabel(null));
                    });
                } else if (paths.includes('case-study')) {
                    import('../api/technicalPrep').then(api => {
                        api.technicalPrepAPI.getCaseStudy(last).then(caseStudy => {
                            if (caseStudy && caseStudy.title) {
                                setJobLabel(caseStudy.title);
                            } else {
                                setJobLabel(null);
                            }
                        }).catch(() => setJobLabel(null));
                    });
                }
            } else {
                // Default: Try to fetch job details
                import('../api/salary').then(api => {
                    api.getSalaryResearch(last).then(res => {
                        const job = res.data?.data?.job;
                        if (job && job.title && job.company) {
                            setJobLabel(`${job.title} @ ${job.company}`);
                        } else if (job && job.title) {
                            setJobLabel(job.title);
                        }
                    }).catch(() => {
                        setJobLabel(null);
                    });
                });
            }
        } else {
            setJobLabel(null);
        }
    }, [location.pathname]);


    // Don't show breadcrumbs on root or single-level paths
    if (breadcrumbs.length <= 1) {
        return null;
    }

    return (
        <nav 
            aria-label="Breadcrumb" 
            className="bg-secondary-50 border-b border-secondary-300 px-4 sm:px-6 lg:px-8"
        >
            <ol className="flex items-center space-x-2 py-3 text-sm">
                {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.path} className="flex items-center">
                        {index > 0 && (
                            <svg 
                                className="w-4 h-4 text-secondary-500 mx-2" 
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
                                className="font-medium text-text-primary" 
                                aria-current="page"
                            >
                                {crumb.label}
                            </span>
                        ) : (
                            <Link 
                                to={crumb.path} 
                                className="text-primary hover:text-primary-600 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 rounded px-1"
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
