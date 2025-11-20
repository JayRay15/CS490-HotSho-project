import React from 'react';
import Card from '../Card';

export default function ContactStatsCards({ stats, onRefresh }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-blue-50">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-sm text-gray-600">Total Contacts</p>
        </div>
      </Card>
      <Card className="bg-green-50">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{stats.recentInteractions}</p>
          <p className="text-sm text-gray-600">Recent Interactions</p>
        </div>
      </Card>
      <Card className="bg-purple-50">
        <div className="text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.withUpcomingFollowUps}</p>
          <p className="text-sm text-gray-600">Upcoming Follow-ups</p>
        </div>
      </Card>
      <Card className="bg-orange-50">
        <div className="text-center">
          <p className="text-3xl font-bold text-orange-600">{stats.byRelationshipStrength?.Strong || 0}</p>
          <p className="text-sm text-gray-600">Strong Connections</p>
        </div>
      </Card>
    </div>
  );
}
