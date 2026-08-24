import React from 'react';
import { UI_COLORS } from '../styles/theme';
import type { Issue } from '../types';

interface IssueTableProps {
  issues: Issue[];
  onRowClick: (issue: Issue) => void;
}

export const IssueTable: React.FC<IssueTableProps> = ({ issues, onRowClick }) => {
  return (
    <div style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${UI_COLORS.border}`, textAlign: 'left' }}>
            <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '80px' }}>KEY</th>
            <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px' }}>SUMMARY</th>
            <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '120px' }}>TYPE</th>
            <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '140px' }}>STATUS</th>
            <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '120px' }}>PRIORITY</th>
            <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '180px' }}>REPORTER</th>
            <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '180px' }}>ASSIGNEE</th>
          </tr>
        </thead>
        <tbody>
          {issues.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', fontStyle: 'italic', color: UI_COLORS.textMuted }}>Nessuna issue trovata.</td></tr>
          ) : (
            issues.map(issue => (
              <tr 
                key={issue.id} 
                onClick={() => onRowClick(issue)} 
                style={{ borderBottom: `1px solid ${UI_COLORS.border}`, cursor: 'pointer', transition: 'background-color 0.1s' }} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '16px 24px', color: UI_COLORS.textMuted, fontSize: '13px' }}>ID-{issue.id}</td>
                <td style={{ padding: '16px 24px', whiteSpace: 'normal', wordBreak: 'break-word', color: UI_COLORS.primary, fontWeight: '500' }}>{issue.title}</td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ backgroundColor: UI_COLORS.badgeTypeBg, color: UI_COLORS.badgeTypeText, padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>{issue.type}</span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ backgroundColor: UI_COLORS.badgeStatusBg, color: UI_COLORS.badgeStatusText, padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>{issue.status}</span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {issue.priority && (
                    <span style={{ backgroundColor: issue.priority === 'HIGH' ? UI_COLORS.badgeHighBg : issue.priority === 'MEDIUM' ? UI_COLORS.badgeMedBg : UI_COLORS.badgeLowBg, color: issue.priority === 'HIGH' ? UI_COLORS.badgeHighText : issue.priority === 'MEDIUM' ? UI_COLORS.badgeMedText : UI_COLORS.badgeLowText, padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>
                      {issue.priority}
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 24px', color: UI_COLORS.textPrimary, fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {issue.reporter ? (
                        <>
                          {issue.reporter.avatarUrl ? ( <img src={issue.reporter.avatarUrl} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> ) : ( <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: UI_COLORS.background, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>{(issue.reporter.fullName || issue.reporter.email).charAt(0).toUpperCase()}</div> )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.reporter.fullName || issue.reporter.email.split('@')[0]}</span>
                        </>
                      ) : ( <span style={{ color: UI_COLORS.textMuted, fontStyle: 'italic' }}>System</span> )}
                    </div>
                </td>
                <td style={{ padding: '16px 24px', color: UI_COLORS.textPrimary, fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {issue.assignee ? (
                        <>
                          {issue.assignee.avatarUrl ? ( <img src={issue.assignee.avatarUrl} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> ) : ( <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: UI_COLORS.background, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>{(issue.assignee.fullName || issue.assignee.email).charAt(0).toUpperCase()}</div> )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.assignee.fullName || issue.assignee.email.split('@')[0]}</span>
                        </>
                      ) : ( <span style={{ color: UI_COLORS.textMuted, fontStyle: 'italic' }}>Unassigned</span> )}
                    </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};