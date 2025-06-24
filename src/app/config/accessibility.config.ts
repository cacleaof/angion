export const AccessibilityConfig = {
  // Configurações de foco
  focus: {
    // Tempo de espera para configurar acessibilidade após renderização
    setupDelay: 100,
    // Seletores de elementos visíveis para receber foco
    visibleSelectors: [
      'ion-header',
      'ion-toolbar',
      'ion-content',
      'ion-button:not([aria-hidden="true"])',
      'ion-input:not([aria-hidden="true"])',
      'ion-textarea:not([aria-hidden="true"])',
      'ion-select:not([aria-hidden="true"])'
    ]
  },

  // Configurações de aria-labels padrão
  ariaLabels: {
    buttons: {
      home: 'Voltar para Home',
      add: 'Adicionar novo item',
      edit: 'Editar item',
      delete: 'Deletar item',
      save: 'Salvar',
      cancel: 'Cancelar',
      update: 'Atualizar',
      refresh: 'Atualizar lista',
      back: 'Voltar',
      pay: 'Pagar',
      unmark: 'Desmarcar',
      markCompleted: 'Marcar como concluído',
      deleteSelected: 'Deletar selecionados',
      selectAll: 'Selecionar todos',
      deselectAll: 'Desmarcar todos'
    }
  },

  // Configurações de navegação por teclado
  keyboard: {
    // Teclas de atalho
    shortcuts: {
      escape: 'Escape',
      enter: 'Enter',
      space: 'Space',
      tab: 'Tab'
    }
  },

  // Configurações de contraste
  contrast: {
    // Cores de alto contraste
    highContrast: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#ff6b35'
    }
  }
};
