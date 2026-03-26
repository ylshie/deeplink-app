import { fetchApi } from './config';

/**
 * Fetch agent list.
 * GET /agents
 */
export async function getAgents() {
  return fetchApi('/agents');
}

/**
 * Fetch team list.
 * GET /teams
 */
export async function getTeams() {
  return fetchApi('/teams');
}
