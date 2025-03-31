document.addEventListener('DOMContentLoaded', function () {
    // --- Selezione Elementi DOM ---
    const gallery = document.getElementById('gallery');
    const zoomSlider = document.getElementById('zoomSlider');
    const searchInput = document.getElementById('searchInput');
    const categoryList = document.getElementById('categoryList');
    const modal = document.getElementById('recipeModal');
    const modalContent = document.getElementById('modalContent');
    // Seleziona l'elemento per il contatore delle ricette
    const recipeCounterElement = document.getElementById('recipe-counter');

    // --- Stato Applicazione ---
    let ricettarioData = null;
    let allRicette = [];
    let activeCategoryElement = null;

    // --- Costanti ---
    const BASE_CARD_WIDTH = 200;
    const IMAGE_EXTENSION = '.jpeg'; // Imposta l'estensione corretta qui (es. .jpg, .jpeg, .webp)

    // --- Helper Function ---
    /**
     * Crea un elemento HTML con classe, testo e attributi opzionali.
     */
    function createElement(tag, className, textContent, attributes) {
        const element = document.createElement(tag);
        if (className) {
            className.split(' ').forEach(cls => {
                if (cls) element.classList.add(cls.trim()); // Trim per sicurezza
            });
        }
        if (textContent) element.textContent = textContent;
        if (attributes) {
            for (const key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                    element.setAttribute(key, attributes[key]);
                }
            }
        }
        return element;
    }

    /**
     * Genera un nome file sicuro per l'immagine da un nome di ricetta.
     * Converte in minuscolo, sostituisce spazi/caratteri speciali con UNDERSCORE.
     */
    function generateImageFilename(recipeName) {
        if (!recipeName) return 'default_placeholder'; // Fallback con underscore
        return recipeName
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Rimuove accenti
            .replace(/[^a-z0-9_]+/g, '_')                   // Sostituisce con _
            .replace(/_+/g, '_')                            // Rimuove _ multipli
            .replace(/^_*|_*$/g, '');                       // Rimuove _ iniziali/finali
    }

    // --- Funzioni di Rendering Specifiche per il Modal ---

    /**
 * Renderizza la sezione Ingredienti nel modal (NUOVA VERSIONE UNIFICATA).
 */
    function renderIngredienti(ingredientiData) {
        // ingredientiData è ora SEMPRE un array di oggetti gruppo
        if (!Array.isArray(ingredientiData) || ingredientiData.length === 0) return null;

        const containerDiv = createElement('div', 'ingredients section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Ingredienti')); // Titolo generico
        let hasContent = false;

        ingredientiData.forEach(gruppo => {
            // Mostra il nome del gruppo se presente
            if (gruppo.nome_gruppo) {
                const gruppoNomeFormatted = gruppo.nome_gruppo.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                containerDiv.appendChild(createElement('h4', 'subsection-title', gruppoNomeFormatted));
            }

            // Processa la lista ingredienti del gruppo (che è sempre un array di oggetti)
            if (Array.isArray(gruppo.lista_ingredienti) && gruppo.lista_ingredienti.length > 0) {
                const listUl = createElement('ul');
                gruppo.lista_ingredienti.forEach(item => {
                    // Costruisce la stringa dell'ingrediente
                    let text = '';
                    if (item.ingrediente) { // Assicurati che l'ingrediente esista
                        const quantita = item.quantita || ''; // Gestisce quantità mancante
                        const per = item.per ? ` (per ${item.per})` : '';
                        const nota = item.note ? ` (${item.note})` : '';
                        text = `${quantita} ${item.ingrediente}${per}${nota}`.trim();
                    }
                    if (text) {
                        listUl.appendChild(createElement('li', null, text));
                        hasContent = true;
                    }
                });
                if (listUl.hasChildNodes()) {
                    containerDiv.appendChild(listUl);
                }
            }
        });

        return hasContent ? containerDiv : null;
    }


    /**
     * Renderizza la sezione Procedimento nel modal (NUOVA VERSIONE UNIFICATA).
     */
    function renderProcedimento(procedimentoData) {
        // procedimentoData è ora SEMPRE un array di oggetti fase
        if (!Array.isArray(procedimentoData) || procedimentoData.length === 0) return null;

        const containerDiv = createElement('div', 'procedure section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Procedimento')); // Titolo generico
        let hasContent = false;

        procedimentoData.forEach(faseObj => {
            // Mostra il nome della fase se presente
            if (faseObj.fase) {
                containerDiv.appendChild(createElement('h4', 'subsection-title', faseObj.fase));
            }

            // Processa i passaggi della fase (che è sempre un array di stringhe)
            if (Array.isArray(faseObj.passaggi) && faseObj.passaggi.length > 0) {
                const listOl = createElement('ol'); // Usa sempre lista ordinata per i passaggi
                faseObj.passaggi.forEach(step => {
                    if (typeof step === 'string' && step.trim() !== '') {
                        listOl.appendChild(createElement('li', null, step));
                        hasContent = true;
                    }
                });
                if (listOl.hasChildNodes()) {
                    containerDiv.appendChild(listOl);
                }
            }
        });

        return hasContent ? containerDiv : null;
    }

    /**
  * Renderizza la sezione Varianti nel modal.
  * CHIAMA le versioni aggiornate di renderIngredienti e renderProcedimento.
  */
    function renderVarianti(variantiData) {
        // variantiData è l'array ricetta.varianti
        if (!Array.isArray(variantiData) || variantiData.length === 0) return null;

        const containerDiv = createElement('div', 'varianti section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Varianti'));
        let hasContent = false; // Flag per vedere se c'è almeno una variante valida

        variantiData.forEach(variante => {
            const varianteDiv = createElement('div', 'sottoricetta subsection-container');
            let varianteHasContent = false; // Flag per questa specifica variante

            // Mostra il nome della variante
            if (variante.nome) {
                varianteDiv.appendChild(createElement('h4', 'subsection-title', variante.nome));
                varianteHasContent = true;
            }

            // Renderizza ingredienti della variante (USA LA NUOVA FUNZIONE)
            if (variante.ingredienti) { // Controlla se la chiave esiste
                const ingDiv = renderIngredienti(variante.ingredienti); // Passa l'array di gruppi ingredienti
                if (ingDiv) {
                    varianteDiv.appendChild(ingDiv);
                    varianteHasContent = true;
                }
            }

            // Renderizza procedimento della variante (USA LA NUOVA FUNZIONE)
            if (variante.procedimento) { // Controlla se la chiave esiste
                const procDiv = renderProcedimento(variante.procedimento); // Passa l'array di fasi
                if (procDiv) {
                    varianteDiv.appendChild(procDiv);
                    varianteHasContent = true;
                }
            }

            // Renderizza eventuali altri campi specifici della variante
            if (variante.applicazioni) {
                varianteDiv.appendChild(createElement('p', 'applicazioni-info', `Applicazioni: ${variante.applicazioni}`));
                varianteHasContent = true;
            }
            if (variante.descrizione) { // Aggiunto controllo descrizione variante
                varianteDiv.appendChild(createElement('p', 'descrizione-info', variante.descrizione));
                varianteHasContent = true;
            }
            // Aggiungi qui altri campi specifici delle varianti se necessario...


            // Aggiunge il div della variante al contenitore principale solo se ha contenuto
            if (varianteHasContent) {
                containerDiv.appendChild(varianteDiv);
                hasContent = true; // Imposta il flag generale a true
            }
        });

        // Ritorna il contenitore solo se almeno una variante aveva contenuto
        return hasContent ? containerDiv : null;
    }

    /**
    * Renderizza la sezione Utilizzo nel modal.
    */
    function renderUtilizzo(utilizzoData) {
        if (!Array.isArray(utilizzoData) || utilizzoData.length === 0) return null;
        const containerDiv = createElement('div', 'utilizzo section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Utilizzo'));
        const listUl = createElement('ul');
        let hasContent = false;
        utilizzoData.forEach(item => {
            if (item.applicazione && item.dosi) {
                const listItem = createElement('li');
                listItem.innerHTML = `<strong>${item.applicazione}:</strong> ${item.dosi}`;
                listUl.appendChild(listItem); hasContent = true;
            }
        });
        if (hasContent) containerDiv.appendChild(listUl);
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Struttura Generale nel modal.
     */
    function renderStruttura(strutturaData) {
        if (!Array.isArray(strutturaData) || strutturaData.length === 0) return null;
        const containerDiv = createElement('div', 'struttura_generale section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Struttura Generale'));
        let hasContent = false;
        strutturaData.forEach(item => {
            if (item.fase) {
                const faseDiv = createElement('div', 'fase subsection-container');
                faseDiv.appendChild(createElement('h4', 'subsection-title', item.fase));
                if (item.ingredienti_base) faseDiv.appendChild(createElement('p', null, `Ingredienti base: ${item.ingredienti_base}`));
                if (item.ingredienti) { const ingDiv = renderIngredienti(item.ingredienti); if (ingDiv) faseDiv.appendChild(ingDiv); }
                if (item.procedimento) { const procDiv = renderProcedimento(item.procedimento); if (procDiv) faseDiv.appendChild(procDiv); }
                containerDiv.appendChild(faseDiv); hasContent = true;
            }
        });
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Esempi di Personalizzazione nel modal.
     */
    function renderEsempi(esempiData) {
        if (!Array.isArray(esempiData) || esempiData.length === 0) return null;
        const containerDiv = createElement('div', 'esempi_personalizzazione section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Esempi Personalizzazione'));
        const listUl = createElement('ul');
        let hasContent = false;
        esempiData.forEach(esempio => {
            if (esempio.ingrediente) {
                const listItem = createElement('li', 'subsection-container');
                listItem.appendChild(createElement('h5', 'subsection-title', esempio.ingrediente));
                if (esempio.note_umami_aromi_dominanti) listItem.appendChild(createElement('p', null, `Note Umami/Aromi Dominanti: ${esempio.note_umami_aromi_dominanti}`));
                if (esempio.suggerimenti) listItem.appendChild(createElement('p', null, `Suggerimenti: ${esempio.suggerimenti}`));
                listUl.appendChild(listItem); hasContent = true;
            }
        });
        if (hasContent) containerDiv.appendChild(listUl);
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Tips Tecnici nel modal.
     */
    function renderTips(tipsData) {
        if (!Array.isArray(tipsData) || tipsData.length === 0) return null;
        const containerDiv = createElement('div', 'tips_tecnici section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Tips Tecnici'));
        const listUl = createElement('ul');
        let hasContent = false;
        tipsData.forEach(tip => {
            if (typeof tip === 'string' && tip.trim() !== '') { listUl.appendChild(createElement('li', null, tip)); hasContent = true; }
        });
        if (hasContent) containerDiv.appendChild(listUl);
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza sezioni di Note generiche nel modal.
     */
    function renderNote(noteData, sectionKey) {
        if (!noteData || (Array.isArray(noteData) && noteData.length === 0)) return null;
        const className = sectionKey.toLowerCase();
        const titleText = sectionKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        const containerDiv = createElement('div', `${className} section-container`);
        containerDiv.appendChild(createElement('h3', 'section-title', titleText));
        let hasContent = false;
        if (Array.isArray(noteData)) {
            const listUl = createElement('ul');
            noteData.forEach(item => {
                if (typeof item === 'string' && item.trim() !== '') { listUl.appendChild(createElement('li', null, item)); hasContent = true; }
            });
            if (hasContent) containerDiv.appendChild(listUl);
        } else if (typeof noteData === 'string' && noteData.trim() !== '') {
            containerDiv.appendChild(createElement('p', null, noteData)); hasContent = true;
        }
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Finitura Consigliata nel modal.
     */
    function renderFinitura(finituraData) {
        if (!Array.isArray(finituraData) || finituraData.length === 0) return null;
        const containerDiv = createElement('div', 'finitura_consigliata section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Finitura Consigliata'));
        const listUl = createElement('ul');
        let hasContent = false;
        finituraData.forEach(item => {
            if (typeof item === 'string' && item.trim() !== '') { listUl.appendChild(createElement('li', null, item)); hasContent = true; }
        });
        if (hasContent) containerDiv.appendChild(listUl);
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Pairing Consigliato nel modal.
     */
    function renderPairing(pairingData) {
        if (!Array.isArray(pairingData) || pairingData.length === 0) return null;
        const containerDiv = createElement('div', 'pairing_consigliato section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Pairing Consigliato'));
        let hasContent = false;
        pairingData.forEach(item => {
            if (item.bevanda) {
                const itemDiv = createElement('div', 'subsection-container');
                itemDiv.appendChild(createElement('p', null, `Bevanda: ${item.bevanda}`));
                if (item.note) itemDiv.appendChild(createElement('p', 'pairing-note', `Note: ${item.note}`));
                containerDiv.appendChild(itemDiv); hasContent = true;
            }
        })
        return hasContent ? containerDiv : null;
    }


    // --- Funzioni Principali dell'Applicazione ---

    /**
     * Carica il file JSON del ricettario.
     */
    function loadRicettario() {
        fetch('ricettario.json')
            .then(response => {
                if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
                return response.json();
            })
            .then(data => {
                ricettarioData = data;
                processRicette(); // Popola allRicette
                updateRecipeCount(); // Aggiorna il contatore DOPO aver processato
                renderCategories();
                renderGallery(); // Mostra tutte le ricette all'inizio
            })
            .catch(error => {
                console.error('Errore nel caricamento del ricettario:', error);
                displayErrorMessage('Impossibile caricare le ricette. Riprova più tardi.');
                // Aggiorna contatore in caso di errore
                if (recipeCounterElement) {
                    recipeCounterElement.textContent = 'Errore conteggio';
                    recipeCounterElement.classList.add('error');
                }
            });
    }

    /**
     * Processa i dati per creare un array piatto di tutte le ricette.
     */
    function processRicette() {
        allRicette = [];
        if (!ricettarioData?.categorie) return;
        ricettarioData.categorie.forEach(categoria => {
            if (categoria.ricette && Array.isArray(categoria.ricette)) {
                categoria.ricette.forEach(ricetta => {
                    allRicette.push({ ...ricetta, categoria: categoria.nome });
                });
            }
        });
        // console.log(`Processate ${allRicette.length} ricette totali.`); // Log di debug
    }

    /**
     * Aggiorna il display del contatore ricette nell'header.
     */
    function updateRecipeCount() {
        if (recipeCounterElement) {
            const totalRecipes = allRicette.length;
            // Modifica qui il formato del testo se vuoi
            recipeCounterElement.textContent = `Ricette: ${totalRecipes}`;
            recipeCounterElement.classList.remove('error');
        } else {
            console.warn("Elemento contatore ricette non trovato (#recipe-counter).");
        }
    }

    /**
     * Renderizza la galleria delle ricette, applicando un filtro.
     */
    function renderGallery(filter = '') {
        if (!gallery) return;
        gallery.innerHTML = ''; // Pulisce la galleria
        const lowerCaseFilter = filter.toLowerCase().trim();

        // Filtra sull'array globale allRicette
        const filteredRicette = allRicette.filter(ricetta =>
            ricetta.nome.toLowerCase().includes(lowerCaseFilter) ||
            (ricetta.descrizione && ricetta.descrizione.toLowerCase().includes(lowerCaseFilter)) ||
            ricetta.categoria.toLowerCase().includes(lowerCaseFilter)
        );

        if (filteredRicette.length === 0) {
            gallery.innerHTML = '<p>Nessuna ricetta trovata.</p>';
            // Potresti aggiornare il contatore qui per mostrare "0 risultati"
            // if(recipeCounterElement) recipeCounterElement.textContent = `Ricette: 0 / ${allRicette.length}`;
            return;
        }

        // Aggiorna il contatore per mostrare il numero di ricette VISUALIZZATE (opzionale)
        // if(recipeCounterElement) recipeCounterElement.textContent = `Ricette: ${filteredRicette.length} / ${allRicette.length}`;

        // Crea le card per le ricette filtrate
        filteredRicette.forEach(createAndAppendCard);
    }

    /**
    * Crea una singola card per una ricetta e la aggiunge alla galleria.
    */
    function createAndAppendCard(ricetta) {
        if (!gallery) return;
        const card = createElement('div', 'card');
        const imageFilename = generateImageFilename(ricetta.nome);
        const imageUrl = `img/${imageFilename}${IMAGE_EXTENSION}`; // Usa la costante per l'estensione
        // Imposta una variabile CSS per l'URL dell'immagine
        card.style.setProperty('--card-bg-image', `url('${imageUrl}')`);
        card.classList.add('card-has-image');
        const contentWrapper = createElement('div', 'card-content-wrapper');
        contentWrapper.innerHTML = `<h3></h3><p></p><span class="category-tag"></span>`;
        contentWrapper.querySelector('h3').textContent = ricetta.nome;
        contentWrapper.querySelector('p').textContent = ricetta.descrizione || '';
        contentWrapper.querySelector('.category-tag').textContent = `Categoria: ${ricetta.categoria}`;
        card.appendChild(contentWrapper);
        card.addEventListener('click', () => openModal(ricetta));
        gallery.appendChild(card);
    }

    /**
     * Renderizza la lista delle categorie nella sidebar.
     */
    function renderCategories() {
        if (!categoryList || !ricettarioData?.categorie) return;
        categoryList.innerHTML = '';
        const showAllLi = createElement('li', null, 'Mostra tutte');
        showAllLi.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            setActiveCategory(null);
            renderGallery(''); // Mostra tutte
        });
        categoryList.appendChild(showAllLi);
        ricettarioData.categorie.forEach(categoria => {
            const li = createElement('li', null, categoria.nome);
            li.dataset.categoryName = categoria.nome;
            li.addEventListener('click', (event) => {
                renderGallery(categoria.nome); // Filtra per categoria
                setActiveCategory(event.currentTarget);
            });
            categoryList.appendChild(li);
        });
    }

    /**
     * Aggiorna lo stato visivo della categoria attiva.
     */
    function setActiveCategory(targetElement) {
        const categoryListElement = document.getElementById('categoryList');
        if (!categoryListElement) return; // Sicurezza

        // Rimuovi stato attivo precedente
        if (activeCategoryElement) {
            activeCategoryElement.classList.remove('active-category');
        }

        if (targetElement) {
            // Categoria specifica selezionata
            targetElement.classList.add('active-category');
            activeCategoryElement = targetElement;

            // --- Gestione Flowing River ---
            const offsetTop = targetElement.offsetTop;
            const liHeight = targetElement.offsetHeight; // Prendi l'altezza reale

            categoryListElement.style.setProperty('--river-offset', `${offsetTop}px`);
            categoryListElement.style.setProperty('--sidebar-li-height', `${liHeight}px`); // Aggiorna altezza dinamicamente
            categoryListElement.classList.add('river-active'); // Mostra il river

        } else {
            // "Mostra tutte" o Ricerca (nessuna categoria attiva)
            activeCategoryElement = null;
            categoryListElement.classList.remove('river-active'); // Nascondi il river
            // Potresti opzionalmente resettare l'offset a 0, anche se non visibile
            // categoryListElement.style.setProperty('--river-offset', '0px');
        }
    }

    /**
     * Apre il modal con i dettagli della ricetta.
     */
    /**
     * Apre il modal con i dettagli della ricetta, con layout a due colonne (testo a sx, immagine a dx).
     */
    function openModal(ricetta) {
        if (!modal || !modalContent) return;
        modalContent.innerHTML = ''; // Pulisce contenuto precedente

        // --- NUOVO: Contenitori per layout a due colonne ---
        const textWrapper = createElement('div', 'modal-text-content');
        const imageContainer = createElement('div', 'modal-image-container');
        // ----------------------------------------------------

        // --- Contenuto Testuale (Sinistra) ---
        // Crea Header (come prima, ma lo appenderemo a textWrapper)
        const modalHeader = createElement('div', 'modal-header');
        const titleH2 = createElement('h2', null, ricetta.nome);
        const closeButton = createElement('button', 'modal-close-button', '\u00D7');
        closeButton.setAttribute('aria-label', 'Chiudi modal');
        modalHeader.appendChild(titleH2);
        modalHeader.appendChild(closeButton);
        textWrapper.appendChild(modalHeader); // Appendi header al wrapper testo

        // Crea Body (come prima, ma lo appenderemo a textWrapper)
        const modalBody = createElement('div', 'modal-body');
        // Aggiungi categoria e descrizione al body
        modalBody.appendChild(createElement('p', 'categoria-info')).innerHTML = `<strong>Categoria:</strong> ${ricetta.categoria}`;
        modalBody.appendChild(createElement('p', 'descrizione-info', ricetta.descrizione || 'Nessuna descrizione disponibile.'));

        // Definisce le sezioni da renderizzare (come prima)
        const sections = [
            { key: 'ingredienti', renderFunc: renderIngredienti },
            { key: 'procedimento', renderFunc: renderProcedimento },
            { key: 'varianti', renderFunc: renderVarianti },
            { key: 'utilizzo', renderFunc: renderUtilizzo },
            { key: 'struttura_generale', renderFunc: renderStruttura },
            { key: 'esempi_personalizzazione', renderFunc: renderEsempi },
            { key: 'tips_tecnici', renderFunc: renderTips },
            { key: 'note_tecniche', renderFunc: (data) => renderNote(data, 'note_tecniche') },
            { key: 'note_finali', renderFunc: (data) => renderNote(data, 'note_finali') },
            { key: 'finitura_consigliata', renderFunc: renderFinitura },
            { key: 'pairing_consigliato', renderFunc: renderPairing },
        ];

        // Itera e aggiunge sezioni esistenti al modalBody (come prima)
        sections.forEach(section => {
            if (ricetta[section.key] && (!Array.isArray(ricetta[section.key]) || ricetta[section.key].length > 0)) {
                const sectionElement = section.renderFunc(ricetta[section.key]);
                if (sectionElement) { modalBody.appendChild(sectionElement); }
            }
        });

        // Aggiunge campi extra al modalBody (come prima)
        if (ricetta.vino_abbinato) { modalBody.appendChild(createElement('p', 'vino-info section-container', `Vino consigliato: ${ricetta.vino_abbinato}`)); }

        textWrapper.appendChild(modalBody); // Appendi body al wrapper testo
        // --- Fine Contenuto Testuale ---


        // --- Contenuto Immagine (Destra) ---
        const imageFilename = generateImageFilename(ricetta.nome);
        const imageUrl = `img/${imageFilename}${IMAGE_EXTENSION}`;
        console.log("Tentativo di caricare l'immagine:", imageUrl);

        // Crea elemento immagine
        const recipeImage = createElement('img');
        recipeImage.src = imageUrl;
        recipeImage.alt = `Immagine di ${ricetta.nome}`;
        // Aggiungi un fallback se l'immagine non carica (opzionale ma consigliato)
        recipeImage.onerror = () => {
            imageContainer.innerHTML = '<p class="image-error">Immagine non disponibile</p>'; // Mostra messaggio errore
            imageContainer.style.backgroundColor = 'var(--color-surface-alt)'; // Sfondo placeholder
        };

        imageContainer.appendChild(recipeImage);
        // --- Fine Contenuto Immagine ---


        // --- Assembla il Modal ---
        modalContent.appendChild(textWrapper);   // Aggiungi wrapper testo
        modalContent.appendChild(imageContainer); // Aggiungi container immagine

        // Mostra il modal (come prima)
        modal.style.display = 'flex'; // Usa flex per centrare .modal-content
        titleH2.focus(); // Focus per accessibilità
    }

    /**
     * Chiude il modal.
     */
    function closeModal() {
        if (!modal) return;
        modal.style.display = 'none';
        modalContent.innerHTML = ''; // Pulisce contenuto
    }

    /**
    * Mostra un messaggio di errore nella galleria.
    */
    function displayErrorMessage(message) {
        if (gallery) {
            gallery.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

    // --- Event Listeners ---
    // Search Input
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            setActiveCategory(null); // Deseleziona categoria quando si cerca
            renderGallery(searchInput.value);
        });
    }

    // Chiusura Modal (Delegazione)
    if (modal) {
        modal.addEventListener('click', function (event) {
            // Chiude cliccando sull'overlay
            if (event.target === modal) { closeModal(); }
            // Chiude cliccando sul bottone '.modal-close-button'
            if (event.target.closest('.modal-close-button')) { closeModal(); }
        });
    }

    // --- Inizializzazione ---
    loadRicettario(); // Avvia il caricamento dei dati
});
