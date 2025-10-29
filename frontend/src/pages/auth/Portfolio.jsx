import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { setAuthToken } from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectFilters from '../../components/projects/ProjectFilters';
import ProjectGrid from '../../components/projects/ProjectGrid';
import ProjectDetail from '../../components/projects/ProjectDetail';
import { useAuth } from '@clerk/clerk-react';

export default function PortfolioPage() {
  const { getToken, isSignedIn } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ techs: [], industries: [], query: '', sort: 'dateDesc' });
  const [selectedProject, setSelectedProject] = useState(null);
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (token) setAuthToken(token);
        const resp = await api.get('/api/users/me');
        const list = resp?.data?.data?.projects || [];
        setProjects(list);
      } catch (err) {
        console.error('Failed to load projects', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) load();
  }, [getToken, isSignedIn]);

  // If route includes project id, open detail view
  useEffect(() => {
    if (params?.id && projects.length) {
      const found = projects.find(p => p._id === params.id || p.id === params.id);
      setSelectedProject(found || null);
    }
  }, [params, projects]);

  const techOptions = useMemo(() => {
    const s = new Set();
    projects.forEach(p => (p.technologies || []).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [projects]);

  const industryOptions = useMemo(() => {
    const s = new Set();
    projects.forEach(p => p.industry && s.add(p.industry));
    return Array.from(s).sort();
  }, [projects]);

  const handleOpenDetail = (project) => {
    if (!project) return;
    setSelectedProject(project);
    navigate(`/portfolio/project/${project._id || project.id}`);
  };

  const handleCloseDetail = () => {
    setSelectedProject(null);
    navigate('/portfolio');
  };

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Portfolio</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="mb-6">
        <ProjectFilters
          techOptions={techOptions}
          industryOptions={industryOptions}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      <ProjectGrid
        projects={projects}
        filters={filters}
        onOpenDetail={handleOpenDetail}
      />

      {selectedProject && (
        <ProjectDetail project={selectedProject} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
