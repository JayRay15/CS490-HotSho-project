import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

const STATUS = ["Completed", "Ongoing", "Planned"];
const SAMPLE_TECHS = ["React", "Node.js", "Python", "AWS", "Docker", "Postgres"];
const INDUSTRIES = ["Software", "Healthcare", "Finance", "Education", "Marketing", "Other"];

export default function Projects({ onClose }) {
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    role: "",
    startDate: "",
    endDate: "",
    technologies: "",
    projectUrl: "",
    teamSize: 1,
    collaboration: "",
    outcomes: "",
    industry: "",
    status: "Completed",
    screenshot: null,
  });
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('projects');
      if (raw) setList(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const saveList = (newList) => {
    setList(newList);
    localStorage.setItem('projects', JSON.stringify(newList));
  };

  const handleChange = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((s) => ({ ...s, screenshot: { name: file.name, data: reader.result } }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!form.name.trim()) return "Project name is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.role.trim()) return "Role is required";
    if (!form.startDate) return "Start date is required";
    return null;
  };

  const addProject = (e) => {
    e?.preventDefault();
    const err = validate();
    if (err) return alert(err);
    if (editingId) {
      const updated = list.map((p) => (p.id === editingId ? { ...form, id: editingId } : p));
      saveList(updated);
      setEditingId(null);
      resetForm();
      return;
    }
    const item = { ...form, id: Date.now() };
    const newList = [item, ...list];
    saveList(newList);
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: "", description: "", role: "", startDate: "", endDate: "", technologies: "", projectUrl: "", teamSize: 1, collaboration: "", outcomes: "", industry: "", status: "Completed", screenshot: null });
    if (fileRef.current) fileRef.current.value = null;
  };

  const edit = (id) => {
    const found = list.find((p) => p.id === id);
    if (!found) return;
    setForm({ ...found });
    setEditingId(id);
    if (fileRef.current) fileRef.current.value = null;
  };

  const remove = (id) => {
    if (!confirm('Delete this project?')) return;
    saveList(list.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-heading mb-4">Projects</h2>
      <Card>
        <form id="project-form" onSubmit={addProject} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Project name" value={form.name} onChange={handleChange('name')} />
            <InputField label="Role" value={form.role} onChange={handleChange('role')} />

            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">Start date</div>
              <input type="date" value={form.startDate} onChange={handleChange('startDate')} className="w-full border rounded-md p-2" />
            </label>
            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">End date</div>
              <input type="date" value={form.endDate} onChange={handleChange('endDate')} className="w-full border rounded-md p-2" />
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Description</div>
              <textarea value={form.description} onChange={handleChange('description')} className="w-full border rounded-md p-2 min-h-[120px]" />
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Technologies (comma-separated)</div>
              <input value={form.technologies} onChange={handleChange('technologies')} className="w-full border rounded-md p-2" placeholder="React, Node.js, PostgreSQL" />
              <div className="text-xs text-gray-500 mt-1">Suggestions: {SAMPLE_TECHS.join(', ')}</div>
            </label>

            <InputField label="Project URL / Repo" value={form.projectUrl} onChange={handleChange('projectUrl')} />
            <label>
              <div className="mb-1 text-sm font-medium text-gray-700">Team size</div>
              <input type="number" min={1} value={form.teamSize} onChange={handleChange('teamSize')} className="w-40 border rounded-md p-2" />
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Collaboration / Team details</div>
              <input value={form.collaboration} onChange={handleChange('collaboration')} className="w-full border rounded-md p-2" />
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Outcomes & achievements</div>
              <textarea value={form.outcomes} onChange={handleChange('outcomes')} className="w-full border rounded-md p-2 min-h-[80px]" />
            </label>

            <label>
              <div className="mb-1 text-sm font-medium text-gray-700">Industry</div>
              <select value={form.industry} onChange={handleChange('industry')} className="w-full border rounded-md p-2">
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>

            <label>
              <div className="mb-1 text-sm font-medium text-gray-700">Status</div>
              <select value={form.status} onChange={handleChange('status')} className="w-full border rounded-md p-2">
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Upload screenshot</div>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" onChange={handleFile} className="hidden" />
                <Button type="button" variant="secondary" onClick={() => fileRef.current && fileRef.current.click()}>Choose File</Button>
                <div className="text-sm text-gray-700">{form.screenshot ? form.screenshot.name : 'No file chosen'}</div>
              </div>
              {form.screenshot && <div className="mt-2"><img src={form.screenshot.data} alt={form.screenshot.name} className="max-h-40 rounded-md" /></div>}
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" className="bg-blue-600 text-white hover:bg-blue-700">{editingId ? 'Save Changes' : 'Add Project'}</Button>
            <Button type="button" variant="secondary" onClick={() => { resetForm(); setEditingId(null); }}>Reset</Button>
            <div className="ml-auto">
              <Button type="button" variant="ghost" onClick={() => { if (onClose) return onClose(); navigate('/profile'); }}>Close</Button>
            </div>
          </div>
        </form>
      </Card>
      
    </div>
  );
}
