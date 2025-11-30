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

            // If ANY segment looks like an ObjectId and we have a jobLabel, use it (support nested routes like /jobs/:id/interview-prep)
            if (/^[a-f\d]{24}$/i.test(path) && jobLabel) {
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

    // Fetch job/challenge details if ANY segment is an ObjectId (supports nested routes like /jobs/:id/interview-prep)
    React.useEffect(() => {
        const paths = location.pathname.split('/').filter(Boolean);
        const objectId = paths.find(p => /^[a-f\d]{24}$/i.test(p));
        if (objectId) {
            // Productivity analysis label override
            if (paths.includes('productivity') && paths.includes('analysis')) {
                import('../api/productivity').then(api => {
                    api.productivityApi.getAnalysis(objectId).then(res => {
                        const analysis = res.analysis;
                        if (analysis) {
                            const startDate = new Date(analysis.period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const endDate = new Date(analysis.period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            setJobLabel(`${analysis.period.type} Analysis (${startDate} - ${endDate})`);
                        } else {
                            setJobLabel('Analysis');
                        }
                    }).catch(() => setJobLabel('Analysis'));
                });
                return;
            }
            // Mock interview session label override
            if (paths.includes('mock-interviews')) {
                import('../api/mockInterviews').then(api => {
                    api.getMockInterviewSession(objectId).then(res => {
                        const session = res.data?.data;
                        if (session?.roleTitle || session?.company) {
                            const base = session.roleTitle ? session.roleTitle : 'Mock Interview';
                            const comp = session.company ? ` @ ${session.company}` : '';
                            setJobLabel(`${base}${comp}`);
                        } else {
                            setJobLabel('Mock Interview');
                        }
                    }).catch(() => setJobLabel('Mock Interview'));
                });
                return; // prevent other fetch attempts
            }
            // Team name label override
            if (paths.includes('teams')) {
                import('../api/teams').then(api => {
                    api.getTeam(objectId).then(res => {
                        const team = res.data?.team;
                        if (team?.name) {
                            setJobLabel(team.name);
                        } else {
                            setJobLabel('Team');
                        }
                    }).catch(() => setJobLabel('Team'));
                });
                return; // prevent other fetch attempts
            }
            if (paths.includes('goals')) {
                // Fetch goal details
                import('../api/goals').then(api => {
                    api.getGoalById(objectId).then(response => {
                        if (response && response.goal && response.goal.title) {
                            setJobLabel(response.goal.title);
                        } else {
                            setJobLabel(null);
                        }
                    }).catch(() => setJobLabel(null));
                });
            } else if (paths.includes('interviews')) {
                // Fetch interview details and show company name
                import('../api/interviews').then(api => {
                    api.getInterview(objectId).then(response => {
                        const interview = response.data?.interview || response.data?.data?.interview;
                        if (interview && interview.company) {
                            setJobLabel(interview.company);
                        } else {
                            setJobLabel(null);
                        }
                    }).catch(() => setJobLabel(null));
                });
            } else if (paths.includes('technical-prep')) {
                if (paths.includes('coding')) {
                    import('../api/technicalPrep').then(api => {
                        api.technicalPrepAPI.getCodingChallenge(objectId).then(challenge => {
                            if (challenge && challenge.title) {
                                setJobLabel(challenge.title);
                            } else {
                                setJobLabel(null);
                            }
                        }).catch(() => setJobLabel(null));
                    });
                } else if (paths.includes('system-design')) {
                    import('../api/technicalPrep').then(api => {
                        api.technicalPrepAPI.getSystemDesignQuestion(objectId).then(question => {
                            if (question && question.title) {
                                setJobLabel(question.title);
                            } else {
                                setJobLabel(null);
                            }
                        }).catch(() => setJobLabel(null));
                    });
                } else if (paths.includes('case-study')) {
                    import('../api/technicalPrep').then(api => {
                        api.technicalPrepAPI.getCaseStudy(objectId).then(caseStudy => {
                            if (caseStudy && caseStudy.title) {
                                setJobLabel(caseStudy.title);
                            } else {
                                setJobLabel(null);
                            }
                        }).catch(() => setJobLabel(null));
                    });
                }
            } else {
                // Try direct job lookup first; fallback to salary research if unavailable
                import('../api/jobs').then(apiJobs => {
                    apiJobs.getJob(objectId).then(res => {
                        const job = res.data?.data?.job || res.data?.data?.job || res.data?.job; // handle various wrappers
                        const core = job || res.data?.data?.job;
                        if (core && core.title && core.company) {
                            setJobLabel(`${core.title} @ ${core.company}`);
                        } else if (core && core.title) {
                            setJobLabel(core.title);
                        } else {
                            // fallback to salary research method
                            import('../api/salary').then(api => {
                                api.getSalaryResearch(objectId).then(res2 => {
                                    const job2 = res2.data?.data?.job;
                                    if (job2 && job2.title && job2.company) {
                                        setJobLabel(`${job2.title} @ ${job2.company}`);
                                    } else if (job2 && job2.title) {
                                        setJobLabel(job2.title);
                                    } else {
                                        setJobLabel(null);
                                    }
                                }).catch(() => setJobLabel(null));
                            });
                        }
                    }).catch(() => {
                        // fallback if direct job lookup fails
                        import('../api/salary').then(api => {
                            api.getSalaryResearch(objectId).then(res2 => {
                                const job2 = res2.data?.data?.job;
                                if (job2 && job2.title && job2.company) {
                                    setJobLabel(`${job2.title} @ ${job2.company}`);
                                } else if (job2 && job2.title) {
                                    setJobLabel(job2.title);
                                } else {
                                    setJobLabel(null);
                                }
                            }).catch(() => setJobLabel(null));
                        });
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
