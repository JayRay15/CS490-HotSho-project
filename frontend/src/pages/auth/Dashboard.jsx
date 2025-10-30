import { useEffect, useState, useRef } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Container from "../../components/Container";
import { calculateProfileCompleteness } from "../../utils/profileCompleteness";
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Small local helper components used only on this dashboard page
function SummaryCard({ title, count, summary }) {
  // Render a short descriptive summary for the category; numbers are intentionally hidden
  return (
    <div className="bg-white p-4 flex flex-col items-center justify-center text-center min-h-[72px]">
      {summary ? (
        <div className="text-base font-semibold text-gray-800">{summary}</div>
      ) : (
        <div className="text-base font-semibold text-gray-800">{title}</div>
      )}
      <div className="text-xs text-gray-500 mt-2">{title}</div>
    </div>
  );
}

function QuickAddButton({ label, openParam }) {
  const navigate = useNavigate();
  const handle = (e) => {
    e.preventDefault();
    // navigate to profile and include query param to open the requested modal
    navigate(`/profile?open=${openParam}`);
  };
  return (
    <button onClick={handle} className="px-3 py-2 border rounded bg-white hover:bg-gray-50 text-sm">{label}</button>
  );
}

function ActivityTimeline({ items }) {
  if (!items || items.length === 0) return <div className="text-sm text-gray-600">No recent activity.</div>;
  const formatDate = (d) => {
    if (!d) return '';
    try {
      const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
      if (isNaN(date)) return '';
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  return (
    <ol className="list-decimal list-inside space-y-4 text-sm text-gray-700">
      {items.map(it => (
        <li key={it.id}>
          <div className="font-medium">{it.text}</div>
          <div className="text-xs text-gray-500 mt-1">{formatDate(it.date)}</div>
        </li>
      ))}
    </ol>
  );
}

function SkillsChart({ data }) {
  // Simple horizontal bar chart using divs
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.name} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600">{d.name}</div>
          <div className="flex-1 bg-gray-200 rounded h-3 overflow-hidden">
            <div style={{ width: `${(d.count / max) * 100}%`, backgroundColor: '#777C6D', height: '100%' }} />
          </div>
          <div className="w-8 text-right text-sm text-gray-700">{d.count}</div>
        </div>
      ))}
    </div>
  );
}

function CareerTimeline({ employment }) {
  if (!employment || employment.length === 0) return <div className="text-sm text-gray-600">No employment history.</div>;
  const sorted = [...employment].sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
  return (
    <div className="space-y-4">
      {sorted.map((e, idx) => (
        <div key={e._id || idx} className="flex items-start gap-3">
          <div className="w-40 text-sm text-gray-600">{new Date(e.startDate).toLocaleDateString()} {e.endDate ? `— ${new Date(e.endDate).toLocaleDateString()}` : '— Present'}</div>
          <div>
            <div className="font-medium">{e.jobTitle} @ {e.company}</div>
            <div className="text-sm text-gray-700">{e.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [accountStatus, setAccountStatus] = useState(null); // 'active', 'deleted', or null
  const [userData, setUserData] = useState(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Export ref for profile summary
  const exportRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!exportRef.current) {
      alert('Nothing to export');
      return;
    }
    setIsExporting(true);
    console.log('Starting PDF export...');
    try {
      // Temporarily hide sections we don't want in the canvas capture
      const hideIds = ['export-summary-cards', 'export-recent-activity', 'export-skills-distribution'];
      const elems = hideIds.map(id => document.getElementById(id)).filter(Boolean);
      const prevDisplays = elems.map(el => el.style.display || '');
      elems.forEach(el => el.style.display = 'none');
      const canvas = await html2canvas(exportRef.current, { scale: 2 });
      // restore visibility after successful capture
      elems.forEach((el, i) => el.style.display = prevDisplays[i] || '');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save('profile-summary.pdf');
      console.log('PDF saved');
    } catch (err) {
      // Attempt to restore visibility if an error occurred before we restored
      try {
        const hideIds = ['export-summary-cards', 'export-recent-activity', 'export-skills-distribution'];
        const elems = hideIds.map(id => document.getElementById(id)).filter(Boolean);
        elems.forEach(el => el.style.display = '');
      } catch (restoreErr) {
        // ignore
      }
      console.error('Failed to generate PDF via html2canvas', err);
      // Fallback: generate a text-based PDF from the available user data
      try {
        console.log('Attempting text-based PDF fallback');
        generateTextPDF();
      } catch (err2) {
        console.error('Fallback PDF generation also failed', err2);
        alert('Failed to generate PDF. Check console for details.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const generateTextPDF = () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    let y = 40;

    const pushLine = (text, options = {}) => {
      const { size = 12, style = 'normal' } = options;
      pdf.setFontSize(size);
      pdf.setFont(undefined, style);
      const split = pdf.splitTextToSize(text, usableWidth);
      pdf.text(split, margin, y);
      y += split.length * (size * 1.15) + 6;
      if (y > pdf.internal.pageSize.getHeight() - 60) {
        pdf.addPage();
        y = 40;
      }
    };

    // Header: include name, contact, and export date
    const displayName = user?.fullName || userData?.fullName || userData?.name || 'Profile';
    const email = user?.primaryEmailAddress?.emailAddress || (userData?.email || '');
    const profileUrl = `${window.location.origin}/profile`;

    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text(displayName, margin, y);
    y += 24;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    // contact line: render label then clickable email
    const emailLabel = 'Email: ';
    pdf.text(emailLabel, margin, y);
    const emailX = margin + pdf.getTextWidth(emailLabel);
    try {
      if (typeof pdf.textWithLink === 'function') {
        pdf.textWithLink(email, emailX, y, { url: `mailto:${email}` });
      } else {
        pdf.text(email, emailX, y);
        const tw = pdf.getTextWidth(email);
        pdf.link(emailX, y - 10, tw, 12, { url: `mailto:${email}` });
      }
    } catch (e) {
      // ignore link failures
      pdf.text(email, emailX, y);
    }
    y += 18;

    // profile link: render label then clickable URL
    const profileLabel = 'Profile: ';
    pdf.text(profileLabel, margin, y);
    const profileX = margin + pdf.getTextWidth(profileLabel);
    try {
      if (typeof pdf.textWithLink === 'function') {
        pdf.textWithLink(profileUrl, profileX, y, { url: profileUrl });
      } else {
        pdf.text(profileUrl, profileX, y);
        const tw = pdf.getTextWidth(profileUrl);
        pdf.link(profileX, y - 10, tw, 12, { url: profileUrl });
      }
    } catch (e) {
      pdf.text(profileUrl, profileX, y);
    }
    y += 20;
    // export date
    pushLine(`Exported: ${new Date().toLocaleString()}`, { size: 10 });

    // helper to format a start/end date range (falls back to createdAt)
    // If an end date is missing but a start exists, show 'Start — Present' (ongoing)
    const formatRange = (start, end, createdAt) => {
      try {
        const hasStart = !!start;
        const hasEnd = !!end;
        if (hasStart && hasEnd) return `${new Date(start).toLocaleDateString()} — ${new Date(end).toLocaleDateString()}`;
        if (hasStart && !hasEnd) return `${new Date(start).toLocaleDateString()} — Present`;
        if (!hasStart && hasEnd) return `${new Date(end).toLocaleDateString()}`;
        if (createdAt) return `${new Date(createdAt).toLocaleDateString()}`;
        return '';
      } catch (e) {
        return '';
      }
    };


    // Profile strength
    pushLine('\nProfile Strength:', { size: 14 });
    pushLine(`Completion: ${profileCompleteness}%`, { size: 12 });

    // (Concise skills summary removed; full skills list printed later under 'Skills:')

    // Employment / Career timeline
    pushLine('\nCareer Timeline:', { size: 14 });
    (userData?.employment || []).forEach(e => {
      const dates = `${e.startDate ? new Date(e.startDate).toLocaleDateString() : ''}${e.endDate ? ' — ' + new Date(e.endDate).toLocaleDateString() : ' — Present'}`;
      pushLine(`${dates}  |  ${e.jobTitle} @ ${e.company}`, { size: 12 });
      if (e.location) pushLine(`Location: ${e.location}`, { size: 11 });
      if (e.description) pushLine(`${e.description}`, { size: 11 });
    });

    // Projects (detailed) — include start/end dates when available
    pushLine('\nProjects:', { size: 14 });
    (userData?.projects || []).forEach(p => {
      const range = formatRange(p.startDate, p.endDate, p.createdAt);
      pushLine(`${p.name || 'Untitled Project'}${range ? ' — ' + range : ''}`, { size: 12 });
      if (p.description) pushLine(`${p.description}`, { size: 11 });
      if (p.url) {
        const label = 'Link: ';
        pdf.setFontSize(11);
        pdf.text(label, margin, y);
        const linkX = margin + pdf.getTextWidth(label);
        try {
          if (typeof pdf.textWithLink === 'function') {
            pdf.textWithLink(p.url, linkX, y, { url: p.url });
          } else {
            pdf.text(p.url, linkX, y);
            const tw = pdf.getTextWidth(p.url);
            pdf.link(linkX, y - 10, tw, 12, { url: p.url });
          }
        } catch (e) {
          pdf.text(p.url, linkX, y);
        }
        y += 16;
      }
    });

    // Education
    pushLine('\nEducation:', { size: 14 });
    (userData?.education || []).forEach(ed => {
      const dates = formatRange(ed.startDate, ed.endDate, ed.createdAt);
      pushLine(`${ed.degree || ''} @ ${ed.institution || ''}${dates ? ' ' + dates : ''}`, { size: 12 });
      if (ed.description) pushLine(`${ed.description}`, { size: 11 });
    });

    // Include full skills list but use a simple 'Skills:' heading (no 'full list' wording)
    pushLine('\nSkills:', { size: 14 });
    (userData?.skills || []).forEach(s => {
      pushLine(`${s.name}${s.level ? ` — ${s.level}` : ''}${s.category ? ` (${s.category})` : ''}`, { size: 11 });
    });

    pdf.save('profile-summary.pdf');
  };

  // Check account status first before showing dashboard
  useEffect(() => {
    const checkAccountAndRegister = async () => {
      if (!isSignedIn) {
        setIsCheckingAccount(false);
        return;
      }

      setIsCheckingAccount(true);
      setIsRegistering(true);
      
      try {
        const token = await getToken();
        setAuthToken(token);
        
        // Try to get user data
        try {
          const response = await api.get('/api/users/me');
          setAccountStatus('active');
          
          // Set user data and calculate profile completeness
          const data = response.data.data;
          setUserData(data);
          
          // Calculate profile completeness
          const completeness = calculateProfileCompleteness(data);
          setProfileCompleteness(completeness.overallScore);
        } catch (err) {
          // Check if account is deleted/restricted (403 error)
          if (err?.response?.status === 403) {
            console.log("Account is deleted or restricted - forcing logout");
            setAccountStatus('deleted');
            sessionStorage.setItem(
              "logoutMessage", 
              err?.response?.data?.message || "Your account has been scheduled for deletion and cannot be accessed."
            );
            // Delay signOut slightly to ensure state is set
            setTimeout(() => signOut(), 100);
            return;
          }
          
          // If user not found (404), this could be:
          // 1. First time user (needs registration)
          // 2. Deleted account trying to log back in (should NOT auto-register)
          if (err.response?.status === 404 || err.customError?.errorCode === 3001) {
            console.log("User not found in database, attempting to register...");
            
            try {
              // Attempt to register the user
              await api.post('/api/auth/register');
              console.log("✅ User registered successfully");
              
              // After registration, fetch user data again
              const response = await api.get('/api/users/me');
              const data = response.data.data;
              setUserData(data);
              const completeness = calculateProfileCompleteness(data);
              setProfileCompleteness(completeness.overallScore);
              setAccountStatus('active');
            } catch (registerErr) {
              console.error("Failed to register user:", registerErr);
              
              // If registration fails, log them out with appropriate message
              sessionStorage.setItem(
                "logoutMessage", 
                "Unable to complete registration. Please try again."
              );
              await signOut();
              return;
            }
          } else {
            // Other errors - treat as active but log error
            console.error("Error checking user status:", err);
            setAccountStatus('active');
          }
        }
      } catch (err) {
        console.error("Error in account check:", err);
        setAccountStatus('active'); // Fail open to avoid blocking legitimate users
      } finally {
        setIsRegistering(false);
        setIsCheckingAccount(false);
      }
    };

    if (isSignedIn) {
      checkAccountAndRegister();
    }
  }, [isSignedIn, getToken, signOut]);

  // Show loading while checking account or Clerk is loading
  if (!isLoaded || isCheckingAccount || isRegistering) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="lg"
        text="Loading your dashboard..." 
        variant="logo" 
      />
    );
  }

  // Don't render dashboard if account is deleted
  if (accountStatus === 'deleted') {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="md"
        text="Redirecting..." 
        variant="spinner" 
      />
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // Build small summary lists for each category so each entry can be rendered on its own line
  const employmentSummaryList = (() => {
    const emp = userData?.employment || [];
    if (!emp.length) return ['No employment entries'];
    const sorted = [...emp].sort((a,b) => new Date(b.startDate || b.updatedAt || b.createdAt) - new Date(a.startDate || a.updatedAt || a.createdAt));
    return sorted.slice(0,3).map(e => `${e.jobTitle || 'Role'} @ ${e.company || 'Company'}`);
  })();

  const skillsSummaryList = (() => {
    const skills = (userData?.skills || []);
    if (!skills.length) return ['No skills added'];
    return skills.slice(0,5).map(s => s.name).filter(Boolean);
  })();

  const educationSummaryList = (() => {
    const edu = (userData?.education || []);
    if (!edu.length) return ['No education entries'];
    const sorted = [...edu].sort((a,b) => new Date(b.endDate || b.startDate || b.updatedAt || b.createdAt) - new Date(a.endDate || a.startDate || a.updatedAt || a.createdAt));
    return sorted.slice(0,3).map(ed => `${ed.degree || ''}${ed.institution ? ' @ ' + ed.institution : ''}`.trim() || 'Education entry');
  })();

  const projectsSummaryList = (() => {
    const projs = (userData?.projects || []);
    if (!projs.length) return ['No projects'];
    return projs.slice(-5).reverse().map(p => p.name).filter(Boolean);
  })();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E4E6E0' }}>
      <Container level={1} className="pt-12 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Card */}
          <Card variant="primary" className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-heading font-bold mb-2 wrap-break-word" style={{ color: '#4F5348' }}>
                  Welcome, {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                </h1>
                <p className="text-sm" style={{ color: '#656A5C' }}>
                  You are successfully logged in!
                </p>
              </div>
              <div className="flex items-start gap-2">
                <button
                onClick={() => {
                  sessionStorage.setItem("logoutMessage", "You have been successfully logged out");
                  signOut();
                }}
                className="px-6 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap self-start sm:self-auto shrink-0"
                style={{ backgroundColor: '#EF4444' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
              >
                Logout
                </button>
              </div>
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card title="Profile Completion" variant="elevated">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Complete your profile to stand out</p>
                <span className="text-2xl font-bold" style={{ color: '#777C6D' }}>{profileCompleteness}%</span>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all" 
                  style={{ width: `${profileCompleteness}%`, backgroundColor: '#777C6D' }}
                />
              </div>
            </Card>

            <Card title="Activity Summary" variant="elevated">
              <p className="text-sm text-gray-600 mb-2">Recent updates and activity</p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Profile viewed 12 times</li>
                <li>• 3 new connections</li>
              </ul>
            </Card>
          </div>

          {/* Notifications Card */}
          <Card title="Notifications" variant="info" interactive>
            <p className="text-sm text-gray-700">
              No new notifications at this time.
            </p>
          </Card>

          {/* UC-033: Profile Overview additions */}
          <div ref={exportRef} id="dashboard-export" className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Card title="Summary Cards">
                  <div id="export-summary-cards" className="rounded-md overflow-hidden border border-gray-200 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-base font-semibold text-gray-800 mb-2">Employment</div>
                        {employmentSummaryList.map((line, idx) => (
                          <div key={idx} className="text-sm text-gray-700">{line}</div>
                        ))}
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-base font-semibold text-gray-800 mb-2">Skills</div>
                        {skillsSummaryList.map((line, idx) => (
                          <div key={idx} className="text-sm text-gray-700">{line}</div>
                        ))}
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-base font-semibold text-gray-800 mb-2">Education</div>
                        {educationSummaryList.map((line, idx) => (
                          <div key={idx} className="text-sm text-gray-700">{line}</div>
                        ))}
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-base font-semibold text-gray-800 mb-2">Projects</div>
                        {projectsSummaryList.map((line, idx) => (
                          <div key={idx} className="text-sm text-gray-700">{line}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <Card title="Career Timeline">
                <CareerTimeline employment={userData?.employment || []} />
              </Card>

              <Card title="Recent Activity">
                <div id="export-recent-activity">
                  <ActivityTimeline items={(
                  // Build activity from recent changes in projects/skills/employment
                  [
                    ...(userData?.projects || []).slice(-3).reverse().map((p, i) => ({ id: `proj-${p._id||i}`, text: `Updated project: ${p.name}`, date: p.updatedAt || p.createdAt || '' })),
                    ...(userData?.skills || []).slice(-3).reverse().map((s,i) => ({ id: `skill-${s._id||i}`, text: `Updated skill: ${s.name}`, date: s.updatedAt || s.createdAt || '' })),
                    ...(userData?.employment || []).slice(-2).reverse().map((e,i) => ({ id: `emp-${e._id||i}`, text: `Employment entry: ${e.jobTitle} at ${e.company}`, date: e.updatedAt || e.startDate || '' }))
                  ].filter(Boolean)
                  )} />
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Download button placed above the right-column cards */}
              <div className="flex justify-end">
                <button
                  onClick={() => handleDownloadPDF()}
                  className={`px-4 py-2 text-sm rounded border bg-white ${isExporting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  disabled={isExporting}
                >
                  {isExporting ? 'Preparing...' : 'Download Summary'}
                </button>
              </div>

              <Card title="Profile Strength">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Completion</div>
                    <div className="text-2xl font-bold mt-1">{profileCompleteness}%</div>
                  </div>
                  <div className="w-40">
                    <div className="h-3 w-full bg-gray-200 rounded-full">
                      <div style={{ width: `${profileCompleteness}%`, backgroundColor: '#777C6D', height: '100%' }} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  {profileCompleteness >= 90 ? 'Profile looks strong. Good job!' : (
                    <ul className="list-disc pl-5">
                      {profileCompleteness < 80 && <li>Add more skills and projects to increase visibility.</li>}
                      {profileCompleteness < 60 && <li>Complete your employment and education details.</li>}
                    </ul>
                  )}
                </div>
              </Card>

              <Card title="Skills Distribution">
                <div id="export-skills-distribution">
                  <SkillsChart data={(userData?.skills || []).reduce((acc, s) => {
                  const cat = s.category || 'Other';
                  const found = acc.find(a => a.name === cat);
                  if (found) found.count += 1; else acc.push({ name: cat, count: 1 });
                  return acc;
                }, [])} />
                </div>
              </Card>

              <Card title="Quick Actions">
                <div className="flex flex-wrap gap-2">
                  <QuickAddButton label="Add Employment" openParam="employment" />
                  <QuickAddButton label="Add Skill" openParam="skill" />
                  <QuickAddButton label="Add Education" openParam="education" />
                  <QuickAddButton label="Add Project" openParam="project" />
                </div>
              </Card>
              
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

