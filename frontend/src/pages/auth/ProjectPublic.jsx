import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectDetail from '../../components/projects/ProjectDetail';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProjectPublic() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
    const resp = await api.get(`/api/projects/${id}`);
    // backend returns { project, owner } inside data.data
    const payload = resp?.data?.data || resp?.data || null;
    const proj = payload?.project || payload;
    setProject(proj || null);
      } catch (err) {
        console.error('Failed to load public project', err);
        setError('Project not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!project) return <div className="p-8">Project not found.</div>;

  // render ProjectDetail inline (non-modal) for public viewing
  return (
    <div className="p-6">
      <ProjectDetail project={project} onClose={() => navigate(-1)} />
    </div>
  );
}
