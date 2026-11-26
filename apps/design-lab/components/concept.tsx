'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { Concept } from '@/lib/store';

// Overlays (dialogs, menus, popovers) render in a portal outside the concept's DOM subtree, so
// they read the concept here and re-apply `data-concept` to pick up its tokens and fonts.

const ConceptContext = createContext<Concept | null>(null);

export function ConceptProvider({ concept, children }: { concept: Concept; children: ReactNode }) {
  return <ConceptContext value={concept}>{children}</ConceptContext>;
}

export function useConcept(): Concept | null {
  return useContext(ConceptContext);
}

/** Props that re-apply the concept scope to portalled content. */
export function useConceptScope(): { 'data-concept'?: 'a' | 'b' } {
  const concept = useConcept();
  // The refined Growth Studio (g) wears Concept B's styles.
  return concept ? { 'data-concept': concept === 'g' ? 'b' : concept } : {};
}
