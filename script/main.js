// main.js

import { loadRicettario, renderGallery, renderCategories, allRicette, createAndAppendCard } from './ricettario.js';
import { renderSingleSezione, setSezioniData } from './sezioni.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- Selezione Elementi DOM ---
  const gallery = document.getElementById('gallery'); // Vecchia galleria
  const categoryList = document.getElementById('categoryList');
  const searchInput = document.getElementById('searchInput');
  // Rimuovi sezioniContainer se non lo usi più per il rendering iniziale
  // const sezioniContainer = document.getElementById("sezioniContainer");
  const menuToggle = document.getElementById('menuToggle');
  const menuOverlay = document.getElementById('menuOverlay');
  const allRecipesContainer = document.getElementById("allRecipesContainer"); // Nuovo contenitore
  const singleSezioneContainer = document.getElementById("singleSezioneContainer"); // Nuovo contenitore
  const showAllLiSelector = '#categoryList li[data-category-target="all"]'; // Selettore per "Mostra tutte"

  // Funzione per aggiornare l'interfaccia del ricettario
  const updateUI = () => {
    console.log("updateUI chiamata."); // Debug

    // Renderizza le categorie (include "Mostra tutte")
    renderCategories(
      categoryList,
      searchInput,
      // Callback per il filtro (ora potrebbe agire su #allRecipesContainer o #gallery)
      // Decidiamo cosa fare qui: per ora, lasciamo che filtri la vecchia galleria
      // o modifichiamo renderGallery per agire su #allRecipesContainer se vogliamo
      (filter, category) => {
          // Se filtriamo per categoria specifica, mostriamo la sezione singola
          if (category) {
              // Trova l'ID della categoria
               const targetLi = categoryList.querySelector(`li[data-category-name="${category}"]`);
               if (targetLi && targetLi.dataset.categoryId) {
                   showSingleSection(targetLi.dataset.categoryId);
                   setActiveCategory(targetLi); // Imposta attivo sulla categoria cliccata
               } else {
                   // Se non troviamo categoria specifica (es. ricerca testo), mostriamo tutto
                   showAllRecipesFiltered(filter); // Una nuova funzione per filtrare la vista "tutte"
                   setActiveCategory(null); // Nessuna categoria attiva
               }
          } else {
             // Se non c'è categoria (es. ricerca testo o click "Mostra tutte")
             showAllRecipesFiltered(filter); // Mostra tutte le ricette filtrate
             // Imposta "Mostra tutte" come attivo se il filtro è vuoto
             setActiveCategory(filter ? null : categoryList.querySelector(showAllLiSelector));
          }
      },
       // Callback per impostare la categoria attiva
       setActiveCategory // Passa la funzione direttamente
    );


    // Renderizza la vecchia galleria inizialmente (o nascondila)
    // renderGallery('', gallery); // Commenta se non la vuoi all'inizio
    gallery.classList.add('hidden'); // Nascondi la vecchia galleria

    // --- CHIAMATA INIZIALE PER MOSTRARE TUTTE LE RICETTE ---
    showAllRecipes(); // Mostra subito la vista "Tutte le ricette"
    // Imposta "Mostra tutte" come attivo nel menu
    const initialActiveLi = categoryList.querySelector(showAllLiSelector);
    if (initialActiveLi) {
       setActiveCategory(initialActiveLi);
    }

    // Aggiungi i listener per i click nel menu (già presenti, verifica)
    categoryList.querySelectorAll('li').forEach(li => {
        // Rimuovi eventuali listener duplicati prima di aggiungerne uno nuovo
        li.removeEventListener('click', handleCategoryClick); // Usa una funzione nominata
        li.addEventListener('click', handleCategoryClick); // Aggiungi il listener
    });

  }; // Fine updateUI

  // Funzione helper per gestire click su categorie
  function handleCategoryClick(event) {
       const li = event.currentTarget;
       const targetType = li.dataset.categoryTarget;
       const sectionId = li.dataset.categoryId; // ID per sezioni specifiche
       const categoryName = li.dataset.categoryName; // Nome per filtrare la vecchia gallery (se usata)

       console.log("Category click:", { targetType, sectionId, categoryName }); // Debug

       // Pulisci la ricerca quando si clicca una categoria
       if (searchInput) searchInput.value = '';

       setActiveCategory(li); // Imposta visivamente l'elemento attivo

       if (targetType === 'all') {
         showAllRecipes();
       } else if (targetType === 'specific' && sectionId) {
         showSingleSection(sectionId);
       } else {
           // Fallback: mostra tutte se qualcosa va storto
           console.warn("Azione categoria non riconosciuta o ID mancante, mostro tutte.");
           showAllRecipes();
       }

        // Chiudi menu mobile se aperto
       if (document.body.classList.contains('menu-open')) {
           toggleMobileMenu();
       }
  }


  // --- CARICAMENTO DATI ---
  // Carica ricettario e POI aggiorna l'interfaccia
  loadRicettario(updateUI);


 // --- GESTIONE RICERCA IN TEMPO REALE (AGGIORNATA) ---
 if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const searchTerm = searchInput.value;
        searchTimeout = setTimeout(() => {
            console.log("Ricerca per:", searchTerm); // Debug
            // Quando si cerca, mostra sempre la vista filtrata di tutte le ricette
            showAllRecipesFiltered(searchTerm);
            // Rimuovi la categoria attiva perché la ricerca sovrascrive il filtro categoria
            setActiveCategory(null);
        }, 300); // Debounce
    });
}


  // Caricamento sezioni.json (necessario per renderSingleSezione)
  fetch('sezioni.json')
      .then(response => {
          if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
          return response.json();
      })
      .then(data => {
          if (Array.isArray(data)) {
              setSezioniData(data); // Imposta i dati nel modulo sezioni.js
              console.log("Dati sezioni caricati.");
          } else {
              console.error("Formato dati sezioni.json non valido.");
          }
      })
      .catch(err => {
          console.error("Errore nel caricamento di sezioni.json:", err);
          // Potresti voler mostrare un errore all'utente qui
      });


  // --- MENU MOBILE ---
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMobileMenu);
  }
  if (menuOverlay) {
    menuOverlay.addEventListener('click', toggleMobileMenu);
  }

  function toggleMobileMenu() {
    const bodyElement = document.body;
    const isOpen = bodyElement.classList.toggle('menu-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
    // Gestisci overflow body in base allo stato del menu
    bodyElement.style.overflow = isOpen ? 'hidden' : '';
  }

  // --- FUNZIONE PER IMPOSTARE CATEGORIA ATTIVA (per disaccoppiare) ---
  function setActiveCategory(targetLi) {
    const categoryListElement = categoryList; // Usa variabile già definita
    if (!categoryListElement) return;

    // Rimuovi attivo da tutti
    categoryListElement.querySelectorAll('li').forEach(li => li.classList.remove('active-category'));
    categoryListElement.classList.remove('river-active'); // Nascondi sempre river inizialmente

    if (targetLi) {
        targetLi.classList.add('active-category');

        // Calcola e mostra river solo se NON è "Mostra tutte"
        if (targetLi.dataset.categoryTarget !== 'all') {
            requestAnimationFrame(() => {
                const offsetTop = targetLi.offsetTop;
                const liHeight = targetLi.offsetHeight;
                categoryListElement.style.setProperty('--river-offset', `${offsetTop}px`);
                categoryListElement.style.setProperty('--sidebar-li-height', `${liHeight}px`);
                categoryListElement.classList.add('river-active');
            });
        }
    }
  }

}); // Fine DOMContentLoaded

// =============================================
// FUNZIONI DI VISUALIZZAZIONE CONTENUTO
// =============================================

// Mostra la vista "Tutte le ricette" (non filtrata)
function showAllRecipes() {
  console.log("Mostro tutte le ricette (non filtrate)"); // Debug
  const allRecipesContainer = document.getElementById("allRecipesContainer");
  const singleSezioneContainer = document.getElementById("singleSezioneContainer");
  const gallery = document.getElementById('gallery'); // Vecchia galleria

  singleSezioneContainer.classList.add("hidden"); // Nascondi sezione singola
  gallery.classList.add('hidden'); // Nascondi vecchia galleria
  allRecipesContainer.classList.remove("hidden"); // Mostra contenitore "tutte"

  renderAllRecipes(allRecipesContainer); // Chiama la funzione che popola il contenitore
}

// Mostra la vista "Tutte le ricette" FILTRATA per termine di ricerca
function showAllRecipesFiltered(filter = '') {
    console.log(`Mostro tutte le ricette filtrate per: "${filter}"`); // Debug
    const allRecipesContainer = document.getElementById("allRecipesContainer");
    const singleSezioneContainer = document.getElementById("singleSezioneContainer");
    const gallery = document.getElementById('gallery');

    singleSezioneContainer.classList.add("hidden");
    gallery.classList.add('hidden');
    allRecipesContainer.classList.remove("hidden");

    renderAllRecipes(allRecipesContainer, filter); // Passa il filtro alla funzione di rendering
}


// Mostra la vista "Sezione Singola"
function showSingleSection(sectionId) {
  console.log(`Mostro sezione singola: ${sectionId}`); // Debug
  const allRecipesContainer = document.getElementById("allRecipesContainer");
  const singleSezioneContainer = document.getElementById("singleSezioneContainer");
  const gallery = document.getElementById('gallery');

  allRecipesContainer.classList.add("hidden"); // Nascondi "tutte"
  gallery.classList.add('hidden'); // Nascondi vecchia galleria
  singleSezioneContainer.classList.remove("hidden"); // Mostra contenitore sezione singola

  renderSingleSezione(sectionId); // Chiama funzione che popola il contenitore sezione
}

// Renderizza TUTTE le ricette nel container specificato, applicando un filtro opzionale
function renderAllRecipes(container, filter = '') {
  container.innerHTML = ''; // Svuota il contenitore
  const lowerCaseFilter = filter.toLowerCase().trim();

  const ricetteDaRenderizzare = allRicette.filter(ricetta =>
        !lowerCaseFilter || // Se non c'è filtro, includi tutto
        ricetta.nome.toLowerCase().includes(lowerCaseFilter) ||
        (ricetta.descrizione && ricetta.descrizione.toLowerCase().includes(lowerCaseFilter)) ||
        ricetta.categoria.toLowerCase().includes(lowerCaseFilter)
        // Aggiungere eventuale ricerca in ingredienti qui se necessario
  );

  if (ricetteDaRenderizzare.length > 0) {
    const fragment = document.createDocumentFragment();
    ricetteDaRenderizzare.forEach(ricetta => {
      const card = createAndAppendCard(ricetta); // Funzione da ricettario.js
      fragment.appendChild(card);
    });
    container.appendChild(fragment);
  } else {
    container.innerHTML = `<p class="gallery-empty-message">Nessuna ricetta trovata ${filter ? 'per "' + filter + '"' : ''}.</p>`; // Messaggio più specifico
  }
}

// NB: La funzione createRicettaCard ausiliaria non serve più se usi createAndAppendCard da ricettario.js