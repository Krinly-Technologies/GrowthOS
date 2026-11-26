'use client';

import { useMemo } from 'react';
import { buildConversation, type Conversation, filterConversations, type InboxTab } from './inbox';
import { VIEWER } from './sample/scenario';
import { usePreview } from './store';
import { useInboxQuery } from './url-state';

// One view-model for the Inbox, the same shape as `useCrmModel`: everything on screen comes from
// this one hook, every mutation goes out through the page's `actions`.

export function useInboxModel() {
  const { state, dispatch } = usePreview();
  const { query, setQuery } = useInboxQuery();
  const { data, now, inboxAssignee, inboxClosed, inboxReadAt, inboxSuggestion } = state;

  const conversations = useMemo(() => {
    const list: Conversation[] = data.leads.map((lead) =>
      buildConversation(lead, data, {
        assignee: inboxAssignee[lead.id] ?? lead.owner,
        closed: inboxClosed[lead.id] ?? false,
        readAt: inboxReadAt[lead.id] ?? 0,
        suggestionVersion: inboxSuggestion[lead.id]?.version ?? 0,
        suggestionStatus: inboxSuggestion[lead.id]?.status ?? 'open',
      }),
    );
    return list.sort((a, b) => b.lastAt - a.lastAt);
  }, [data, inboxAssignee, inboxClosed, inboxReadAt, inboxSuggestion]);

  const byLeadId = useMemo(
    () => new Map(conversations.map((c) => [c.lead.id, c])),
    [conversations],
  );

  const counts = useMemo(() => {
    const tabs: InboxTab[] = ['all', 'mine', 'unassigned', 'needs_review', 'closed'];
    return Object.fromEntries(
      tabs.map((tab) => [
        tab,
        conversations.filter((c) => filterConversations([c], { tab, q: '' }, VIEWER).length > 0)
          .length,
      ]),
    ) as Record<InboxTab, number>;
  }, [conversations]);

  const filtered = useMemo(
    () => filterConversations(conversations, { tab: query.tab, q: query.q }, VIEWER),
    [conversations, query.tab, query.q],
  );

  const unreadCount = useMemo(
    () => conversations.filter((c) => c.unread && !c.closed).length,
    [conversations],
  );

  const selected = query.conversation ? byLeadId.get(query.conversation) : undefined;

  const openConversation = (leadId: string) => {
    setQuery({ conversation: leadId }, 'push');
    dispatch({ type: 'openConversation', leadId });
  };
  const closeConversation = () => {
    setQuery({ conversation: null }, 'replace');
  };

  return {
    now,
    data,
    conversations,
    filtered,
    counts,
    unreadCount,
    byLeadId,
    query,
    setQuery,
    selected,
    openConversation,
    closeConversation,
    viewer: VIEWER,
  };
}

export type InboxModel = ReturnType<typeof useInboxModel>;
