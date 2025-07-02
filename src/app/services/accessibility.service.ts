import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { AccessibilityConfig } from '../config/accessibility.config';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {

  constructor(private platform: Platform) {
    this.initializeAccessibility();
  }

  private initializeAccessibility() {
    this.platform.ready().then(() => {
      this.setupFocusManagement();
      this.setupAriaHiddenHandling();
      this.setupKeyboardNavigation();
    });
  }

  private setupFocusManagement() {
    // Monitorar mudanças de foco
    document.addEventListener('focusin', (event) => {
      this.handleFocusIn(event);
    });

    // Limpar foco quando páginas são ocultadas
    document.addEventListener('ionViewDidLeave', () => {
      this.clearFocus();
    });

    // Limpar foco quando modais são fechados
    document.addEventListener('ionModalDidDismiss', () => {
      this.clearFocus();
    });
  }

  private setupAriaHiddenHandling() {
    // Observar mudanças no DOM para detectar elementos com aria-hidden
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const target = mutation.target as HTMLElement;
          if (target.getAttribute('aria-hidden') === 'true') {
            this.handleAriaHiddenElement(target);
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-hidden'],
      subtree: true
    });
  }

  private setupKeyboardNavigation() {
    // Adicionar navegação por teclado
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardNavigation(event);
    });
  }

  private handleFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    const ancestorWithAriaHidden = target.closest('[aria-hidden="true"]');

    if (ancestorWithAriaHidden) {
      // Prevenir foco em elementos ocultos
      event.preventDefault();
      event.stopPropagation();

      // Mover foco para um elemento visível
      this.moveFocusToVisibleElement();
    }
  }

  private handleAriaHiddenElement(element: HTMLElement) {
    // Verificar se há elementos com foco dentro do elemento oculto
    const focusedElement = element.querySelector(':focus') as HTMLElement;
    if (focusedElement) {
      focusedElement.blur();
      this.moveFocusToVisibleElement();
    }
  }

  private moveFocusToVisibleElement() {
    // Encontrar um elemento visível para receber o foco usando a configuração
    for (const selector of AccessibilityConfig.focus.visibleSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element && this.isElementVisible(element)) {
        element.focus();
        break;
      }
    }
  }

  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           element.offsetParent !== null &&
           element.getAttribute('aria-hidden') !== 'true';
  }

  private clearFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.classList.contains('button-native')) {
      activeElement.blur();
    }
  }

  private handleKeyboardNavigation(event: KeyboardEvent) {
    // Implementar navegação por teclado se necessário
    switch (event.key) {
      case 'Escape':
        // Fechar modais ou voltar
        this.handleEscapeKey();
        break;
      case 'Enter':
      case ' ':
        // Ativar elementos focados
        this.handleActivationKey(event);
        break;
    }
  }

  private handleEscapeKey() {
    // Fechar modais abertos
    const modals = document.querySelectorAll('ion-modal[isOpen="true"]');
    if (modals.length > 0) {
      const lastModal = modals[modals.length - 1] as any;
      if (lastModal.dismiss) {
        lastModal.dismiss();
      }
    }
  }

  private handleActivationKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    
    // Permitir todos os elementos de input funcionarem normalmente
    if (target.tagName === 'ION-INPUT' || 
        target.tagName === 'ION-TEXTAREA' || 
        target.tagName === 'ION-SELECT' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA') {
      return; // Não interferir com inputs
    }
    
    if (target.tagName === 'ION-BUTTON' || target.closest('ion-button')) {
      // Permitir ativação de botões por teclado
      return;
    }

    // Prevenir comportamento padrão apenas para elementos não-interativos
    if (target.contentEditable !== 'true' && !target.isContentEditable) {
      event.preventDefault();
    }
  }

  // Método público para configurar acessibilidade em componentes
  public setupComponentAccessibility() {
    setTimeout(() => {
      this.setupButtonsAccessibility();
    }, AccessibilityConfig.focus.setupDelay);
  }

  private setupButtonsAccessibility() {
    const buttons = document.querySelectorAll('ion-button');
    buttons.forEach(button => {
      if (!button.getAttribute('aria-label')) {
        const text = button.textContent?.trim();
        if (text) {
          button.setAttribute('aria-label', text);
        }
      }
    });
  }

  // Método para limpar foco ao sair de uma página
  public clearFocusOnDestroy() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }
  }

  // Método para obter aria-label padrão
  public getAriaLabel(type: string, context?: string): string {
    const labels = AccessibilityConfig.ariaLabels;

    switch (type) {
      case 'button':
        return labels.buttons[context as keyof typeof labels.buttons] || context || '';
      default:
        return context || '';
    }
  }
}
