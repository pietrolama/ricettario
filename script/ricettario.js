import { createElement, generateImageFilename } from './utils.js';
import { openModal } from './modal.js';

export let ricettarioData = null;
export let allRicette = [];

export function loadRicettario(updateUI) {
  fetch('ricettario.json')
    .then(response => {
      if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
      return response.json();
    })
    .then(data => {
      ricettarioData = data;
      processRicette();
      updateUI();
    })
    .catch(error => {
      console.error('Errore caricamento ricettario.json:', error);
    });
}

export function processRicette() {
  allRicette = [];
  if (!ricettarioData?.categorie) return;
  ricettarioData.categorie.forEach(categoria => {
    if (Array.isArray(categoria.ricette)) {
      categoria.ricette.forEach(ricetta => {
        allRicette.push({ ...ricetta, categoria: categoria.nome });
      });
    }
  });
}

export function renderGallery(filter = '', galleryElement) {
  if (!galleryElement) return;
  requestAnimationFrame(() => {
    galleryElement.innerHTML = '';
    const lowerCaseFilter = filter.toLowerCase().trim();
    const filteredRicette = allRicette.filter(ricetta =>
      !filter ||
      ricetta.nome.toLowerCase().includes(lowerCaseFilter) ||
      (ricetta.descrizione && ricetta.descrizione.toLowerCase().includes(lowerCaseFilter)) ||
      ricetta.categoria.toLowerCase().includes(lowerCaseFilter)
    );

    if (filteredRicette.length === 0) {
      galleryElement.innerHTML = '<p class="gallery-empty-message">Nessuna ricetta trovata.</p>';
    } else {
      const fragment = document.createDocumentFragment();
      filteredRicette.forEach(ricetta => fragment.appendChild(createAndAppendCard(ricetta)));
      galleryElement.appendChild(fragment);
    }
  });
}

export function createAndAppendCard(ricetta) {
  const card = createElement('div', 'card');
  const imageFilename = generateImageFilename(ricetta.nome);
  const imageUrl = `img/${imageFilename}.jpeg`;
  card.style.setProperty('--card-bg-image', `url('${imageUrl}')`);
  card.classList.add('card-has-image');

  const contentWrapper = createElement('div', 'card-content-wrapper');
  const title = createElement('h3', null, ricetta.nome);
  const description = createElement('p', null, ricetta.descrizione || '');
  const categoryTag = createElement('span', 'category-tag', ricetta.categoria);
  contentWrapper.appendChild(title);
  contentWrapper.appendChild(description);
  contentWrapper.appendChild(categoryTag);
  card.appendChild(contentWrapper);

  card.addEventListener('click', () => {
    // Recupera gli elementi in questo contesto
    const modal = document.getElementById('recipeModal');
    const modalContent = document.getElementById('modalContent');
    const bodyElement = document.body;

    openModal(
      ricetta,
      modal,
      modalContent,
      bodyElement
    );
  });
  return card;
}


export function renderCategories(categoryListElement, searchInput, renderGalleryCallback, setActiveCategoryCallback) {
  if (!categoryListElement || !ricettarioData?.categorie) return;
  const fragment = document.createDocumentFragment();

  const showAllLi = createElement('li', null, 'Mostra tutte');
  showAllLi.dataset.categoryTarget = 'all';
  showAllLi.setAttribute('role', 'button');
  showAllLi.tabIndex = 0;
  showAllLi.addEventListener('click', (e) => {
    setActiveCategoryCallback(e.currentTarget);
    if (searchInput) searchInput.value = '';
    renderGalleryCallback('');
  });
  fragment.appendChild(showAllLi);

  ricettarioData.categorie.forEach(categoria => {
    const li = createElement('li', null, categoria.nome);
    li.dataset.categoryId = categoria.id;
    li.dataset.categoryName = categoria.nome;
    li.dataset.categoryTarget = 'specific';
    li.setAttribute('role', 'button');
    li.tabIndex = 0;
    li.addEventListener('click', (e) => {
      setActiveCategoryCallback(e.currentTarget);
      renderGalleryCallback(categoria.nome);
    });
    fragment.appendChild(li);
  });

  categoryListElement.innerHTML = '';
  categoryListElement.appendChild(fragment);
}
