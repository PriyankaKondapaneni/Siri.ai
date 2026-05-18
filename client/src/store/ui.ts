import { create } from 'zustand';

type UIState = {
  sidebarOpen: boolean;
  focusOpen: boolean;
  activeTab: 'chat' | 'quicknote';
  conversationsExpanded: boolean;
  knowledgeExpanded: boolean;
  tasksVersion: number;
  toggleSidebar: () => void;
  toggleFocus: () => void;
  setActiveTab: (t: 'chat' | 'quicknote') => void;
  toggleConversations: () => void;
  toggleKnowledge: () => void;
  bumpTasks: () => void;
};

export const useUI = create<UIState>((set) => ({
  sidebarOpen: true,
  focusOpen: true,
  activeTab: 'chat',
  conversationsExpanded: true,
  knowledgeExpanded: true,
  tasksVersion: 0,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleFocus: () => set((s) => ({ focusOpen: !s.focusOpen })),
  setActiveTab: (t) => set({ activeTab: t }),
  toggleConversations: () => set((s) => ({ conversationsExpanded: !s.conversationsExpanded })),
  toggleKnowledge: () => set((s) => ({ knowledgeExpanded: !s.knowledgeExpanded })),
  bumpTasks: () => set((s) => ({ tasksVersion: s.tasksVersion + 1 })),
}));
