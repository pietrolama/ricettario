/**
 * Ricettario Interattivo Script
 * Gestisce caricamento dati, rendering galleria, filtri,
 * visualizzazione modale dettagli, menu mobile e zoom (opzionale).
 */
document.addEventListener('DOMContentLoaded', function () {
    // --- Selezione Elementi DOM ---
    // Cache degli elementi DOM per accesso rapido
    const gallery = document.getElementById('gallery');
    const zoomSlider = document.getElementById('zoomSlider'); // Se non usato, si può rimuovere da HTML e qui
    const searchInput = document.getElementById('searchInput');
    const categoryList = document.getElementById('categoryList');
    const modal = document.getElementById('recipeModal');
    const modalContent = document.getElementById('modalContent');
    const recipeCounterElement = document.getElementById('recipe-counter');
    const menuToggle = document.getElementById('menuToggle');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const bodyElement = document.body;

    // --- Stato Applicazione ---
    let ricettarioData = null;      // Contiene i dati JSON caricati
    let allRicette = [];            // Array piatto di tutte le ricette per filtri
    let activeCategoryElement = null; // Riferimento all'elemento LI attivo
    let isMenuOpen = false;         // Stato del menu mobile

    // --- Costanti ---
    const BASE_CARD_WIDTH = 300;     // Larghezza base card in px per calcolo zoom
    const IMAGE_EXTENSION = '.jpeg'; // Estensione immagini (modificare se necessario)

    // =============================================
    // FUNZIONI HELPER
    // =============================================

    /**
     * Crea e ritorna un elemento HTML con classi, testo e attributi specificati.
     * @param {string} tag Tipo di elemento HTML (es. 'div', 'p')
     * @param {string|null} className Stringa di classi separate da spazio
     * @param {string|null} textContent Testo interno all'elemento
     * @param {object|null} attributes Oggetto chiave/valore per attributi
     * @returns {HTMLElement} L'elemento creato
     */
    function createElement(tag, className, textContent, attributes) {
        const element = document.createElement(tag);
        if (className) {
            // Gestisce più classi e spazi extra
            className.split(' ').forEach(cls => {
                if (cls.trim()) element.classList.add(cls.trim());
            });
        }
        if (textContent) element.textContent = textContent;
        if (attributes) {
            for (const key in attributes) {
                // Verifica che la chiave appartenga all'oggetto stesso
                if (Object.prototype.hasOwnProperty.call(attributes, key)) {
                    element.setAttribute(key, attributes[key]);
                }
            }
        }
        return element;
    }

    /**
     * Genera un nome file sicuro (lowercase, no accenti, no caratteri speciali, underscore)
     * @param {string} recipeName Nome della ricetta
     * @returns {string} Nome file sicuro o placeholder
     */
    function generateImageFilename(recipeName) {
        if (!recipeName) return 'default_placeholder'; // Fallback
        // Normalizza rimuovendo accenti, sostituisce non-alphanumeric con underscore, pulisce underscore multipli/iniziali/finali
        return recipeName
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9_]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_*|_*$/g, '');
    }


    // =============================================
    // FUNZIONI DI RENDERING (Modale e UI)
    // =============================================

    /** Renderizza la sezione Ingredienti nel modale. */
    function renderIngredienti(ingredientiData) {
        if (!Array.isArray(ingredientiData) || ingredientiData.length === 0) return null;
        const container = createElement('div', 'ingredients section-container');
        container.appendChild(createElement('h3', 'section-title', 'Ingredienti'));
        let hasContent = false;
        ingredientiData.forEach(gruppo => {
            if (gruppo.nome_gruppo) {
                const nomeGruppoFmt = gruppo.nome_gruppo.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                container.appendChild(createElement('h4', 'subsection-title', nomeGruppoFmt));
            }
            if (Array.isArray(gruppo.lista_ingredienti) && gruppo.lista_ingredienti.length > 0) {
                const list = createElement('ul');
                gruppo.lista_ingredienti.forEach(item => {
                    let text = '';
                    if (item.ingrediente) {
                        const q = item.quantita || '';
                        const p = item.per ? ` (per ${item.per})` : '';
                        const n = item.note ? ` (${item.note})` : '';
                        text = `${q} ${item.ingrediente}${p}${n}`.trim().replace(/\s+/g, ' '); // Normalizza spazi
                    }
                    if (text) {
                        list.appendChild(createElement('li', null, text));
                        hasContent = true;
                    }
                });
                if (list.hasChildNodes()) container.appendChild(list);
            }
        });
        return hasContent ? container : null;
    }

    /** Renderizza la sezione Procedimento nel modale. */
    function renderProcedimento(procedimentoData) {
        if (!Array.isArray(procedimentoData) || procedimentoData.length === 0) return null;
        const container = createElement('div', 'procedure section-container');
        container.appendChild(createElement('h3', 'section-title', 'Procedimento'));
        let hasContent = false;
        procedimentoData.forEach(faseObj => {
            if (faseObj.fase) {
                container.appendChild(createElement('h4', 'subsection-title', faseObj.fase));
            }
            if (Array.isArray(faseObj.passaggi) && faseObj.passaggi.length > 0) {
                const list = createElement('ol'); // Lista ordinata per i passi
                faseObj.passaggi.forEach(step => {
                    if (typeof step === 'string' && step.trim()) {
                        list.appendChild(createElement('li', null, step.trim()));
                        hasContent = true;
                    }
                });
                if (list.hasChildNodes()) container.appendChild(list);
            }
        });
        return hasContent ? container : null;
    }

    // Aggiungi qui le altre funzioni `render*` (Varianti, Utilizzo, Struttura, Esempi, Tips, Note, Finitura, Pairing)
    // Mantenendo la stessa logica di controllo dati e creazione elementi.
    // (Omesse per brevità, ma basate sul codice precedente)

    function renderVarianti(variantiData) {
        if (!Array.isArray(variantiData) || variantiData.length === 0) return null;
        const container = createElement('div', 'varianti section-container');
        container.appendChild(createElement('h3', 'section-title', 'Varianti'));
        let mainHasContent = false;
        variantiData.forEach(variante => {
            const varianteDiv = createElement('div', 'sottoricetta subsection-container');
            let varianteHasContent = false;
            if (variante.nome) { varianteDiv.appendChild(createElement('h4', 'subsection-title', variante.nome)); varianteHasContent = true; }
            if (variante.descrizione) { varianteDiv.appendChild(createElement('p', 'descrizione-info', variante.descrizione)); varianteHasContent = true; }
            if (variante.ingredienti) { const el = renderIngredienti(variante.ingredienti); if (el) { varianteDiv.appendChild(el); varianteHasContent = true; } }
            if (variante.procedimento) { const el = renderProcedimento(variante.procedimento); if (el) { varianteDiv.appendChild(el); varianteHasContent = true; } }
            if (variante.applicazioni) { varianteDiv.appendChild(createElement('p', 'applicazioni-info', `Applicazioni: ${variante.applicazioni}`)); varianteHasContent = true; }
            if (varianteHasContent) { container.appendChild(varianteDiv); mainHasContent = true; }
        });
        return mainHasContent ? container : null;
    }
    function renderUtilizzo(utilizzoData) { /* ... Implementazione ... */ return /*...*/; }
    function renderStruttura(strutturaData) { /* ... Implementazione ... */ return /*...*/; }
    function renderEsempi(esempiData) { /* ... Implementazione ... */ return /*...*/; }
    function renderTips(tipsData) { /* ... Implementazione ... */ return /*...*/; }
    function renderNote(noteData, sectionKey) { /* ... Implementazione ... */ return /*...*/; }
    function renderFinitura(finituraData) { /* ... Implementazione ... */ return /*...*/; }
    function renderPairing(pairingData) { /* ... Implementazione ... */ return /*...*/; }


    /** Renderizza la galleria di card delle ricette. */
    function renderGallery(filter = '') {
        if (!gallery) return;
        // Usa requestAnimationFrame per non bloccare il browser durante il rendering
        requestAnimationFrame(() => {
            gallery.innerHTML = ''; // Pulisci
            const lowerCaseFilter = filter.toLowerCase().trim();
            const filteredRicette = allRicette.filter(ricetta =>
                !filter || // Mostra tutto se filtro vuoto
                ricetta.nome.toLowerCase().includes(lowerCaseFilter) ||
                (ricetta.descrizione && ricetta.descrizione.toLowerCase().includes(lowerCaseFilter)) ||
                ricetta.categoria.toLowerCase().includes(lowerCaseFilter)
            );

            if (filteredRicette.length === 0) {
                gallery.innerHTML = '<p class="gallery-empty-message">Nessuna ricetta trovata.</p>';
            } else {
                // Usa DocumentFragment per aggiungere card in batch (migliore performance)
                const fragment = document.createDocumentFragment();
                filteredRicette.forEach(ricetta => fragment.appendChild(createAndAppendCard(ricetta)));
                gallery.appendChild(fragment);
            }
        });
    }

    /** Crea e ritorna un elemento card per una singola ricetta. */
    function createAndAppendCard(ricetta) {
        // Nota: questa funzione ora ritorna l'elemento, non lo appende direttamente
        const card = createElement('div', 'card');
        const imageFilename = generateImageFilename(ricetta.nome);
        const imageUrl = `img/${imageFilename}${IMAGE_EXTENSION}`;

        // Imposta sempre variabile e classe, CSS gestirà fallback
        card.style.setProperty('--card-bg-image', `url('${imageUrl}')`);
        card.classList.add('card-has-image');

        const contentWrapper = createElement('div', 'card-content-wrapper');
        // Crea elementi figli esplicitamente invece di innerHTML per sicurezza e performance
        const title = createElement('h3', null, ricetta.nome);
        const description = createElement('p', null, ricetta.descrizione || ''); // Descrizione vuota se non presente
        const categoryTag = createElement('span', 'category-tag', ricetta.categoria);
        contentWrapper.appendChild(title);
        contentWrapper.appendChild(description);
        contentWrapper.appendChild(categoryTag);

        card.appendChild(contentWrapper);
        // Aggiungi listener direttamente qui per pulizia
        card.addEventListener('click', () => openModal(ricetta));
        return card; // Ritorna l'elemento creato
    }

    /** Renderizza la lista delle categorie nella sidebar. */
    function renderCategories() {
        if (!categoryList || !ricettarioData?.categorie) return;
        const fragment = document.createDocumentFragment(); // Usa fragment per performance

        const showAllLi = createElement('li', null, 'Mostra tutte');
        showAllLi.dataset.categoryTarget = 'all'; // Identificatore
        showAllLi.setAttribute('role', 'button'); // Semantica per accessibilità
        showAllLi.tabIndex = 0; // Rendilo focusabile
        showAllLi.addEventListener('click', handleCategoryClick);
        showAllLi.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(e); });
        fragment.appendChild(showAllLi);

        ricettarioData.categorie.forEach(categoria => {
            const li = createElement('li', null, categoria.nome);
            li.dataset.categoryName = categoria.nome;
            li.dataset.categoryTarget = 'specific';
            li.setAttribute('role', 'button');
            li.tabIndex = 0;
            li.addEventListener('click', handleCategoryClick);
            li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(e); });
            fragment.appendChild(li);
        });

        categoryList.innerHTML = ''; // Pulisci la lista esistente
        categoryList.appendChild(fragment); // Aggiungi tutte le categorie in una volta
    }

    /** Aggiorna lo stato attivo della categoria e l'indicatore "river". */
    function setActiveCategory(targetLi) {
        const categoryListElement = categoryList; // Usa var globale già selezionata
        if (!categoryListElement) return;

        // Rimuovi attivo da precedente
        if (activeCategoryElement && activeCategoryElement !== targetLi) {
            activeCategoryElement.classList.remove('active-category');
        }
        categoryListElement.classList.remove('river-active'); // Nascondi sempre il river prima

        activeCategoryElement = null; // Resetta globale

        if (targetLi) {
            targetLi.classList.add('active-category');
            activeCategoryElement = targetLi;

            // Mostra river solo per categorie specifiche
            if (targetLi.dataset.categoryTarget === 'specific') {
                const offsetTop = targetLi.offsetTop;
                const liHeight = targetLi.offsetHeight;
                // Imposta le variabili CSS (assicurati che siano usate nel CSS)
                categoryListElement.style.setProperty('--river-offset', `${offsetTop}px`);
                categoryListElement.style.setProperty('--sidebar-li-height', `${liHeight}px`);
                categoryListElement.classList.add('river-active');
            }
        }
        // Se targetLi è null o "Mostra tutte", il river rimane nascosto
    }

    /** Aggiorna il contatore delle ricette. */
    function updateRecipeCount() {
        if (recipeCounterElement) {
            const totalRecipes = allRicette.length;
            recipeCounterElement.textContent = `${totalRecipes} Ricette`;
            recipeCounterElement.classList.remove('error');
        }
    }

    /** Mostra un messaggio di errore nella galleria. */
    function displayErrorMessage(message) {
        if (gallery) {
            gallery.innerHTML = `<p class="gallery-error-message">${message}</p>`;
        }
    }

    // =============================================
    // LOGICA APPLICAZIONE
    // =============================================

    /** Carica i dati del ricettario dal file JSON. */
    function loadRicettario() {
        fetch('ricettario.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Errore HTTP: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                ricettarioData = data;
                processRicette();      // Prepara array piatto ricette
                updateRecipeCount();   // Aggiorna contatore
                renderCategories();    // Popola la sidebar
                renderGallery();       // Renderizza tutte le card inizialmente
                // Imposta categoria "Mostra tutte" come attiva all'inizio
                if (categoryList && categoryList.firstChild) {
                    setActiveCategory(categoryList.firstChild);
                }
            })
            .catch(error => {
                console.error('Errore caricamento/parsing ricettario.json:', error);
                displayErrorMessage('Impossibile caricare le ricette. Controlla il file JSON e la console.');
                if (recipeCounterElement) {
                    recipeCounterElement.textContent = 'Errore';
                    recipeCounterElement.classList.add('error');
                }
            });
    }

    /** Processa i dati JSON per creare un array piatto `allRicette`. */
    function processRicette() {
        allRicette = [];
        if (!ricettarioData?.categorie || !Array.isArray(ricettarioData.categorie)) return;
        ricettarioData.categorie.forEach(categoria => {
            if (categoria.ricette && Array.isArray(categoria.ricette)) {
                categoria.ricette.forEach(ricetta => {
                    // Aggiungi la categoria alla ricetta per un accesso facile
                    allRicette.push({ ...ricetta, categoria: categoria.nome });
                });
            }
        });
    }

    /** Apre il modale con i dettagli della ricetta specificata. */
    function openModal(ricetta) {
        if (!modal || !modalContent || !ricetta) return;
        // Pulisce subito, l'aggiunta del contenuto avverrà dopo
        modalContent.innerHTML = '';

        // Crea elementi base
        const textWrapper = createElement('div', 'modal-text-content');
        const imageContainer = createElement('div', 'modal-image-container');
        const modalHeader = createElement('div', 'modal-header');
        const titleH2 = createElement('h2', null, ricetta.nome);
        const closeButton = createElement('button', 'modal-close-button', '\u00D7', { 'aria-label': 'Chiudi dettagli ricetta' });
        const modalBody = createElement('div', 'modal-body');

        // Assembla Header
        modalHeader.appendChild(titleH2);
        modalHeader.appendChild(closeButton);
        textWrapper.appendChild(modalHeader);

        // Assembla Corpo
        modalBody.appendChild(createElement('p', 'categoria-info', `Categoria: ${ricetta.categoria || 'Non specificata'}`));
        const descElement = createElement('p', 'descrizione-info', ricetta.descrizione || 'Nessuna descrizione fornita.');
        modalBody.appendChild(descElement);

        // Mappa delle chiavi alle funzioni di rendering
        const sectionRenderers = {
            'ingredienti': renderIngredienti,
            'procedimento': renderProcedimento,
            'varianti': renderVarianti,
            'utilizzo': renderUtilizzo,
            'struttura_generale': renderStruttura,
            'esempi_personalizzazione': renderEsempi,
            'tips_tecnici': renderTips,
            'note_tecniche': (data) => renderNote(data, 'note_tecniche'),
            'note_finali': (data) => renderNote(data, 'note_finali'),
            'finitura_consigliata': renderFinitura,
            'pairing_consigliato': renderPairing,
            'vino_abbinato': (data) => data ? createElement('p', 'vino-info section-container', `Vino consigliato: ${data}`) : null
        };

        // Renderizza dinamicamente le sezioni presenti nella ricetta
        for (const key in sectionRenderers) {
            if (Object.prototype.hasOwnProperty.call(ricetta, key) && ricetta[key]) {
                // Verifica se il dato è un array vuoto prima di renderizzare
                if (Array.isArray(ricetta[key]) && ricetta[key].length === 0) continue;

                const renderer = sectionRenderers[key];
                const sectionElement = renderer(ricetta[key]);
                if (sectionElement) { // Assicura che la funzione di render non ritorni null
                    modalBody.appendChild(sectionElement);
                }
            }
        }
        textWrapper.appendChild(modalBody);

        // Gestione Immagine
        const imageFilename = generateImageFilename(ricetta.nome);
        const imageUrl = `img/${imageFilename}${IMAGE_EXTENSION}`;
        const recipeImage = createElement('img');
        recipeImage.src = imageUrl;
        recipeImage.alt = `Immagine: ${ricetta.nome}`;
        recipeImage.loading = 'lazy'; // Caricamento differito
        recipeImage.onerror = () => {
            imageContainer.innerHTML = '<p class="image-error">Immagine non disponibile</p>';
            imageContainer.style.backgroundColor = 'var(--color-surface-alt)'; // Placeholder visivo
            recipeImage.remove(); // Rimuove tag img rotto
        };
        imageContainer.appendChild(recipeImage);

        // Assembla e Mostra Modale
        modalContent.appendChild(textWrapper);
        modalContent.appendChild(imageContainer);
        modal.style.display = 'flex';
        bodyElement.style.overflow = 'hidden'; // Blocca scroll pagina

        // Focus gestito con delay per accessibilità e transizioni
        setTimeout(() => {
            // Prova a focusare il titolo, altrimenti il bottone chiudi
            (titleH2 || closeButton)?.focus();
        }, 150);
    }

    /** Chiude il modale e ripristina lo scroll del body. */
    function closeModal() {
        if (!modal) return;
        modal.style.display = 'none'; // Nascondi
        bodyElement.style.overflow = ''; // Riabilita scroll

        // Svuota contenuto dopo un delay per permettere la transizione CSS (se esiste)
        setTimeout(() => {
            // Controlla che il modale sia ancora nascosto prima di pulire
            if (window.getComputedStyle(modal).display === 'none') {
                modalContent.innerHTML = '';
            }
        }, 350); // Delay corrispondente o leggermente > alla durata transizione opacità modal
    }

    // =============================================
    // GESTORI EVENTI
    // =============================================

    /** Gestore unico per i click sugli item della categoria */
    function handleCategoryClick(event) {
        // Ottieni l'elemento LI effettivo cliccato o attivato via tastiera
        const targetLi = event.currentTarget;
        if (!targetLi) return;

        setActiveCategory(targetLi); // Imposta stato attivo

        // Determina l'azione di filtraggio
        if (targetLi.dataset.categoryTarget === 'all') {
            if (searchInput) searchInput.value = ''; // Pulisci ricerca
            renderGallery(''); // Mostra tutto
        } else if (targetLi.dataset.categoryName) {
            renderGallery(targetLi.dataset.categoryName); // Filtra per categoria specifica
        }

        // Chiudi il menu mobile se aperto
        if (isMenuOpen) {
            toggleMobileMenu();
        }
    }

    /**
* Gestisce l'apertura e la chiusura del menu mobile.
* Alterna la classe 'menu-open' sul body e aggiorna l'attributo
* aria-expanded sul bottone toggle per l'accessibilità.
*/
    function toggleMobileMenu() {
        // 1. Seleziona elementi necessari (se non già globali, meglio averli qui)
        const bodyElement = document.body;
        const menuToggle = document.getElementById('menuToggle');
        // const sidebarMenu = document.getElementById('sidebarMenu'); // Non serve dentro questa funzione

        // 2. Inverti lo stato globale del menu
        // Assumendo che 'isMenuOpen' sia una variabile globale definita altrove:
        // isMenuOpen = !isMenuOpen;

        // O se 'isMenuOpen' non è globale, puoi controllare la classe sul body:
        const currentlyOpen = bodyElement.classList.contains('menu-open');
        const shouldBeOpen = !currentlyOpen; // Lo stato desiderato dopo il toggle

        // 3. Applica/Rimuovi la classe al body
        // Il secondo argomento di toggle forza lo stato (true per aggiungere, false per rimuovere)
        bodyElement.classList.toggle('menu-open', shouldBeOpen);

        // 4. Aggiorna attributo ARIA sul bottone (se il bottone esiste)
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', shouldBeOpen ? 'true' : 'false');
        }

        // 5. Aggiorna variabile di stato globale (se la usi)
        // isMenuOpen = shouldBeOpen;

        // Optional: Blocca/Sblocca scroll del body (anche se CSS dovrebbe gestirlo)
        // bodyElement.style.overflow = shouldBeOpen ? 'hidden' : '';

        // Debug Log (opzionale)
        // console.log(`Menu toggled. Should be open: ${shouldBeOpen}`);
    }


    // =============================================
    // EVENT LISTENERS
    // =============================================

    // Zoom Slider (se presente)
    if (zoomSlider && gallery) {
        zoomSlider.addEventListener('input', () => {
            // Debounce/Throttle potrebbe essere utile per performance qui
            requestAnimationFrame(() => { // Usa rAF per fluidità
                const zoomLevel = parseFloat(zoomSlider.value) || 1;
                const minWidth = BASE_CARD_WIDTH * zoomLevel;
                gallery.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}px, 1fr))`;
            });
        });
        // Applica zoom iniziale se il valore di default non è 1
        if (parseFloat(zoomSlider.value) !== 1) {
            zoomSlider.dispatchEvent(new Event('input'));
        }
    }

    // Search Input
    if (searchInput) {
        // Usa 'input' per reazione immediata, 'change' per reazione on blur
        searchInput.addEventListener('input', () => {
            setActiveCategory(null); // Rimuovi highlight categorie
            renderGallery(searchInput.value); // Filtra in tempo reale
        });
    }

    // Modal: Chiusura (Overlay, Bottone X, Tasto Esc)
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('.modal-close-button')) {
                closeModal();
            }
        });
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && window.getComputedStyle(modal).display !== 'none') {
                closeModal();
            }
        });
    }

    // Menu Mobile: Bottone Hamburger
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    } else {
        console.warn("Elemento bottone menu #menuToggle non trovato.");
    }

    // Menu Mobile: Overlay
    if (menuOverlay) {
        menuOverlay.addEventListener('click', () => {
            if (isMenuOpen) { // Chiudi solo se effettivamente aperto
                toggleMobileMenu();
            }
        });
    }

    // --- Inizializzazione Applicazione ---
    loadRicettario();

}); // Fine DOMContentLoaded
