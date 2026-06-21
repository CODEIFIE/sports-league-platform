import { api } from './api';

export const scoring = {
  cricketSetup: (id: number, battingTeamId: number, oversLimit: number) =>
    api.post(`/scoring/cricket/${id}/setup`, { battingTeamId, oversLimit }),
  cricketBall: (id: number, outcome: { runs?: number; wicket?: boolean; extra?: 'wide' | 'noball'; dismissal?: string }) =>
    api.post(`/scoring/cricket/${id}/ball`, outcome),
  cricketBatsman: (id: number, playerId: number) =>
    api.post(`/scoring/cricket/${id}/batsman`, { playerId }),
  cricketBowler: (id: number, playerId: number) =>
    api.post(`/scoring/cricket/${id}/bowler`, { playerId }),
  cricketEndInnings: (id: number) => api.post(`/scoring/cricket/${id}/end-innings`),
  footballSetup: (id: number) => api.post(`/scoring/football/${id}/setup`),
  footballGoal: (id: number, body: { teamId: number; playerId: number; assistId?: number | null; minute: number }) =>
    api.post(`/scoring/football/${id}/goal`, body),
  footballCard: (id: number, body: { teamId: number; playerId: number; type: 'YELLOW' | 'RED'; minute: number }) =>
    api.post(`/scoring/football/${id}/card`, body),
  footballClock: (id: number, minute: number) => api.post(`/scoring/football/${id}/clock`, { minute }),
  endMatch: (id: number) => api.post(`/scoring/${id}/end`),
};
