import { useEffect, useState, useRef } from "react";
import Card from "../../components/Card";
import InputField from "../../components/InputField";

const INDUSTRIES = ["Software", "Finance", "Healthcare", "Education", "Marketing", "Other"];

const SAMPLE_ORGS = [
  "Coursera",
  "Udemy",
  "Microsoft",
  "Google",
  "AWS",
  "Cisco",
  "PMI",
];

import api, { setAuthToken } from "../../api/axios";

export default function Certifications({ getToken, onListUpdate }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    name: "",
    organization: "",
    dateEarned: "",
    expirationDate: "",
    doesNotExpire: false,
    certId: "",
    industry: "",
    reminderDays: 30,
    verification: "Unverified",
    document: null,
  });
  const [orgQuery, setOrgQuery] = useState("");
  const fileInputRef = useRef(null);
  const [tempDoc, setTempDoc] = useState(null);
  const [uploadedName, setUploadedName] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (getToken) {
        try {
          const token = await getToken();
          setAuthToken(token);
          const me = await api.get('/api/users/me');
          setList(me?.data?.data?.certifications || []);
        } catch (e) {}
      } else {
        try {
          const raw = localStorage.getItem("certifications");
          if (raw) setList(JSON.parse(raw));
        } catch (e) {}
      }
    };
    load();
  }, [getToken]);

  const saveList = (newList) => {
    setList(newList);
    onListUpdate?.(newList);
    try { localStorage.setItem("certifications", JSON.stringify(newList)); } catch {}
  };

  const handleChange = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // store temporarily until user confirms
      setTempDoc({ name: file.name, data: reader.result });
      setUploadedName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const confirmUpload = () => {
    if (!tempDoc) return alert("No file selected to upload");
    setForm((s) => ({ ...s, document: tempDoc }));
    setTempDoc(null);
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.organization.trim()) return "Organization is required";
    if (!form.dateEarned) return "Date earned is required";
    if (!form.doesNotExpire && !form.expirationDate) return "Expiration date required or mark 'Does not expire'";
    return null;
  };

  const addCertification = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    try {
      if (getToken) {
        const token = await getToken();
        setAuthToken(token);
        if (editingId) {
          await api.put(`/api/profile/certifications/${editingId}`, form);
        } else {
          await api.post('/api/profile/certifications', form);
        }
        const me = await api.get('/api/users/me');
        const updated = me?.data?.data?.certifications || [];
        saveList(updated);
      } else {
        // Fallback to localStorage
        if (editingId) {
          const updated = list.map((c) => (c.id === editingId ? { ...form, id: editingId } : c));
          saveList(updated);
        } else {
          const item = { ...form, id: Date.now() };
          const newList = [item, ...list];
          saveList(newList);
        }
      }
    } catch (e2) {
      console.error('Failed to save certification', e2);
      alert('Failed to save certification');
    } finally {
      setEditingId(null);
      setForm({
        name: "",
        organization: "",
        dateEarned: "",
        expirationDate: "",
        doesNotExpire: false,
        certId: "",
        industry: "",
        reminderDays: 30,
        verification: "Unverified",
        document: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = null;
      setUploadedName(null);
      setTempDoc(null);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this certification?")) return;
    try {
      if (getToken) {
        const token = await getToken();
        setAuthToken(token);
        await api.delete(`/api/profile/certifications/${id}`);
        const me = await api.get('/api/users/me');
        saveList(me?.data?.data?.certifications || []);
      } else {
        saveList(list.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete certification', e);
    }
  };

  const editCertification = (id) => {
    const found = list.find((c) => (c._id || c.id) === id);
    if (!found) return;
    setForm({
      name: found.name || "",
      organization: found.organization || "",
      dateEarned: found.dateEarned ? new Date(found.dateEarned).toISOString().slice(0,10) : "",
      expirationDate: found.expirationDate ? new Date(found.expirationDate).toISOString().slice(0,10) : "",
      doesNotExpire: found.doesNotExpire || false,
      certId: found.certId || "",
      industry: found.industry || "",
      reminderDays: typeof found.reminderDays === 'number' ? found.reminderDays : 30,
      verification: found.verification || "Unverified",
      document: found.document || null,
    });
    setEditingId(found._id || id);
    setUploadedName(found.document ? found.document.name : null);
  };

  const toggleVerification = async (id) => {
    try {
      if (getToken) {
        const token = await getToken();
        setAuthToken(token);
        const target = list.find(c => (c._id || c.id) === id);
        if (!target) return;
        const next = target.verification === "Unverified" ? "Pending" : target.verification === "Pending" ? "Verified" : "Unverified";
        await api.put(`/api/profile/certifications/${target._id || id}`, { verification: next });
        const me = await api.get('/api/users/me');
        saveList(me?.data?.data?.certifications || []);
      } else {
        const newList = list.map((c) => {
          if ((c._id || c.id) !== id) return c;
          const next = c.verification === "Unverified" ? "Pending" : c.verification === "Pending" ? "Verified" : "Unverified";
          return { ...c, verification: next };
        });
        saveList(newList);
      }
    } catch (e) {
      console.error('Failed to toggle verification', e);
    }
  };

  const daysUntil = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  };

  const orgSuggestions = SAMPLE_ORGS.filter((o) => o.toLowerCase().includes(orgQuery.toLowerCase())).slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-heading mb-4">Certifications</h2>
      <Card>
        <form id="cert-form" onSubmit={addCertification} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Certification name" value={form.name} onChange={handleChange("name")} />
            <div>
              <label className="block">
                <div className="mb-1 text-sm font-medium text-gray-700">Issuing organization</div>
                <input
                  value={form.organization}
                  onChange={(e) => { handleChange("organization")(e); setOrgQuery(e.target.value); }}
                  placeholder="Organization"
                  className="w-full border rounded-md p-2"
                />
                {orgQuery && orgSuggestions.length > 0 && (
                  <div className="border bg-white mt-1 rounded-md p-2">
                    {orgSuggestions.map((s) => (
                      <div key={s} className="py-1 text-sm cursor-pointer hover:bg-gray-100" onClick={() => { setForm((f) => ({ ...f, organization: s })); setOrgQuery(""); }}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </label>
            </div>

            <InputField label="Date earned" type="date" value={form.dateEarned} onChange={handleChange("dateEarned")} />
            <div>
              <label className="block">
                <div className="mb-1 text-sm font-medium text-gray-700">Expiration date</div>
                <input type="date" value={form.expirationDate} onChange={handleChange("expirationDate")} className="w-full border rounded-md p-2" disabled={form.doesNotExpire} />
                <label className="inline-flex items-center mt-2">
                  <input type="checkbox" checked={form.doesNotExpire} onChange={handleChange("doesNotExpire")} className="mr-2" /> Does not expire
                </label>
              </label>
            </div>

            <InputField label="Certification number / ID" value={form.certId} onChange={handleChange("certId")} />
            <div>
              <label className="block">
                <div className="mb-1 text-sm font-medium text-gray-700">Industry</div>
                <select value={form.industry} onChange={handleChange("industry")} className="w-full border rounded-md p-2">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div>
            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">Upload document</div>
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" onChange={handleFile} className="hidden" />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Choose File
                </button>
                <div className="text-sm text-gray-700">{uploadedName || (form.document ? form.document.name : 'No file chosen')}</div>
                <button 
                  type="button" 
                  onClick={confirmUpload} 
                  disabled={!tempDoc}
                  className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Upload
                </button>
              </div>
              {form.document && <div className="text-sm mt-2">Uploaded: {form.document.name}</div>}
            </label>
          </div>

          <div>
            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">Renewal reminder (days before expiration)</div>
              <input
                type="number"
                min={0}
                value={form.reminderDays}
                onChange={handleChange("reminderDays")}
                className="w-40 border rounded-md p-2"
              />
              <div className="text-xs text-gray-500 mt-1">Set how many days before expiration you'd like a reminder (0 = same day).</div>
            </label>
          </div>

          {/* Buttons are now in the modal wrapper footer */}
        </form>
      </Card>

      {/* When this form is used as a modal inside ProfilePage, reminders and the main list are shown on the profile page instead. */}
    </div>
  );
}

