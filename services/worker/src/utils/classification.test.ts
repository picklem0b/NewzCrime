/**
 * Topic classification tests.
 *
 * The heuristic decides which filter an item appears under, so these assert
 * the precedence rules and the deliberate `null` fallback, not just happy-path
 * keyword hits.
 */

import { describe, expect, it } from 'vitest';

import { classifyTopic } from './classification';

describe('classifyTopic', () => {
  it('classifies crime from the title', () => {
    expect(classifyTopic('Man arrested after Soweto hijacking', null)).toBe(
      'crime'
    );
  });

  it('classifies court from the title', () => {
    expect(classifyTopic('Court hands down judgment in bail appeal', null)).toBe(
      'court'
    );
  });

  it('classifies politics and world', () => {
    expect(classifyTopic('Parliament passes new bill', null)).toBe('politics');
    expect(classifyTopic('Fighting continues in Ukraine', null)).toBe('world');
  });

  it('reads the excerpt when the title alone says nothing', () => {
    expect(
      classifyTopic('Update on the matter', 'The magistrate sentenced him today.')
    ).toBe('court');
  });

  it('is case-insensitive', () => {
    expect(classifyTopic('POLICE ARREST SUSPECT', null)).toBe('crime');
  });

  it('gives court precedence over crime when both match', () => {
    // "court" is checked before "police"; a story about a police officer on
    // trial is a court story first.
    expect(classifyTopic('Police officer in court on fraud charges', null)).toBe(
      'court'
    );
  });

  it('returns null when nothing matches, rather than guessing', () => {
    expect(classifyTopic('A quiet day in the garden', null)).toBeNull();
    expect(classifyTopic('Recipe for bobotie', 'Serve with rice.')).toBeNull();
  });

  it('handles a null excerpt', () => {
    expect(classifyTopic('Armed robbery at mall', null)).toBe('crime');
  });
});
