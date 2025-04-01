/**
 * Ricettario Interattivo Script
 * Gestisce caricamento dati, rendering galleria, filtri,
 * visualizzazione modale dettagli, menu mobile e zoom (opzionale).
 */
document.addEventListener('DOMContentLoaded', function () {
    // --- Selezione Elementi DOM ---
    const gallery = document.getElementById('gallery');
    const zoomSlider = document.getElementById('zoomSlider'); // Rimuovere se non usato
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
    let ricettarioData = null;
    let allRicette = [];
    let activeCategoryElement = null;
    // 'isMenuOpen' non è strettamente necessario se deduciamo lo stato dalla classe del body
    // let isMenuOpen = false;

    const pages = document.querySelectorAll('.modal-page');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    // --- Costanti ---
    const BASE_CARD_WIDTH = 300;
    const IMAGE_EXTENSION = '.jpeg'; // Assicurati che sia l'estensione corretta

    // Variabile globale per tenere traccia della pagina corrente (0 = prima pagina)
    let currentPage = 0;

    // Funzione per aggiornare la pagina attiva
    function updatePage(newPage) {
        const pages = document.querySelectorAll('.modal-page');
        if (newPage < 0 || newPage >= pages.length) return;

        // Rimuove le classi "active" e "prev" da tutte le pagine
        pages.forEach(page => page.classList.remove('active', 'prev'));

        // Se stiamo tornando indietro, aggiungi classe "prev" alla pagina corrente
        if (newPage < currentPage) {
            pages[currentPage].classList.add('prev');
        }

        // Imposta la nuova pagina come attiva
        pages[newPage].classList.add('active');
        currentPage = newPage;
    }

    // Funzioni per il rilevamento dello swipe
    let touchStartX = 0;
    let touchEndX = 0;

    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
    }

    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleGesture();
    }

    function handleGesture() {
        const diff = touchStartX - touchEndX;
        // Soglia minima per riconoscere uno swipe
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Swipe sinistro → pagina successiva
                updatePage(currentPage + 1);
            } else {
                // Swipe destro → pagina precedente
                updatePage(currentPage - 1);
            }
        }
        // Reset
        touchStartX = 0;
        touchEndX = 0;
    }

    // Una volta creato il contenuto del modal (in openModal),
    // assicurati di attaccare gli event listener ai bottoni e al wrapper delle pagine.

    function attachModalNavigation() {
        // Attacca event listener ai bottoni di navigazione
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => updatePage(currentPage - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => updatePage(currentPage + 1));
        }

        // Attacca swipe listener al wrapper delle pagine
        const pagesWrapper = document.querySelector('.modal-pages-wrapper');
        if (pagesWrapper) {
            pagesWrapper.addEventListener('touchstart', handleTouchStart, false);
            pagesWrapper.addEventListener('touchend', handleTouchEnd, false);
        }
    }


    // =============================================
    // FUNZIONI HELPER
    // =============================================

    function createElement(tag, className, textContent, attributes) {
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

    function generateImageFilename(recipeName) {
        if (!recipeName) return 'default_placeholder';
        // Logica migliorata per gestire più casi
        return recipeName
            .normalize("NFD") // Separa accenti dalle lettere
            .replace(/[\u0300-\u036f]/g, "") // Rimuove gli accenti
            .toLowerCase()
            .replace(/[^a-z0-9\s_-]/g, '') // Rimuove caratteri non alfanumerici eccetto spazi, trattini, underscore
            .trim() // Rimuove spazi iniziali/finali
            .replace(/[\s_-]+/g, '_') // Sostituisce spazi/trattini/underscore multipli con un singolo underscore
            .replace(/_+/g, '_'); // Assicura underscore singolo
    }

    // =============================================
    // FUNZIONI DI RENDERING (Modale e UI) - IMPLEMENTAZIONI COMPLETE
    // =============================================

    /** Renderizza la sezione Ingredienti nel modale. */
    function renderIngredienti(ingredientiData) {
        if (!Array.isArray(ingredientiData) || ingredientiData.length === 0) return null;
        const container = createElement('div', 'ingredients section-container');
        container.appendChild(createElement('h3', 'section-title', 'Ingredienti'));
        let hasContent = false;
        ingredientiData.forEach(gruppo => {
            if (!gruppo || !Array.isArray(gruppo.lista_ingredienti) || gruppo.lista_ingredienti.length === 0) {
                return; // Salta gruppi vuoti o malformati
            }
            if (gruppo.nome_gruppo) {
                const nomeGruppoFmt = gruppo.nome_gruppo.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                container.appendChild(createElement('h4', 'subsection-title', nomeGruppoFmt));
            }
            const list = createElement('ul');
            gruppo.lista_ingredienti.forEach(item => {
                if (!item || !item.ingrediente) return; // Salta item senza ingrediente
                let text = '';
                const q = item.quantita || '';
                const ing = item.ingrediente.trim();
                const p = item.per ? ` (per ${item.per.trim()})` : '';
                const n = item.note ? ` (${item.note.trim()})` : '';
                text = `${q} ${ing}${p}${n}`.trim().replace(/\s+/g, ' ');
                if (text) {
                    list.appendChild(createElement('li', null, text));
                    hasContent = true;
                }
            });
            if (list.hasChildNodes()) container.appendChild(list);
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
            if (!faseObj || !Array.isArray(faseObj.passaggi) || faseObj.passaggi.length === 0) {
                return; // Salta fasi vuote o malformate
            }
            if (faseObj.fase) {
                container.appendChild(createElement('h4', 'subsection-title', faseObj.fase.trim()));
            }
            const list = createElement('ol');
            faseObj.passaggi.forEach(step => {
                if (typeof step === 'string' && step.trim()) {
                    list.appendChild(createElement('li', null, step.trim()));
                    hasContent = true;
                }
            });
            if (list.hasChildNodes()) container.appendChild(list);
        });
        return hasContent ? container : null;
    }

    /** Renderizza una sezione generica (es. note, tips, impiattamento). */
    function renderGenericListSection(data, title, tag = 'ul') {
        if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'string' && !data.trim())) return null;
        const container = createElement('div', 'generic section-container');
        container.appendChild(createElement('h3', 'section-title', title));
        if (Array.isArray(data)) {
            const list = createElement(tag); // 'ul' o 'ol'
            let added = false;
            data.forEach(item => {
                if (typeof item === 'string' && item.trim()) {
                    list.appendChild(createElement('li', null, item.trim()));
                    added = true;
                } else if (typeof item === 'object' && item !== null) {
                    // Gestione base per oggetti (potrebbe servire una logica più specifica)
                    list.appendChild(createElement('li', null, JSON.stringify(item)));
                    added = true;
                }
            });
            if (added) container.appendChild(list);
            else return null; // Nessun item valido aggiunto
        } else if (typeof data === 'string') {
            container.appendChild(createElement('p', null, data.trim()));
        } else {
            return null; // Tipo non gestito
        }
        return container;
    }

    /** Renderizza la sezione Varianti. */
    function renderVarianti(variantiData) {
        if (!Array.isArray(variantiData) || variantiData.length === 0) return null;
        const container = createElement('div', 'varianti section-container');
        container.appendChild(createElement('h3', 'section-title', 'Varianti'));
        let mainHasContent = false;
        variantiData.forEach(variante => {
            if (!variante) return;
            const varianteDiv = createElement('div', 'sottoricetta subsection-container');
            let varianteHasContent = false;

            if (variante.nome) { varianteDiv.appendChild(createElement('h4', 'subsection-title', variante.nome)); varianteHasContent = true; }
            if (variante.descrizione) { varianteDiv.appendChild(createElement('p', 'descrizione-info', variante.descrizione)); varianteHasContent = true; }
            if (variante.ingredienti) { const el = renderIngredienti(variante.ingredienti); if (el) { varianteDiv.appendChild(el); varianteHasContent = true; } }
            if (variante.procedimento) { const el = renderProcedimento(variante.procedimento); if (el) { varianteDiv.appendChild(el); varianteHasContent = true; } }
            if (variante.applicazioni) { varianteDiv.appendChild(createElement('p', 'applicazioni-info', `Applicazioni: ${variante.applicazioni}`)); varianteHasContent = true; }
            // Aggiungere altri campi specifici delle varianti se necessario

            if (varianteHasContent) {
                container.appendChild(varianteDiv);
                mainHasContent = true;
            }
        });
        return mainHasContent ? container : null;
    }

    /** Renderizza la sezione Utilizzo/Usi (gestisce oggetti). */
    function renderUsi(usiData) {
        if (!usiData || typeof usiData !== 'object' || Object.keys(usiData).length === 0) return null;
        const container = createElement('div', 'usi section-container');
        container.appendChild(createElement('h3', 'section-title', 'Utilizzo / Usi'));
        let hasContent = false;
        for (const key in usiData) {
            if (Object.prototype.hasOwnProperty.call(usiData, key) && Array.isArray(usiData[key]) && usiData[key].length > 0) {
                const subContainer = createElement('div', 'uso-subsection');
                const title = createElement('h4', 'subsection-title', key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '));
                subContainer.appendChild(title);
                const list = createElement('ul');
                let addedItem = false;
                usiData[key].forEach(item => {
                    if (typeof item === 'string' && item.trim()) {
                        list.appendChild(createElement('li', null, item.trim()));
                        addedItem = true;
                    }
                });
                if (addedItem) {
                    subContainer.appendChild(list);
                    container.appendChild(subContainer);
                    hasContent = true;
                }
            }
        }
        return hasContent ? container : null;
    }

    /** Renderizza la Struttura Generale (simile a Procedimento). */
    function renderStruttura(strutturaData) {
        if (!Array.isArray(strutturaData) || strutturaData.length === 0) return null;
        const container = createElement('div', 'struttura section-container');
        container.appendChild(createElement('h3', 'section-title', 'Struttura Generale'));
        let hasContent = false;
        strutturaData.forEach(fase => {
            if (!fase) return;
            const faseDiv = createElement('div', 'fase-struttura subsection-container');
            if (fase.fase) faseDiv.appendChild(createElement('h4', 'subsection-title', fase.fase));
            if (fase.ingredienti_base) faseDiv.appendChild(createElement('p', 'info', `Ingredienti Base: ${fase.ingredienti_base}`));
            if (fase.ingredienti) { const el = renderIngredienti(fase.ingredienti); if (el) faseDiv.appendChild(el); }
            // Procedimento dentro la struttura
            if (Array.isArray(fase.procedimento) && fase.procedimento.length > 0) {
                const procContainer = createElement('div'); // Container specifico per il procedimento interno
                procContainer.appendChild(createElement('h5', 'sub-subsection-title', 'Procedimento Fase'));
                const procList = createElement('ol');
                let addedStep = false;
                fase.procedimento.forEach(procFase => {
                    if (procFase && Array.isArray(procFase.passaggi)) {
                        procFase.passaggi.forEach(step => {
                            if (typeof step === 'string' && step.trim()) {
                                procList.appendChild(createElement('li', null, step.trim()));
                                addedStep = true;
                            }
                        });
                    }
                });
                if (addedStep) {
                    procContainer.appendChild(procList);
                    faseDiv.appendChild(procContainer);
                }
            }
            if (faseDiv.children.length > (fase.fase ? 1 : 0)) { // Se ha contenuto oltre al titolo
                container.appendChild(faseDiv);
                hasContent = true;
            }
        });
        return hasContent ? container : null;
    }

    /** Renderizza Esempi Personalizzazione. */
    function renderEsempi(esempiData) {
        if (!Array.isArray(esempiData) || esempiData.length === 0) return null;
        const container = createElement('div', 'esempi section-container');
        container.appendChild(createElement('h3', 'section-title', 'Esempi Personalizzazione'));
        const list = createElement('ul', 'esempi-list');
        esempiData.forEach(esempio => {
            if (!esempio) return;
            const li = createElement('li');
            if (esempio.ingrediente) li.appendChild(createElement('strong', null, `${esempio.ingrediente}: `));
            let details = [];
            if (esempio.note_umami_aromi_dominanti) details.push(`Aromi: ${esempio.note_umami_aromi_dominanti}.`);
            if (esempio.suggerimenti) details.push(`Suggerimenti: ${esempio.suggerimenti}.`);
            if (details.length > 0) li.appendChild(document.createTextNode(details.join(' ')));
            if (li.childNodes.length > 0) list.appendChild(li);
        });
        if (list.hasChildNodes()) container.appendChild(list);
        else return null;
        return container;
    }

    /** Renderizza Pairing Consigliato. */
    function renderPairing(pairingData) {
        if (!Array.isArray(pairingData) || pairingData.length === 0) return null;
        const container = createElement('div', 'pairing section-container');
        container.appendChild(createElement('h3', 'section-title', 'Abbinamenti Consigliati'));
        const list = createElement('ul');
        let added = false;
        pairingData.forEach(pair => {
            if (!pair || !pair.bevanda) return;
            let text = pair.bevanda.trim();
            if (pair.note) text += ` (${pair.note.trim()})`;
            list.appendChild(createElement('li', null, text));
            added = true;
        });
        if (added) container.appendChild(list);
        else return null;
        return container;
    }

    /** Renderizza la galleria di card delle ricette. */
    function renderGallery(filter = '', categoryFilter = '') {
        if (!gallery) return;
        requestAnimationFrame(() => {
            gallery.innerHTML = ''; // Pulisci prima
            const lowerCaseFilter = filter.toLowerCase().trim();
            const lowerCaseCategoryFilter = categoryFilter.toLowerCase().trim();

            const filteredRicette = allRicette.filter(ricetta => {
                const matchesCategory = !lowerCaseCategoryFilter || ricetta.categoria.toLowerCase() === lowerCaseCategoryFilter;
                const matchesSearch = !lowerCaseFilter ||
                    ricetta.nome.toLowerCase().includes(lowerCaseFilter) ||
                    (ricetta.descrizione && ricetta.descrizione.toLowerCase().includes(lowerCaseFilter)) ||
                    // Aggiungi ricerca negli ingredienti se vuoi (può rallentare)
                    // (ricetta.ingredienti && JSON.stringify(ricetta.ingredienti).toLowerCase().includes(lowerCaseFilter)) ||
                    ricetta.categoria.toLowerCase().includes(lowerCaseFilter); // Cerca anche nella categoria per termini generici
                return matchesCategory && matchesSearch;
            });

            if (filteredRicette.length === 0) {
                gallery.innerHTML = '<p class="gallery-empty-message">Nessuna ricetta trovata.</p>';
            } else {
                const fragment = document.createDocumentFragment();
                filteredRicette.forEach(ricetta => fragment.appendChild(createAndAppendCard(ricetta)));
                gallery.appendChild(fragment);
            }
            // Applica lo zoom corrente (se lo slider esiste)
            if (zoomSlider) {
                applyZoom();
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
        const fragment = document.createDocumentFragment();

        const showAllLi = createElement('li', null, 'Mostra tutte');
        showAllLi.dataset.categoryTarget = 'all';
        showAllLi.setAttribute('role', 'button');
        showAllLi.tabIndex = 0;
        showAllLi.addEventListener('click', handleCategoryClick);
        showAllLi.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(e); });
        fragment.appendChild(showAllLi);

        ricettarioData.categorie.forEach(categoria => {
            if (!categoria || !categoria.nome) return; // Salta categorie non valide
            const li = createElement('li', null, categoria.nome);
            li.dataset.categoryName = categoria.nome;
            li.dataset.categoryTarget = 'specific';
            li.setAttribute('role', 'button');
            li.tabIndex = 0;
            li.addEventListener('click', handleCategoryClick);
            li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(e); });
            fragment.appendChild(li);
        });

        categoryList.innerHTML = '';
        categoryList.appendChild(fragment);
    }

    /** Aggiorna lo stato attivo della categoria e l'indicatore "river". */
    function setActiveCategory(targetLi) {
        const categoryListElement = categoryList;
        if (!categoryListElement) return;

        // Rimuovi attivo da precedente
        if (activeCategoryElement && activeCategoryElement !== targetLi) {
            activeCategoryElement.classList.remove('active-category');
        }
        // Rimuovi sempre il river prima di riposizionarlo
        categoryListElement.classList.remove('river-active');

        activeCategoryElement = null; // Resetta

        if (targetLi) {
            targetLi.classList.add('active-category');
            activeCategoryElement = targetLi;

            // Mostra river solo per categorie specifiche, calcolando posizione
            if (targetLi.dataset.categoryTarget === 'specific') {
                // Usa requestAnimationFrame per assicurare che il layout sia calcolato
                requestAnimationFrame(() => {
                    const offsetTop = targetLi.offsetTop;
                    const liHeight = targetLi.offsetHeight;
                    // Imposta le variabili CSS
                    categoryListElement.style.setProperty('--river-offset', `${offsetTop}px`);
                    categoryListElement.style.setProperty('--sidebar-li-height', `${liHeight}px`);
                    categoryListElement.classList.add('river-active');
                });
            }
        }
        // Se targetLi è null o "Mostra tutte", il river rimane nascosto.
    }


    /** Aggiorna il contatore delle ricette. */
    function updateRecipeCount() {
        if (recipeCounterElement) {
            const totalRecipes = allRicette.length;
            recipeCounterElement.textContent = `${totalRecipes} Ricett${totalRecipes === 1 ? 'a' : 'e'}`; // Plurale corretto
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
        fetch('ricettario.json') // Assicurati che il percorso sia corretto
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Errore HTTP: ${response.status} ${response.statusText}. Controlla che 'ricettario.json' esista e sia accessibile.`);
                }
                return response.json();
            })
            .then(data => {
                ricettarioData = data;
                processRicette();
                updateRecipeCount();
                renderCategories();
                renderGallery(); // Render iniziale senza filtri
                if (categoryList && categoryList.firstChild) {
                    setActiveCategory(categoryList.firstChild); // Imposta 'Mostra tutte' attivo
                }
            })
            .catch(error => {
                console.error('Errore caricamento/parsing ricettario.json:', error);
                displayErrorMessage(`Impossibile caricare le ricette: ${error.message}`);
                if (recipeCounterElement) {
                    recipeCounterElement.textContent = 'Errore';
                    recipeCounterElement.classList.add('error');
                }
            });
    }

    /** Processa i dati JSON per creare un array piatto `allRicette`. */
    function processRicette() {
        allRicette = [];
        if (!ricettarioData?.categorie || !Array.isArray(ricettarioData.categorie)) {
            console.warn("Dati ricettario mancanti o malformati: nessuna categoria trovata.");
            return;
        }
        ricettarioData.categorie.forEach(categoria => {
            if (!categoria || !categoria.nome) {
                console.warn("Trovata categoria senza nome, verrà saltata:", categoria);
                return;
            }
            if (categoria.ricette && Array.isArray(categoria.ricette)) {
                categoria.ricette.forEach(ricetta => {
                    if (!ricetta || !ricetta.nome) {
                        console.warn(`Trovata ricetta senza nome nella categoria '${categoria.nome}', verrà saltata:`, ricetta);
                        return;
                    }
                    allRicette.push({ ...ricetta, categoria: categoria.nome });
                });
            } else {
                console.warn(`Categoria '${categoria.nome}' non ha un array 'ricette' valido.`);
            }
        });
    }

    const sectionRenderers = {
        'ingredienti': renderIngredienti,
        'procedimento': renderProcedimento,
        'varianti': renderVarianti,
        'utilizzo': renderUsi, // oppure renderUtilizzo, se lo preferisci
        'usi': renderUsi,
        'struttura_generale': renderStruttura,
        'esempi_personalizzazione': renderEsempi,
        'tips_tecnici': (data) => renderGenericListSection(data, 'Tips Tecnici'),
        'note_tecniche': (data) => renderGenericListSection(data, 'Note Tecniche'),
        'note_finali': (data) => renderGenericListSection(data, 'Note Finali'),
        'note': (data) => renderGenericListSection(data, 'Note'),
        'note_dello_chef': (data) => renderGenericListSection(data, 'Note dello Chef'),
        'note_di_degustazione': (data) => renderGenericListSection(data, 'Note di Degustazione'),
        'finitura_consigliata': (data) => renderGenericListSection(data, 'Finitura Consigliata'),
        'pairing_consigliato': renderPairing,
        'vino_abbinato': (data) => data ? createElement('p', 'vino-info section-container', `Vino consigliato: ${data}`) : null,
        'attrezzature': (data) => renderGenericListSection(data, 'Attrezzature'),
        'presentazione_consigliata': (data) => renderGenericListSection(data, 'Presentazione Consigliata'),
        'impiattamento': (data) => renderGenericListSection(data, 'Impiattamento', 'ol'),
        'assemblaggio_del_piatto': (data) => renderGenericListSection(data, 'Assemblaggio del Piatto', 'ol')
        // Aggiungi altre chiavi se necessario
      };
      

    /** Apre il modale con i dettagli della ricetta specificata. */
    function openModal(ricetta) {
        if (!modal || !modalContent || !ricetta) {
            console.error("Impossibile aprire il modale: elementi mancanti o ricetta non valida.");
            return;
        }
        modalContent.innerHTML = ''; // Pulisci subito

        // Crea il wrapper per le pagine
        const pagesWrapper = createElement('div', 'modal-pages-wrapper');

        // Pagina 1: titolo, descrizione e foto
        const page1 = createElement('div', 'modal-page modal-page-1 active');
        // Inserisci header, descrizione
        const header = createElement('div', 'modal-header');
        const titleH2 = createElement('h2', null, ricetta.nome);
        const closeButton = createElement('button', 'modal-close-button', '\u00D7', { 'aria-label': 'Chiudi dettagli ricetta' });
        closeButton.addEventListener('click', closeModal);
        header.appendChild(titleH2);
        header.appendChild(closeButton);
        page1.appendChild(header);

        // Aggiungi descrizione
        if (ricetta.descrizione) {
            page1.appendChild(createElement('p', 'descrizione-info', ricetta.descrizione));
        }

        // Aggiungi foto
        const imageContainer = createElement('div', 'modal-image-container');
        const imageFilename = generateImageFilename(ricetta.nome);
        const imageUrl = `img/${imageFilename}${IMAGE_EXTENSION}`;
        const recipeImage = createElement('img');
        recipeImage.src = imageUrl;
        recipeImage.alt = `Immagine: ${ricetta.nome}`;
        recipeImage.loading = 'lazy';
        recipeImage.onerror = () => {
            imageContainer.innerHTML = '';
            const errorMsg = createElement('p', 'image-error', 'Immagine non disponibile');
            imageContainer.appendChild(errorMsg);
            imageContainer.style.backgroundColor = 'var(--color-surface-alt)';
        };
        imageContainer.appendChild(recipeImage);
        page1.appendChild(imageContainer);

        // Pagina 2: dettagli della ricetta
        const page2 = createElement('div', 'modal-page modal-page-2');
        // Crea il container per il corpo del modal e inserisci le altre sezioni
        const modalBody = createElement('div', 'modal-body');
        // Qui cicli sulle altre proprietà della ricetta (ingredienti, procedimento, ecc.)
        // Cicla sulle proprietà della ricetta per renderizzare le sezioni aggiuntive
        for (const key in ricetta) {
            if (['nome', 'descrizione', 'categoria'].includes(key)) continue; // Salta quelle di base

            if (ricetta[key] && sectionRenderers.hasOwnProperty(key)) {
                const renderer = sectionRenderers[key];
                const sectionElement = renderer(ricetta[key]);
                if (sectionElement) {
                    modalBody.appendChild(sectionElement);
                }
            } else if (ricetta[key]) {
                // Se non esiste un renderer specifico, usa un fallback generico
                const fallback = renderGenericListSection(ricetta[key], key.charAt(0).toUpperCase() + key.slice(1));
                if (fallback) {
                    modalBody.appendChild(fallback);
                }
            }
        }

        // ... aggiungi altre sezioni secondo la tua mappa sectionRenderers
        page2.appendChild(modalBody);

        // Aggiungi le due pagine al wrapper
        pagesWrapper.appendChild(page1);
        pagesWrapper.appendChild(page2);

        // Aggiungi il wrapper al modalContent
        modalContent.appendChild(pagesWrapper);

        // Pulsanti di navigazione
        const navContainer = createElement('div', 'modal-nav');
        const prevBtn = createElement('button', 'nav-button', 'Indietro');
        const nextBtn = createElement('button', 'nav-button', 'Avanti');
        navContainer.appendChild(prevBtn);
        navContainer.appendChild(nextBtn);
        modalContent.appendChild(navContainer);

        // Imposta listener per la navigazione (vedi snippet JS sopra)
        currentPage = 0; // Reset pagina
        prevBtn.addEventListener('click', () => updatePage(currentPage - 1));
        nextBtn.addEventListener('click', () => updatePage(currentPage + 1));

        // Aggiungi listener per swipe come mostrato sopra

        // Mostra il modale
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            (titleH2 || closeButton)?.focus();
        }, 150);
    }



    /** Chiude il modale e ripristina lo scroll del body. */
    function closeModal() {
        if (!modal) return;
        modal.style.opacity = '0'; // Avvia transizione uscita
        modal.style.pointerEvents = 'none'; // Disabilita interazioni durante uscita

        // Aspetta la fine della transizione prima di nascondere e pulire
        setTimeout(() => {
            modal.style.display = 'none';
            bodyElement.style.overflow = ''; // Riabilita scroll
            modalContent.innerHTML = ''; // Pulisci contenuto
            // Resetta stile per prossima apertura
            modal.style.opacity = '';
            modal.style.pointerEvents = '';
        }, 300); // Deve corrispondere alla durata della transizione CSS (es. 0.3s)
    }

    /** Applica lo zoom corrente alla galleria. */
    function applyZoom() {
        if (!zoomSlider || !gallery) return;
        requestAnimationFrame(() => {
            const zoomLevel = parseFloat(zoomSlider.value) || 1;
            const minWidth = BASE_CARD_WIDTH * zoomLevel;
            // Assicurati che minWidth non sia troppo piccolo o grande
            const clampedMinWidth = Math.max(150, Math.min(minWidth, 600)); // Esempio: limiti 150px - 600px
            gallery.style.gridTemplateColumns = `repeat(auto-fit, minmax(${clampedMinWidth}px, 1fr))`;
        });
    }

    // =============================================
    // GESTORI EVENTI
    // =============================================

    /** Gestore unico per i click sugli item della categoria */
    function handleCategoryClick(event) {
        const targetLi = event.currentTarget;
        if (!targetLi) return;

        setActiveCategory(targetLi);

        const categoryName = targetLi.dataset.categoryName || '';
        const targetType = targetLi.dataset.categoryTarget;

        if (searchInput) searchInput.value = ''; // Pulisci sempre la ricerca quando si clicca una categoria

        if (targetType === 'all') {
            renderGallery(''); // Mostra tutto, nessuna categoria specifica
        } else if (categoryName) {
            renderGallery('', categoryName); // Filtra per categoria specifica, nessun filtro di ricerca
        }

        // Chiudi menu mobile se aperto (controlla se la classe esiste)
        if (bodyElement.classList.contains('menu-open')) {
            toggleMobileMenu();
        }
    }

    /** Gestisce l'apertura/chiusura del menu mobile. */
    function toggleMobileMenu() {
        const currentlyOpen = bodyElement.classList.contains('menu-open');
        const shouldBeOpen = !currentlyOpen;

        bodyElement.classList.toggle('menu-open', shouldBeOpen);

        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', shouldBeOpen ? 'true' : 'false');
            // Aggiungi/Rimuovi classe per styling bottone attivo (opzionale)
            menuToggle.classList.toggle('is-active', shouldBeOpen);
        }
        // Non serve più la variabile globale isMenuOpen
    }


    // =============================================
    // EVENT LISTENERS
    // =============================================

    // Zoom Slider
    if (zoomSlider && gallery) {
        zoomSlider.addEventListener('input', applyZoom); // Usa la funzione helper
        applyZoom(); // Applica zoom iniziale
    }

    // Search Input
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => { // Debounce leggero
                setActiveCategory(null);
                renderGallery(searchInput.value);
            }, 250); // Attendi 250ms dopo l'ultimo input
        });
    }

    // Modal: Chiusura (Overlay, Tasto Esc) - Bottone X gestito in openModal
    if (modal) {
        modal.addEventListener('click', (event) => {
            // Chiudi solo se si clicca sull'overlay stesso, non sui figli
            if (event.target === modal) {
                closeModal();
            }
        });
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display !== 'none') {
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

    // Menu Mobile: Overlay (se presente e separato)
    if (menuOverlay) {
        menuOverlay.addEventListener('click', () => {
            if (bodyElement.classList.contains('menu-open')) {
                toggleMobileMenu();
            }
        });
    }

    // --- Inizializzazione Applicazione ---
    loadRicettario();

}); // Fine DOMContentLoaded
