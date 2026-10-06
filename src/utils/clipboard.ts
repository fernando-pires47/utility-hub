export const copyToClipboard = async (
  text: string,
  container: HTMLElement = document.body,
): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      const previousFocus = document.activeElement;
      container.appendChild(textArea);
      try {
        textArea.focus();
        textArea.select();
        return document.execCommand('copy');
      } finally {
        textArea.remove();
        if (previousFocus instanceof HTMLElement) previousFocus.focus();
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
