import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import api from "../../api/axios";
import Container from "../../components/Container";
import Card from "../../components/Card";

export default function MaterialsAnalytics() {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await getToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const resp = await api.get('/api/materials/analytics');
        setData(resp.data.data || resp.data);
      } catch (e) {
        console.error('Failed to load analytics', e);
        setError(e.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4E6E0" }}>
      <Container level={1} className="pt-12 pb-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-heading font-bold" style={{ color: "#4F5348" }}>Materials Analytics</h1>
          {loading && <p className="text-gray-700">Loading…</p>}
          {error && <p className="text-red-700">{error}</p>}
          {!loading && !error && data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Resumes" variant="elevated">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="py-2">Resume</th>
                      <th className="py-2">Used</th>
                      <th className="py-2">Offers</th>
                      <th className="py-2">Success %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.resumes || []).map((r) => {
                      const pct = r.used ? Math.round((r.offers / r.used) * 100) : 0;
                      return (
                        <tr key={r.id || r.name} className="border-t">
                          <td className="py-2">{r.name}</td>
                          <td className="py-2">{r.used}</td>
                          <td className="py-2">{r.offers}</td>
                          <td className="py-2">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
              <Card title="Cover Letters" variant="elevated">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="py-2">Cover Letter</th>
                      <th className="py-2">Used</th>
                      <th className="py-2">Offers</th>
                      <th className="py-2">Success %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.coverLetters || []).map((c) => {
                      const pct = c.used ? Math.round((c.offers / c.used) * 100) : 0;
                      return (
                        <tr key={c.id || c.name} className="border-t">
                          <td className="py-2">{c.name}</td>
                          <td className="py-2">{c.used}</td>
                          <td className="py-2">{c.offers}</td>
                          <td className="py-2">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
