import React, { useEffect, useMemo, useState } from "react";
import "./InterviewChecklist.css";

function generateTasks({ role, seniority, company, culture, jobTitle, jobDescription = "" }) {
  const roleLower = (role || jobTitle || "").toLowerCase();
  const desc = (jobDescription || "").toLowerCase();

  // Simple extractor for technologies / skills mentioned in the job description
  const extractTechs = (text) => {
    const techTerms = [
      "react", "vue", "angular", "javascript", "typescript", "node", "express",
      "python", "java", "c++", "c#", "golang", "go", "ruby", "rails",
      "aws", "gcp", "azure", "docker", "kubernetes", "sql", "postgresql", "mysql",
      "mongodb", "redis", "graphql", "rest", "api", "html", "css", "sass",
      "tensorflow", "pytorch", "machine learning", "ml", "nlp", "data structures", "algorithms",
      "system design", "distributed", "scalability", "performance"
    ];
    const found = new Set();
    techTerms.forEach((t) => { if (text.includes(t)) found.add(t); });
    return Array.from(found);
  };

  const extractResponsibilities = (text) => {
    const resp = [];
    if (text.includes("lead") || text.includes("manage") || text.includes("manager") || text.includes("leadership")) resp.push("leadership");
    if (text.includes("product") || text.includes("metrics") || text.includes("roadmap")) resp.push("product-sense");
    if (text.includes("customer") || text.includes("stakeholder")) resp.push("stakeholder-engagement");
    if (text.includes("design") || text.includes("architecture") || text.includes("system design")) resp.push("system-design");
    return resp;
  };

  const detectedTechs = extractTechs(desc);
  const detectedResps = extractResponsibilities(desc);
  const baseTasks = [];

  // Role-specific suggestions (simple heuristics)
  if (roleLower.includes("engineer") || roleLower.includes("developer") || roleLower.includes("software")) {
    baseTasks.push({
      id: "tech-review",
      title: "Review core technical topics and system design",
      detail: `Algorithms, data structures, and system design questions relevant to ${seniority || "role"}`,
    });
    baseTasks.push({ id: "coding-practice", title: "Do timed coding problems (2-3) on your preferred platform", detail: "Focus on common interview patterns" });
    baseTasks.push({ id: "repo-walkthrough", title: "Prepare to walk through a code sample or project", detail: "Pick 1-2 representative commits or PRs" });
    // Add detected responsibilities for engineers
    if (detectedResps.includes("system-design") || detectedTechs.some(t => t === "system design")) {
      baseTasks.unshift({ id: "focus-system-design", title: "Deep-dive system design prep", detail: "Sketch architecture, scalability and trade-offs for system components mentioned in job description" });
    }
  } else if (roleLower.includes("product")) {
    baseTasks.push({ id: "pm-sense", title: "Prepare product sense examples", detail: "Prioritize product tradeoffs, metrics, and roadmap thinking" });
    baseTasks.push({ id: "case-study", title: "Practice a product case study", detail: "Structure frameworks and clarify assumptions" });
  } else if (roleLower.includes("design") || roleLower.includes("ux")) {
    baseTasks.push({ id: "portfolio-review", title: "Prepare portfolio case studies", detail: "Include problem, approach, and impact for 2-3 projects" });
    baseTasks.push({ id: "design-exercises", title: "Sketch a design exercise", detail: "Practice thinking aloud and tradeoffs" });
  } else {
    baseTasks.push({ id: "role-overview", title: "Prepare examples that match the role description", detail: "Map your experience to the job posting bullets" });
  }

  // Create technology-specific tasks from the job description (e.g., React, Python, AWS)
  const techTasks = detectedTechs.map((tech) => ({
    id: `tech:${tech}`,
    title: `Review ${tech.replace(/\b(machine learning|ml)\b/, 'ML').toUpperCase()}`,
    detail: `Refresh core concepts and prepare examples where you used ${tech}`,
  }));

  // Responsibility-driven tasks (leadership, product-sense, stakeholder-engagement)
  const respTasks = detectedResps.map((r) => {
    if (r === "leadership") return { id: "resp:leadership", title: "Prepare leadership examples", detail: "STAR stories about taking ownership, mentoring, and driving outcomes" };
    if (r === "product-sense") return { id: "resp:product", title: "Prepare product-sense examples", detail: "Discuss metrics, roadmaps, and tradeoffs relevant to the role" };
    if (r === "stakeholder-engagement") return { id: "resp:stakeholder", title: "Prepare stakeholder communication examples", detail: "Examples of working cross-functionally and handling stakeholder needs" };
    if (r === "system-design") return { id: "resp:system-design", title: "Prepare system design examples", detail: "Design discussions and decisions around architecture and tradeoffs" };
    return null;
  }).filter(Boolean);

  // Prepend tech & responsibility tasks so they appear first in role-specific group
  const dynamicRoleItems = [...techTasks, ...respTasks];
  if (dynamicRoleItems.length) {
    // ensure no duplicates by id
    const ids = new Set(baseTasks.map(b => b.id));
    dynamicRoleItems.forEach(it => { if (!ids.has(it.id)) baseTasks.unshift(it); });
  }

  // Company research items
  const companyResearch = [
    { id: "company-mission", title: "Verify company mission and product lines", detail: `Know what ${company || "the company"} builds and why` },
    { id: "recent-news", title: "Find recent news or press mentions", detail: "Read 1-3 recent articles or blog posts" },
    { id: "values-culture", title: "Confirm company values and culture", detail: "Look for diversity, remote policies, and interview tone" },
    { id: "interviewer-research", title: "Research interviewers (LinkedIn) if available", detail: "Prepare 1-2 personalized prompts or connections" },
  ];

  // Thoughtful questions reminder
  const thoughtfulQuestions = [
    { id: "questions-list", title: "Prepare 6+ thoughtful questions for the interviewer", detail: "Cover role expectations, success metrics, team structure, and next steps" },
  ];

  // Attire suggestions
  const attire = (() => {
    const c = (culture || "").toLowerCase();
    if (c.includes("startup") || c.includes("casual")) return { title: "Business casual (neat) recommended", detail: "Smart casual: tidy shirt, blazer optional" };
    if (c.includes("corporate") || c.includes("formal")) return { title: "Business formal recommended", detail: "Suit or equivalent professional attire" };
    return { title: "Smart casual", detail: "When in doubt, opt for neat + professional" };
  })();

  // Logistics
  const logistics = [
    { id: "confirm-time", title: "Confirm interview time and timezone", detail: "Double-check calendar invite and adjust for zones" },
    { id: "location", title: "Verify location / meeting link", detail: "Directions, parking, or video link and passcodes" },
    { id: "tech-check", title: "Test technology setup (camera/mic/screen share)", detail: "Run a test call and check internet stability" },
    { id: "backup-plan", title: "Plan backup contact method", detail: "Have phone number or alternate email ready" },
  ];

  // Confidence-building
  const confidence = [
    { id: "mock-interview", title: "Do a mock interview or practice talk", detail: "Record or ask a friend to simulate questions" },
    { id: "breathing", title: "Breathing/visualization exercise", detail: "5-10 min breathing and mental walkthrough before interview" },
    { id: "review-scripts", title: "Run through 3 STAR stories", detail: "Behavioral examples for teamwork, conflict, impact" },
  ];

  // Portfolio/work samples
  const portfolio = [
    { id: "sample-select", title: "Select 2-4 best work samples", detail: "Tailor to role; ensure links open and run" },
    { id: "one-pager", title: "Prepare a one-page summary for each sample", detail: "Problem, approach, technologies, impact" },
  ];

  // Post-interview
  const postInterview = [
    { id: "thank-you", title: "Send a thank-you email within 24 hours", detail: "Personalize to conversation and next steps" },
    { id: "follow-up", title: "Record notes and action items", detail: "What went well, what to improve for next time" },
    { id: "linkedin", title: "Optional: connect with interviewer on LinkedIn", detail: "Include a short note referencing the interview" },
  ];

  // Merge into grouped checklist
  const groups = [
    { key: "role", title: "Role-specific", items: baseTasks },
    { key: "company", title: "Company Research", items: companyResearch },
    { key: "questions", title: "Questions to Ask", items: thoughtfulQuestions },
    { key: "attire", title: "Attire Suggestion", items: [{ id: "attire", title: attire.title, detail: attire.detail }] },
    { key: "logistics", title: "Logistics", items: logistics },
    { key: "confidence", title: "Confidence-Building", items: confidence },
    { key: "portfolio", title: "Portfolio / Work Samples", items: portfolio },
    { key: "post", title: "Post-Interview", items: postInterview },
  ];

  // Flatten all items with default completed:false
  const allItems = [];
  groups.forEach((g) => g.items.forEach((it) => allItems.push({ ...it, group: g.title, completed: false })));

  return { groups, allItems };
}

export default function InterviewChecklist({ job = null, onClose = null }) {
  const [role, setRole] = useState(job?.title || "");
  const [company, setCompany] = useState(job?.company || "");
  const [seniority, setSeniority] = useState("");
  const [culture, setCulture] = useState("");
  const [items, setItems] = useState([]);
  const [autoGenerated, setAutoGenerated] = useState(false);

  const key = useMemo(() => `interviewChecklist:${job?._id || `${role}:${company}`}`, [job, role, company]);
  const settingsKey = useMemo(() => `interviewChecklistSettings:${job?._id || `${role}:${company}`}`, [job, role, company]);

  // Load saved seniority and culture from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        const { seniority: savedSeniority, culture: savedCulture } = JSON.parse(savedSettings);
        if (savedSeniority) setSeniority(savedSeniority);
        if (savedCulture) setCulture(savedCulture);
      }
    } catch (e) {
      // ignore
    }
  }, [settingsKey]);

  // Save seniority to localStorage when it changes
  const handleSeniorityChange = (value) => {
    setSeniority(value);
    try {
      const current = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      localStorage.setItem(settingsKey, JSON.stringify({ ...current, seniority: value }));
    } catch (e) {}
  };

  // Save culture to localStorage when it changes
  const handleCultureChange = (value) => {
    setCulture(value);
    try {
      const current = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      localStorage.setItem(settingsKey, JSON.stringify({ ...current, culture: value }));
    } catch (e) {}
  };

  useEffect(() => {
    // load saved state if exists
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setItems(JSON.parse(raw));
        setAutoGenerated(true);
      } else if (job && !autoGenerated) {
        // Auto-generate checklist for job if not already done
        generate();
        setAutoGenerated(true);
      }
    } catch (e) {
      // ignore
    }
  }, [key, job, autoGenerated]);

  const generate = () => {
    const { allItems } = generateTasks({ 
      role, 
      seniority, 
      company, 
      culture,
      jobTitle: job?.title,
      jobDescription: job?.description || ""
    });
    setItems(allItems);
    // persist
    try {
      localStorage.setItem(key, JSON.stringify(allItems));
    } catch (e) {}
  };

  const toggle = (id) => {
    const next = items.map((it) => (it.id === id ? { ...it, completed: !it.completed } : it));
    setItems(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch (e) {}
  };

  const clear = () => {
    setItems([]);
    setSeniority("");
    setCulture("");
    setAutoGenerated(false);
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(settingsKey);
    } catch (e) {}
  };

  const progress = items.length ? Math.round((items.filter((i) => i.completed).length / items.length) * 100) : 0;

  const grouped = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      map[it.group] = map[it.group] || [];
      map[it.group].push(it);
    });
    return map;
  }, [items]);

  // Track which groups are expanded (collapsible sections)
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    // Ensure every group has a default expanded state (default: expanded)
    setExpandedGroups((prev) => {
      const next = { ...prev };
      Object.keys(grouped).forEach((k) => {
        if (!(k in next)) next[k] = true;
      });
      // remove any stale keys that no longer exist
      Object.keys(next).forEach((k) => { if (!Object.prototype.hasOwnProperty.call(grouped, k)) delete next[k]; });
      return next;
    });
  }, [grouped]);

  const toggleGroup = (name) => {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="interview-checklist container">
      {onClose && (
        <div className="sticky top-0 bg-white z-20 py-4 -mx-6 px-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Interview Preparation Checklist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
      )}
      {!onClose && <h2>Interview Preparation Checklist</h2>}

      {job && (
        <div className="job-info-banner">
          <div className="job-title">{job.title}</div>
          <div className="job-company">{job.company}</div>
          {job.location && <div className="job-location">📍 {job.location}</div>}
        </div>
      )}

      {!job && (
        <>
          <div className="form-row">
            <label>Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineer" />
            <label>Seniority</label>
            <select value={seniority} onChange={(e) => handleSeniorityChange(e.target.value)}>
              <option value="">Select</option>
              <option>Intern</option>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Staff/Principal</option>
            </select>
          </div>

          <div className="form-row">
            <label>Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
            <label>Company Culture</label>
            <select value={culture} onChange={(e) => handleCultureChange(e.target.value)}>
              <option value="">Choose</option>
              <option>Startup / Casual</option>
              <option>Corporate / Formal</option>
              <option>Hybrid / Mixed</option>
            </select>
          </div>
        </>
      )}

      <div className="form-row">
        <label>Seniority</label>
        <select value={seniority} onChange={(e) => handleSeniorityChange(e.target.value)}>
          <option value="">Select</option>
          <option>Intern</option>
          <option>Junior</option>
          <option>Mid</option>
          <option>Senior</option>
          <option>Staff/Principal</option>
        </select>
        <label>Company Culture</label>
        <select value={culture} onChange={(e) => handleCultureChange(e.target.value)}>
          <option value="">Choose</option>
          <option>Startup / Casual</option>
          <option>Corporate / Formal</option>
          <option>Hybrid / Mixed</option>
        </select>
      </div>

      <div className="actions">
        <button className="btn-primary" onClick={generate}>
          {items.length > 0 ? "Regenerate Checklist" : "Generate Checklist"}
        </button>
        {items.length > 0 && (
          <button onClick={clear} className="btn-link">Clear</button>
        )}
        <div className="progress">Progress: {progress}%</div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          {job 
            ? "Click 'Generate Checklist' to create your interview preparation plan."
            : "No checklist generated yet. Enter role & company and click Generate."}
        </div>
      ) : (
        Object.keys(grouped).map((groupName) => (
          <section key={groupName} className="group">
            <div
              className="group-header flex items-center justify-between cursor-pointer"
              onClick={() => toggleGroup(groupName)}
              role="button"
              aria-expanded={!!expandedGroups[groupName]}
            >
              <h3 className="flex-1">{groupName}</h3>
              <button
                onClick={(e) => { e.stopPropagation(); toggleGroup(groupName); }}
                aria-label={expandedGroups[groupName] ? `Collapse ${groupName}` : `Expand ${groupName}`}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                {expandedGroups[groupName] ? "▾" : "▸"}
              </button>
            </div>

            {expandedGroups[groupName] && (
              <ul>
                {grouped[groupName].map((it) => (
                  <li key={it.id} className={it.completed ? "completed" : ""}>
                    <label>
                      <input type="checkbox" checked={!!it.completed} onChange={() => toggle(it.id)} />
                      <span className="title">{it.title}</span>
                    </label>
                    <div className="detail">{it.detail}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}

      <div className="footer-note">
        💡 Tip: Your checklist is automatically saved. Complete tasks as you prepare for your interview!
      </div>
    </div>
  );
}
