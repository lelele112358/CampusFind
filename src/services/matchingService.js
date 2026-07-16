'use strict';

const { withTransaction } = require('../config/database');
const lostReports = require('../repositories/lostReportRepository');
const foundItems = require('../repositories/foundItemRepository');
const matches = require('../repositories/matchRepository');

const STOP_WORDS = new Set(['a', 'an', 'and', 'the', 'with', 'in', 'at', 'of', 'to', 'my', 'item']);

function tokens(value) {
  return new Set(
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
  );
}

function jaccard(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function dateScore(dateLost, dateFound) {
  const left = new Date(dateLost).getTime();
  const right = new Date(dateFound).getTime();
  if (Number.isNaN(left) || Number.isNaN(right) || right < left) return 0;
  const days = Math.floor((right - left) / 86400000);
  if (days <= 1) return 10;
  if (days <= 3) return 8;
  if (days <= 7) return 5;
  if (days <= 14) return 2;
  return 0;
}

function calculateMatchScore(lostReport, foundItem) {
  let score = 0;
  if (lostReport.itemCategory === foundItem.itemCategory) score += 45;
  score += Math.round(jaccard(lostReport.itemName, foundItem.itemTitle) * 30);
  score += Math.round(jaccard(lostReport.lastKnownLocation, foundItem.foundLocation) * 15);
  score += dateScore(lostReport.dateLost, foundItem.dateFound);
  return Math.min(100, score);
}

function similarityFromScore(score) {
  if (score >= 75) return 'high';
  if (score >= 58) return 'medium';
  if (score >= 45) return 'low';
  return 'manual review';
}

async function createPossibleMatches(foundItem) {
  return withTransaction(async (client) => {
    const candidates = await lostReports.findMatchCandidates(
      { itemCategory: foundItem.itemCategory, dateFound: foundItem.dateFound },
      client
    );

    const created = [];
    for (const lostReport of candidates) {
      const score = calculateMatchScore(lostReport, foundItem);
      if (score < 45) continue;

      const match = await matches.insertCandidate(
        {
          lostReportId: lostReport.id,
          foundItemId: foundItem.id,
          score,
          similarity: similarityFromScore(score)
        },
        client
      );

      if (!match) continue;
      created.push(match);
      if (lostReport.status === 'Open') {
        await lostReports.updateStatus(lostReport.id, 'Matched', client);
      }
    }

    if (created.length && foundItem.status === 'In Holding') {
      await foundItems.updateStatus(foundItem.id, 'Matched', client);
      foundItem.status = 'Matched';
    }

    return created;
  });
}

module.exports = { tokens, jaccard, calculateMatchScore, similarityFromScore, createPossibleMatches };
