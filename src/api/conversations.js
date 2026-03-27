import { fetchApi } from './config';

export async function getAgents() {
  return fetchApi('/agents');
}

export async function getTeams() {
  return fetchApi('/teams');
}

export async function deleteAgent(agentId) {
  return fetchApi(`/agents/${agentId}`, { method: 'DELETE' });
}

export async function deleteTeam(teamId) {
  return fetchApi(`/teams/${teamId}`, { method: 'DELETE' });
}
