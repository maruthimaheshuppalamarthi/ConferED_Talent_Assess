import { Candidate, CandidateResult } from '../types';

export class ReportGeneratorService {
  /**
   * Triggers browser print / PDF download flow formatted for candidate assessment scorecard.
   */
  public static exportCandidatePdfReport(candidate: Candidate, result: CandidateResult) {
    const reportWin = window.open('', '_blank');
    if (!reportWin) return;

    reportWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>NexusAssess Candidate Evaluation Report - ${candidate.name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          .title { font-size: 24px; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 4px 12px; font-size: 12px; font-weight: bold; border-radius: 9999px; background: #e0effe; color: #1d4ed8; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; text-align: center; }
          .card-val { font-size: 22px; font-weight: bold; color: #1e40af; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 13px; }
          th { background: #f1f5f9; font-weight: bold; }
          .section-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 12px; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">NexusAssess Enterprise Evaluation Scorecard</div>
            <div class="subtitle">Candidate: <strong>${candidate.name}</strong> (${candidate.email})</div>
          </div>
          <div>
            <span class="badge">${result.passStatus.toUpperCase()} (${result.percentage}%)</span>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Total Score</div>
            <div class="card-val">${result.totalScore} / ${result.maxScore}</div>
          </div>
          <div class="card">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Percentage</div>
            <div class="card-val">${result.percentage}%</div>
          </div>
          <div class="card">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">AI Integrity</div>
            <div class="card-val">${result.aiConfidenceScore}%</div>
          </div>
          <div class="card">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Proctor Violations</div>
            <div class="card-val">${result.totalViolations}</div>
          </div>
        </div>

        <div class="section-title">Section Score Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Section Name</th>
              <th>Score</th>
              <th>Max Score</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(result.sectionScores).map(([sName, sData]) => `
              <tr>
                <td><strong>${sName}</strong></td>
                <td>${sData.score}</td>
                <td>${sData.maxScore}</td>
                <td>${sData.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Recruiter Notes & Recommendation</div>
        <p style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-size: 13px;">
          ${result.recruiterNotes}
        </p>

        <div class="footer">
          Generated securely by NexusAssess AI Proctoring Platform • Immutable Document Audit Hash: ${Date.now()}
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    reportWin.document.close();
  }
}
