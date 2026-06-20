import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { matchRepository } from '../repositories/match.repository.js';
import { statsRepository } from '../repositories/stats.repository.js';
import { tournamentRepository } from '../repositories/tournament.repository.js';
import { AppError } from '../utils/AppError.js';

const ACCENT = '#4f46e5';
const MUTED = '#6b7280';

function startDoc(res: Response, filename: string) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}

function header(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  doc.rect(0, 0, doc.page.width, 90).fill(ACCENT);
  doc.fillColor('#ffffff').fontSize(20).text('Sports League Platform', 48, 28);
  doc.fontSize(11).fillColor('#e0e7ff').text(title, 48, 56);
  if (subtitle) doc.fontSize(9).fillColor('#c7d2fe').text(subtitle, 48, 72);
  doc.moveDown(4).fillColor('#111827');
  doc.y = 110;
}

function table(doc: PDFKit.PDFDocument, columns: string[], rows: (string | number)[][], widths: number[]) {
  const startX = 48;
  let y = doc.y;
  doc.fontSize(9).fillColor(MUTED);
  let x = startX;
  columns.forEach((c, i) => { doc.text(c, x, y, { width: widths[i] }); x += widths[i]; });
  y += 16;
  doc.moveTo(startX, y - 4).lineTo(doc.page.width - 48, y - 4).strokeColor('#e5e7eb').stroke();
  doc.fillColor('#111827');
  rows.forEach((r) => {
    if (y > doc.page.height - 60) { doc.addPage(); y = 60; }
    x = startX;
    r.forEach((cell, i) => { doc.text(String(cell), x, y, { width: widths[i] }); x += widths[i]; });
    y += 16;
  });
  doc.y = y + 8;
}

async function tournamentOrThrow(id: number) {
  const t = await tournamentRepository.findById(id);
  if (!t) throw AppError.notFound('Tournament not found');
  return t;
}

export const reportService = {
  async fixtures(res: Response, tournamentId: number) {
    const t = await tournamentOrThrow(tournamentId);
    const matches = await matchRepository.list({ tournamentId });
    const doc = startDoc(res, `fixtures-${tournamentId}.pdf`);
    header(doc, `Fixtures — ${t.name}`, `${t.sport} · ${t.format}`);
    table(doc, ['#', 'Home', 'Away', 'Date', 'Venue', 'Status'],
      matches.map((m, i) => [
        i + 1, m.home_team ?? 'TBD', m.away_team ?? 'TBD',
        m.scheduled_at ?? '—', m.venue ?? '—', m.status,
      ]),
      [24, 110, 110, 95, 80, 60]);
    doc.end();
  },

  async results(res: Response, tournamentId: number) {
    const t = await tournamentOrThrow(tournamentId);
    const matches = (await matchRepository.list({ tournamentId })).filter((m) => m.status === 'COMPLETED');
    const doc = startDoc(res, `results-${tournamentId}.pdf`);
    header(doc, `Results — ${t.name}`, `${t.sport}`);
    table(doc, ['Home', 'Score', 'Away', 'Date'],
      matches.map((m) => [
        m.home_team ?? '', `${m.home_score} - ${m.away_score}`, m.away_team ?? '', m.scheduled_at ?? '—',
      ]),
      [150, 80, 150, 100]);
    doc.end();
  },

  async standings(res: Response, tournamentId: number) {
    const t = await tournamentOrThrow(tournamentId);
    const rows = await statsRepository.standings(tournamentId);
    const doc = startDoc(res, `standings-${tournamentId}.pdf`);
    header(doc, `Standings — ${t.name}`);
    table(doc, ['#', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'],
      rows.map((r, i) => [
        i + 1, r.team_name, r.played, r.wins, r.draws, r.losses,
        r.goals_for, r.goals_against, r.goal_diff, r.points,
      ]),
      [22, 150, 30, 30, 30, 30, 34, 34, 34, 36]);
    doc.end();
  },

  async playerStats(res: Response, tournamentId: number) {
    const t = await tournamentOrThrow(tournamentId);
    const rows = await statsRepository.playerStats(tournamentId);
    const doc = startDoc(res, `player-stats-${tournamentId}.pdf`);
    header(doc, `Player Statistics — ${t.name}`);
    table(doc, ['Player', 'Team', 'G', 'A', 'Pts', 'Runs', 'Wkts', 'YC', 'RC'],
      rows.map((r) => [
        r.player_name, r.team_name, r.goals, r.assists, r.points, r.runs, r.wickets, r.yellow_cards, r.red_cards,
      ]),
      [130, 120, 28, 28, 32, 38, 38, 28, 28]);
    doc.end();
  },

  async tournamentReport(res: Response, tournamentId: number) {
    const t = await tournamentOrThrow(tournamentId);
    const standings = await statsRepository.standings(tournamentId);
    const top = await statsRepository.topPlayers(tournamentId, 'goals', 5);
    const doc = startDoc(res, `tournament-report-${tournamentId}.pdf`);
    header(doc, `Tournament Report — ${t.name}`, `${t.sport} · ${t.format} · ${t.status}`);
    doc.fontSize(13).fillColor('#111827').text('Standings', 48).moveDown(0.3);
    table(doc, ['#', 'Team', 'P', 'W', 'D', 'L', 'Pts'],
      standings.map((r, i) => [i + 1, r.team_name, r.played, r.wins, r.draws, r.losses, r.points]),
      [22, 180, 40, 40, 40, 40, 50]);
    doc.moveDown(1).fontSize(13).text('Top Scorers').moveDown(0.3);
    table(doc, ['Player', 'Team', 'Goals'],
      top.map((p) => [p.player_name, p.team_name, p.metric_value]),
      [180, 180, 60]);
    doc.end();
  },

  async certificate(res: Response, tournamentId: number, teamName: string, title: string) {
    const t = await tournamentOrThrow(tournamentId);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate.pdf"`);
    doc.pipe(res);
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fafafa');
    doc.lineWidth(6).strokeColor(ACCENT)
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();
    doc.fillColor(ACCENT).fontSize(40).text('Certificate of Achievement', 0, 110, { align: 'center' });
    doc.fillColor('#111827').fontSize(16).text('This certificate is proudly presented to', 0, 190, { align: 'center' });
    doc.fillColor('#111827').fontSize(34).text(teamName, 0, 225, { align: 'center' });
    doc.fillColor(MUTED).fontSize(15)
      .text(`${title} — ${t.name} (${t.sport})`, 0, 285, { align: 'center' });
    doc.fontSize(12).fillColor(MUTED)
      .text(new Date().toLocaleDateString(), 0, 360, { align: 'center' });
    doc.end();
  },
};
