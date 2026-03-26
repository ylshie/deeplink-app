import { fetchApi } from './config';

/**
 * Fetch team chat history (agents + messages).
 * GET /teams/:id/messages
 */
export async function getTeamChat(teamId) {
  return fetchApi(`/teams/${teamId}/messages`);
}

/**
 * Fetch agent 1-on-1 chat history.
 * GET /agents/:id/messages
 */
export async function getAgentChat(agentId) {
  return fetchApi(`/agents/${agentId}/messages`);
}

/**
 * Send message to a 1-on-1 agent conversation.
 * POST /agents/:id/chat
 * Returns { userMessage, agentMessage }
 */
export async function sendAgentMessage(agentId, text) {
  return fetchApi(`/agents/${agentId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/**
 * Send message to a team (multi-agent debate).
 * POST /teams/:id/chat
 * Returns { userMessage, agentMessages[], debate }
 */
export async function sendTeamMessage(teamId, text) {
  return fetchApi(`/teams/${teamId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
