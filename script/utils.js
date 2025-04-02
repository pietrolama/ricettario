export function createElement(tag, className, textContent, attributes) {
    const element = document.createElement(tag);
    if (className) {
      className.split(' ').forEach(cls => {
        if (cls.trim()) element.classList.add(cls.trim());
      });
    }
    if (textContent) element.textContent = textContent;
    if (attributes) {
      for (const key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
          element.setAttribute(key, attributes[key]);
        }
      }
    }
    return element;
  }
  
  export function generateImageFilename(recipeName) {
    if (!recipeName) return 'default_placeholder';
    return recipeName
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_*|_*$/g, '');
  }
  