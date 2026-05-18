import { create } from 'zustand';

type UIState = {
  aiPanelOpen: boolean;
  commandOpen: boolean;
  setAiPanelOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  toggleAiPanel: () => void;
  toggleCommand: () => void;
};

export const useUI = create<UIState>((set) => ({
  aiPanelOpen: true,
  commandOpen: false,
  setAiPanelOpen: (v) => set({ aiPanelOpen: v }),
  setCommandOpen: (v) => set({ commandOpen: v }),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
}));
