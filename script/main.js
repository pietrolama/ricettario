// main.js - Versione Completa e Riorganizzata

// --- Importazioni Moduli ---
// Assicurati che i percorsi siano corretti e che le funzioni esportate esistano
import { loadRicettario, allRicette, createAndAppendCard, renderCategories } from './ricettario.js';
import { setSezioniData, renderSingleSezione } from './sezioni.js';
// Nota: openModal e closeModal sono usate internamente da createAndAppendCard e non serve importarle qui,
// a meno che non le chiami direttamente da main.js (cosa che non stiamo facendo).
// Utils potrebbe non essere necessario importarlo qui se usato solo dagli altri moduli.
// import { createElement } from './utils.js';

// --- Event Listener Principale: DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Caricato. Avvio Ricettario Interattivo.");

    // --- Selezione Elementi DOM Principali ---
    const gallery = document.getElementById('gallery');                     // Vecchia galleria (ora nascosta)
    const categoryList = document.getElementById('categoryList');           // Lista categorie sidebar
    const searchInput = document.getElementById('searchInput');             // Barra di ricerca
    const menuToggle = document.getElementById('menuToggle');               // Bottone hamburger
    const menuOverlay = document.getElementById('menuOverlay');             // Overlay menu mobile
    const allRecipesContainer = document.getElementById("allRecipesContainer"); // Contenitore vista "Mostra tutte"
    const singleSezioneContainer = document.getElementById("singleSezioneContainer"); // Contenitore vista "Sezione Singola"
    const bodyElement = document.body;                                      // Elemento Body per classi e overflow

    // Selettore CSS per l'elemento 'Mostra tutte' nella sidebar
    const showAllLiSelector = '#categoryList li[data-category-target="all"]';

    // Variabile per tenere traccia dell'elemento categoria attivo nella sidebar
    let activeCategoryLiElement = null;

    // --- Funzioni Helper UI ---

    /**
     * Aggiorna l'elemento attivo nella sidebar e gestisce l'effetto 'river'.
     * @param {Element | null} targetLi - L'elemento <li> da impostare come attivo, o null per deselezionare.
     */
    function setActiveCategory(targetLi) {
        if (!categoryList) return;

        // Rimuovi stato attivo e river da tutti gli elementi
        categoryList.querySelectorAll('li').forEach(li => li.classList.remove('active-category'));
        categoryList.classList.remove('river-active'); // Nascondi river

        activeCategoryLiElement = null; // Resetta riferimento interno

        if (targetLi) {
            targetLi.classList.add('active-category');
            activeCategoryLiElement = targetLi; // Aggiorna riferimento

            // Mostra e posiziona il river solo per categorie specifiche (non "Mostra tutte")
            if (targetLi.dataset.categoryTarget !== 'all') {
                // Usa rAF per assicurarsi che il layout sia calcolato prima di leggere offsetTop
                requestAnimationFrame(() => {
                    if (!activeCategoryLiElement) return; // Controllo ulteriore nel caso cambi nel frattempo
                    const offsetTop = activeCategoryLiElement.offsetTop;
                    const liHeight = activeCategoryLiElement.offsetHeight;
                    // Imposta variabili CSS per posizione e altezza del river
                    categoryList.style.setProperty('--river-offset', `${offsetTop}px`);
                    categoryList.style.setProperty('--sidebar-li-height', `${liHeight}px`);
                    categoryList.classList.add('river-active'); // Rendi visibile il river
                });
            }
        }
         // Se targetLi è null, 'active-category' e 'river-active' rimangono rimossi.
    }

    /**
     * Gestisce l'apertura e la chiusura del menu mobile.
     */
    function toggleMobileMenu() {
        const isOpen = bodyElement.classList.toggle('menu-open');
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
        // Blocca/sblocca lo scroll del body SOLO per il menu mobile
        bodyElement.style.overflow = isOpen ? 'hidden' : '';
        console.log(`Menu mobile ${isOpen ? 'aperto' : 'chiuso'}.`);
    }

    // --- Funzioni di Visualizzazione Contenuto ---

    /**
     * Mostra la vista "Mostra tutte", opzionalmente filtrata.
     * @param {string} [filter=''] - Il termine di ricerca da applicare.
     */
    function showAllRecipesView(filter = '') {
        const searchTerm = filter.toLowerCase().trim();
        console.log(`Visualizzazione: Mostra tutte ${searchTerm ? `(Filtrato per: "${searchTerm}")` : '(Non Filtrato)'}`);

        // Nascondi le altre viste
        if (singleSezioneContainer) singleSezioneContainer.classList.add("hidden");
        if (gallery) gallery.classList.add('hidden'); // Nascondi anche la vecchia galleria

        // Mostra il container corretto
        if (allRecipesContainer) allRecipesContainer.classList.remove("hidden");

        // Renderizza le ricette filtrate nel container
        renderAndPopulateRecipeCards(allRecipesContainer, searchTerm);
    }

    /**
     * Mostra la vista "Sezione Singola".
     * @param {string} sectionId - L'ID della sezione da visualizzare.
     */
    function showSingleSectionView(sectionId) {
        console.log(`Visualizzazione: Sezione Singola (ID: ${sectionId})`);

        // Nascondi le altre viste
        if (allRecipesContainer) allRecipesContainer.classList.add("hidden");
        if (gallery) gallery.classList.add('hidden');

        // Mostra il container corretto
        if (singleSezioneContainer) singleSezioneContainer.classList.remove("hidden");

        // Renderizza il contenuto della sezione singola
        // Assumendo che renderSingleSezione sia importata e gestisca il popolamento
        renderSingleSezione(sectionId);
    }

    /**
     * Filtra allRicette e popola il container specificato con le card.
     * @param {Element} container - L'elemento DOM dove inserire le card.
     * @param {string} [filter=''] - Il termine di ricerca (già in minuscolo e trimmato).
     */
    function renderAndPopulateRecipeCards(container, filter = '') {
        if (!container) {
            console.error("renderAndPopulateRecipeCards: Container non fornito.");
            return;
        }
        container.innerHTML = ''; // Svuota prima di popolare

        // Filtro esteso (nome, desc, cat, ingredienti)
        const ricetteFiltrate = allRicette.filter(ricetta => {
            if (!filter) return true; // Nessun filtro, mostra tutto

            // Controlla campi principali
            if (ricetta.nome.toLowerCase().includes(filter) ||
                (ricetta.descrizione && ricetta.descrizione.toLowerCase().includes(filter)) ||
                ricetta.categoria.toLowerCase().includes(filter)) {
                return true;
            }

            // Controlla nomi ingredienti
            if (Array.isArray(ricetta.ingredienti)) {
                for (const gruppo of ricetta.ingredienti) {
                    if (Array.isArray(gruppo.lista_ingredienti)) {
                        for (const item of gruppo.lista_ingredienti) {
                            if (item.ingrediente && item.ingrediente.toLowerCase().includes(filter)) {
                                return true; // Trovato!
                            }
                            // Opzionale: cerca nelle note
                            // if (item.note && item.note.toLowerCase().includes(filter)) return true;
                        }
                    }
                }
            }
             // Opzionale: cerca nel procedimento (valutare performance)
             // if (...) return true;

            return false; // Non trovato in nessun campo cercato
        });

        // Popola il container
        if (ricetteFiltrate.length > 0) {
            const fragment = document.createDocumentFragment();
            ricetteFiltrate.forEach(ricetta => {
                // Usa la funzione importata per creare card standard cliccabili
                fragment.appendChild(createAndAppendCard(ricetta));
            });
            container.appendChild(fragment);
            console.log(`Renderizzate ${ricetteFiltrate.length} card filtrate.`);
        } else {
            // Messaggio se nessun risultato
            container.innerHTML = `<p class="gallery-empty-message">Nessuna ricetta trovata ${filter ? 'per "' + filter + '"' : ''}.</p>`;
            console.log(`Nessuna ricetta trovata per il filtro "${filter}".`);
        }
    }


    // --- GESTORI EVENTI SPECIFICI ---

    /**
     * Gestisce il click su un elemento <li> della lista categorie.
     * @param {Event} event - L'oggetto evento.
     */
    function handleCategoryClick(event) {
        const li = event.currentTarget;
        const targetType = li.dataset.categoryTarget;
        const sectionId = li.dataset.categoryId;
        // const categoryName = li.dataset.categoryName; // Non più usato per la visualizzazione principale

        console.log("Click su Categoria:", { targetType, sectionId });

        // Pulisci sempre la ricerca quando si naviga per categoria
        if (searchInput) searchInput.value = '';

        setActiveCategory(li); // Aggiorna UI sidebar

        // Decide quale vista mostrare
        if (targetType === 'all') {
            showAllRecipesView();
        } else if (targetType === 'specific' && sectionId) {
            showSingleSectionView(sectionId);
        } else {
            console.warn("Azione categoria non riconosciuta o ID sezione mancante. Mostro tutte.");
            showAllRecipesView();
        }

        // Chiudi il menu mobile se è aperto
        if (bodyElement.classList.contains('menu-open')) {
            toggleMobileMenu();
        }
    }

    /**
     * Funzione di callback chiamata dopo il caricamento dei dati del ricettario.
     */
    const postRicettarioLoadUpdate = () => {
        console.log("Ricettario caricato. Aggiornamento UI iniziale.");

        // 1. Renderizza le categorie nella sidebar
        renderCategories(
            categoryList,
            searchInput,
            // Callback filtro (non usata direttamente da renderCategories ora)
            () => {}, // Funzione vuota, la logica è in handleCategoryClick/ricerca
            setActiveCategory // Callback per impostare lo stato attivo
        );

        // 2. Aggiungi listener centralizzati agli elementi categoria creati
        if (categoryList) {
            categoryList.querySelectorAll('li').forEach(li => {
                // Assicurati di non aggiungere listener multipli se questa funzione viene chiamata più volte
                li.removeEventListener('click', handleCategoryClick); // Rimuovi vecchi listener
                li.addEventListener('click', handleCategoryClick);  // Aggiungi nuovo listener
                 // Aggiungi anche per tastiera per accessibilità
                 li.removeEventListener('keydown', handleCategoryKeydown);
                 li.addEventListener('keydown', handleCategoryKeydown);
            });
        }

        // 3. Mostra la vista predefinita "Mostra tutte"
        showAllRecipesView();

        // 4. Imposta "Mostra tutte" come attivo nella sidebar
        const initialActiveLi = categoryList?.querySelector(showAllLiSelector);
        if (initialActiveLi) {
            setActiveCategory(initialActiveLi);
        } else {
             console.warn("Elemento 'Mostra tutte' non trovato nella sidebar.");
        }

         // 5. Nascondi la vecchia galleria se esiste e non serve più
         if(gallery) gallery.classList.add('hidden');

    };

     /** Gestore per eventi keydown sulla lista categorie */
     function handleCategoryKeydown(event) {
         // Attiva l'elemento se premuto Enter o Spazio
         if (event.key === 'Enter' || event.key === ' ') {
             event.preventDefault(); // Previene scroll pagina con Spazio
             handleCategoryClick(event); // Chiama lo stesso gestore del click
         }
     }


    // --- INIZIALIZZAZIONE ---

    // 1. Carica i dati delle sezioni (da sezioni.json)
    fetch('sezioni.json')
        .then(response => {
            if (!response.ok) throw new Error(`Errore HTTP ${response.status} nel caricare sezioni.json`);
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                setSezioniData(data); // Imposta i dati nel modulo sezioni.js
                console.log("Dati 'sezioni.json' caricati correttamente.");
            } else {
                console.error("Formato dati 'sezioni.json' non valido (atteso array).");
                // Potresti voler gestire questo caso mostrando un errore all'utente
            }
        })
        .catch(err => {
            console.error("Errore fatale nel caricamento di 'sezioni.json':", err);
            // Informa l'utente che le descrizioni delle sezioni potrebbero mancare
            if(singleSezioneContainer) {
                // Potresti aggiungere un messaggio di errore persistente o temporaneo
            }
        });

    // 2. Carica i dati del ricettario e avvia l'aggiornamento UI
    // Passa la funzione `postRicettarioLoadUpdate` come callback
    loadRicettario(postRicettarioLoadUpdate);

    // 3. Collega Event Listener per UI Globale (Menu Mobile, Ricerca)

    // Ricerca
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const searchTerm = searchInput.value;
            searchTimeout = setTimeout(() => {
                showAllRecipesView(searchTerm); // Mostra sempre la vista filtrata "tutte"
                // Se l'utente sta cercando, deseleziona la categoria attiva nella sidebar
                if (searchTerm) {
                    setActiveCategory(null);
                } else {
                    // Se cancella la ricerca, riattiva "Mostra tutte"
                     const showAllLi = categoryList?.querySelector(showAllLiSelector);
                     if (showAllLi) setActiveCategory(showAllLi);
                }
            }, 300); // Debounce per non filtrare ad ogni tasto
        });
    } else {
        console.warn("Elemento barra di ricerca #searchInput non trovato.");
    }

    // Menu Mobile
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    } else {
        console.warn("Elemento bottone menu #menuToggle non trovato.");
    }
    if (menuOverlay) {
        menuOverlay.addEventListener('click', toggleMobileMenu); // Chiude anche cliccando sull'overlay
    } else {
        console.warn("Elemento overlay menu #menuOverlay non trovato.");
    }

}); // --- FINE DOMContentLoaded ---
