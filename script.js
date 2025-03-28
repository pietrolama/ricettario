document.addEventListener('DOMContentLoaded', function () {
    // --- Selezione Elementi DOM ---
    const gallery = document.getElementById('gallery');
    const zoomSlider = document.getElementById('zoomSlider');
    const searchInput = document.getElementById('searchInput');
    const categoryList = document.getElementById('categoryList');
    const modal = document.getElementById('recipeModal');
    const modalContent = document.getElementById('modalContent');

    // --- Stato Applicazione ---
    let ricettarioData = null;
    let allRicette = [];
    let activeCategoryElement = null;

    // --- Costanti ---
    const BASE_CARD_WIDTH = 200;

    // --- Helper Function (dal vecchio codice) ---
    /**
     * Crea un elemento HTML con classe, testo e attributi opzionali.
     */
    function createElement(tag, className, textContent, attributes) {
        const element = document.createElement(tag);
        if (className) {
            // Supporta più classi separate da spazio
            className.split(' ').forEach(cls => {
                if(cls) element.classList.add(cls);
            });
        }
        if (textContent) element.textContent = textContent;
        if (attributes) {
            for (const key in attributes) {
                if (attributes.hasOwnProperty(key)) { // Buona pratica
                    element.setAttribute(key, attributes[key]);
                }
            }
        }
        return element;
    }


    // --- Funzioni di Rendering Specifiche (dal vecchio codice, leggermente adattate) ---

    /**
     * Renderizza la sezione Ingredienti. Gestisce array e oggetti nel JSON.
     * ADATTATA per usare nomi classi CSS nuovi e struttura dati attesa.
     */
    /**
 * Renderizza la sezione Ingredienti. Gestisce array e oggetti nel JSON.
 * VERSIONE AGGIORNATA per gestire oggetti con sotto-gruppi.
 */
function renderIngredienti(ingredientiData, gruppoNome) {
    // Classe CSS principale per la sezione
    const containerDiv = createElement('div', 'ingredients section-container');

    // Titolo della sezione (usa gruppoNome se passato, altrimenti 'Ingredienti')
    const titoloTesto = gruppoNome
        ? gruppoNome.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) // Formatta nome gruppo
        : 'Ingredienti';
    containerDiv.appendChild(createElement('h3', 'section-title', titoloTesto));

    let hasContent = false; // Flag per sapere se abbiamo aggiunto qualcosa

    // --- CASO 1: ingredientiData è un ARRAY ---
    if (Array.isArray(ingredientiData)) {
        const listUl = createElement('ul');
        ingredientiData.forEach(item => {
            let text = '';
            if (typeof item === 'object' && item !== null && item.ingrediente) {
                const quantita = item.quantita || item.quantità || '';
                const nota = item.note ? ` (${item.note})` : '';
                text = `${quantita} ${item.ingrediente}${nota}`.trim();
            } else if (typeof item === 'string' && item.trim() !== '') {
                text = item;
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
    // --- CASO 2: ingredientiData è un OGGETTO ---
    else if (typeof ingredientiData === 'object' && ingredientiData !== null && !Array.isArray(ingredientiData)) {
        // Itera sulle chiavi dell'oggetto (es. "petto_d_anatra", "rub_classico")
        for (const key in ingredientiData) {
            if (ingredientiData.hasOwnProperty(key)) {
                const sottoGruppoArray = ingredientiData[key];

                // Controlla se il valore associato alla chiave è un array (la lista di ingredienti per quel gruppo)
                if (Array.isArray(sottoGruppoArray) && sottoGruppoArray.length > 0) {
                    // Crea un sotto-titolo per questo gruppo di ingredienti
                    const sottoTitolo = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                    containerDiv.appendChild(createElement('h4', 'subsection-title', sottoTitolo)); // Usa h4 per gerarchia

                    const subListUl = createElement('ul');
                    sottoGruppoArray.forEach(item => {
                        let text = '';
                        if (typeof item === 'object' && item !== null && item.ingrediente) {
                            const quantita = item.quantita || item.quantità || '';
                             // Ignora la chiave "per" specifica della pizza, se presente
                            const per = item.per ? ` (per ${item.per})` : '';
                            const nota = item.note ? ` (${item.note})` : '';
                            text = `${quantita} ${item.ingrediente}${per}${nota}`.trim();
                        } else if (typeof item === 'string' && item.trim() !== '') {
                            text = item;
                        }
                        if (text) {
                            subListUl.appendChild(createElement('li', null, text));
                            hasContent = true;
                        }
                    });
                    if (subListUl.hasChildNodes()) {
                        containerDiv.appendChild(subListUl);
                    }
                }
            }
        }
    }

    // Ritorna il div solo se è stato aggiunto del contenuto effettivo
    return hasContent ? containerDiv : null;
}


    /**
     * Renderizza la sezione Varianti (se presente).
     */
    function renderVarianti(variantiData){
        if (!Array.isArray(variantiData) || variantiData.length === 0) return null;

        const containerDiv = createElement('div', 'varianti section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Varianti'));

        let hasContent = false;
        variantiData.forEach(variante => {
          // Contenitore per ogni singola variante
          const varianteDiv = createElement('div', 'sottoricetta subsection-container'); // Classe per stile annidato
          let varianteHasContent = false;

          // Nome della variante
          if(variante.nome){
              varianteDiv.appendChild(createElement('h4', 'subsection-title', variante.nome));
              varianteHasContent = true;
          }

          // Ingredienti della variante (richiama renderIngredienti)
          if(variante.ingredienti){
            const ingDiv = renderIngredienti(variante.ingredienti); // Non passare nome gruppo qui
            if (ingDiv) {
                varianteDiv.appendChild(ingDiv);
                varianteHasContent = true;
            }
          }

          // Procedimento della variante (richiama renderProcedimento)
          if(variante.procedimento){
              const procDiv = renderProcedimento(variante.procedimento);
              if(procDiv){
                 varianteDiv.appendChild(procDiv);
                 varianteHasContent = true;
              }
          }

          // Applicazioni specifiche della variante
          if (variante.applicazioni) {
            varianteDiv.appendChild(createElement('p', 'applicazioni-info', `Applicazioni: ${variante.applicazioni}`));
            varianteHasContent = true;
          }

          // Aggiunge il div della variante solo se ha qualche contenuto
          if(varianteHasContent){
             containerDiv.appendChild(varianteDiv);
             hasContent = true;
          }
        });

        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Utilizzo (se presente).
     */
    function renderUtilizzo(utilizzoData){
        if (!Array.isArray(utilizzoData) || utilizzoData.length === 0) return null;

        const containerDiv = createElement('div', 'utilizzo section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Utilizzo'));

        const listUl = createElement('ul');
        let hasContent = false;
        utilizzoData.forEach(item => {
            if(item.applicazione && item.dosi){
                const listItem = createElement('li');
                // Usiamo innerHTML qui per semplicità con <strong> o usiamo createElement per span
                listItem.innerHTML = `<strong>${item.applicazione}:</strong> ${item.dosi}`;
                listUl.appendChild(listItem);
                hasContent = true;
            }
        });

        if(hasContent) containerDiv.appendChild(listUl);
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Struttura Generale (se presente).
     */
    function renderStruttura(strutturaData){
         if (!Array.isArray(strutturaData) || strutturaData.length === 0) return null;

        const containerDiv = createElement('div', 'struttura_generale section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Struttura Generale'));

        let hasContent = false;
        strutturaData.forEach(item => {
            if(item.fase){ // Richiede almeno una fase
                const faseDiv = createElement('div', 'fase subsection-container');
                faseDiv.appendChild(createElement('h4', 'subsection-title', item.fase));
                let faseHasContent = true; // La fase esiste

                // Ingredienti base (stringa semplice)
                if (item.ingredienti_base) {
                    faseDiv.appendChild(createElement('p', null, `Ingredienti base: ${item.ingredienti_base}`));
                }
                // Ingredienti strutturati (richiama renderIngredienti)
                if(item.ingredienti){
                    const ingDiv = renderIngredienti(item.ingredienti);
                    if (ingDiv) faseDiv.appendChild(ingDiv);
                }
                // Procedimento (richiama renderProcedimento)
                if (item.procedimento) {
                    const procDiv = renderProcedimento(item.procedimento);
                    if(procDiv) faseDiv.appendChild(procDiv);
                }

                // Aggiunge la fase solo se ha un titolo
                 containerDiv.appendChild(faseDiv);
                 hasContent = true;

            }
        });
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Esempi di Personalizzazione (se presente).
     */
    function renderEsempi(esempiData) {
        if (!Array.isArray(esempiData) || esempiData.length === 0) return null;

        const containerDiv = createElement('div', 'esempi_personalizzazione section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Esempi Personalizzazione'));

        const listUl = createElement('ul');
        let hasContent = false;

        esempiData.forEach(esempio => {
            if(esempio.ingrediente){ // Richiede almeno l'ingrediente
                const listItem = createElement('li', 'subsection-container'); // Stile per ogni esempio
                listItem.appendChild(createElement('h5', 'subsection-title', esempio.ingrediente));
                let esempioHasContent = true;

                if(esempio.note_umami_aromi_dominanti) {
                    listItem.appendChild(createElement('p', null, `Note Umami/Aromi Dominanti: ${esempio.note_umami_aromi_dominanti}`));
                }
                if(esempio.suggerimenti){
                     listItem.appendChild(createElement('p', null, `Suggerimenti: ${esempio.suggerimenti}`));
                }
                // Aggiunge l'esempio solo se ha l'ingrediente
                listUl.appendChild(listItem);
                hasContent = true;
            }
        });

        if(hasContent) containerDiv.appendChild(listUl);
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Tips Tecnici (se presente).
     */
    function renderTips(tipsData){
        if (!Array.isArray(tipsData) || tipsData.length === 0) return null;

        const containerDiv = createElement('div', 'tips_tecnici section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Tips Tecnici'));

        const listUl = createElement('ul');
        let hasContent = false;
        tipsData.forEach(tip => {
            if (typeof tip === 'string' && tip.trim() !== '') {
                listUl.appendChild(createElement('li', null, tip));
                hasContent = true;
            }
        });

        if(hasContent) containerDiv.appendChild(listUl);
        return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza sezioni di Note generiche (note_tecniche, note_finali).
     */
    function renderNote(noteData, sectionKey) {
        if (!noteData || (Array.isArray(noteData) && noteData.length === 0)) return null;

        const className = sectionKey.toLowerCase(); // Es: 'note_tecniche'
        const titleText = sectionKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()); // Es: 'Note Tecniche'

        const containerDiv = createElement('div', `${className} section-container`);
        containerDiv.appendChild(createElement('h3', 'section-title', titleText));

        let hasContent = false;
        if (Array.isArray(noteData)) {
            const listUl = createElement('ul');
            noteData.forEach(item => {
                 if (typeof item === 'string' && item.trim() !== '') {
                    listUl.appendChild(createElement('li', null, item));
                    hasContent = true;
                 }
            });
            if(hasContent) containerDiv.appendChild(listUl);
        } else if (typeof noteData === 'string' && noteData.trim() !== '') {
            // Se la nota è una singola stringa
            containerDiv.appendChild(createElement('p', null, noteData));
            hasContent = true;
        }

      return hasContent ? containerDiv : null;
    }

    /**
     * Renderizza la sezione Finitura Consigliata (se presente).
     */
    function renderFinitura(finituraData){
         if (!Array.isArray(finituraData) || finituraData.length === 0) return null;

        const containerDiv = createElement('div', 'finitura_consigliata section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Finitura Consigliata'));

        const listUl = createElement('ul');
        let hasContent = false;
        finituraData.forEach(item => {
            if (typeof item === 'string' && item.trim() !== '') {
                listUl.appendChild(createElement('li', null, item));
                hasContent = true;
            }
        });

        if(hasContent) containerDiv.appendChild(listUl);
        return hasContent ? containerDiv : null;
    }
    
    /**
 * Renderizza la sezione Procedimento. Gestisce array semplice e struttura fasi/procedura.
 * ADATTATA per usare nomi classi CSS nuovi.
 */
function renderProcedimento(procedimentoData) {
  // Classe CSS principale per la sezione
  const containerDiv = createElement('div', 'procedure section-container'); // <- Assicurati che questa classe esista nel CSS
  containerDiv.appendChild(createElement('h3', 'section-title', 'Procedimento')); // <- Assicurati che questa classe esista nel CSS
  
  let hasContent = false; // Flag per verificare se c'è contenuto da mostrare
  
  // Caso 1: Struttura moderna con "fase" e "procedura"
  // Usiamo optional chaining (?.) per sicurezza se procedimentoData[0] non esiste
  if (Array.isArray(procedimentoData) && procedimentoData[0]?.fase && Array.isArray(procedimentoData[0]?.procedura)) {
    procedimentoData.forEach((sezione, index) => {
      // Controlla che la sezione abbia sia fase che procedura non vuota
      if (sezione.fase && Array.isArray(sezione.procedura) && sezione.procedura.length > 0) {
        // Titolo della fase
        containerDiv.appendChild(createElement('h4', 'subsection-title', sezione.fase)); // <- Assicurati che questa classe esista nel CSS
        const listOl = createElement('ol');
        sezione.procedura.forEach(step => {
          if (typeof step === 'string' && step.trim() !== '') {
            listOl.appendChild(createElement('li', null, step));
            hasContent = true; // Abbiamo aggiunto almeno un passo
          }
        });
        // Aggiunge la lista solo se contiene elementi
        if (listOl.hasChildNodes()) {
          containerDiv.appendChild(listOl);
        }
      }
    });
  }
  // Caso 2: Array semplice di stringhe (retrocompatibile)
  else if (Array.isArray(procedimentoData)) {
    const listOl = createElement('ol');
    procedimentoData.forEach(step => {
      if (typeof step === 'string' && step.trim() !== '') {
        listOl.appendChild(createElement('li', null, step));
        hasContent = true; // Abbiamo aggiunto almeno un passo
      }
    });
    // Aggiunge la lista solo se contiene elementi
    if (listOl.hasChildNodes()) {
      containerDiv.appendChild(listOl);
    }
  }
  
  // Ritorna il div solo se è stato aggiunto del contenuto effettivo, altrimenti null
  return hasContent ? containerDiv : null;
}
    /**
     * Renderizza la sezione Pairing Consigliato (se presente).
     */
    function renderPairing(pairingData){
         if (!Array.isArray(pairingData) || pairingData.length === 0) return null;

        const containerDiv = createElement('div', 'pairing_consigliato section-container');
        containerDiv.appendChild(createElement('h3', 'section-title', 'Pairing Consigliato'));

        let hasContent = false;
        pairingData.forEach(item => {
            // Richiede almeno la bevanda
            if(item.bevanda){
                const itemDiv = createElement('div', 'subsection-container'); // Contenitore per ogni pairing
                itemDiv.appendChild(createElement('p', null, `Bevanda: ${item.bevanda}`));
                if(item.note){ // Le note sono opzionali
                    itemDiv.appendChild(createElement('p', 'pairing-note', `Note: ${item.note}`));
                }
                containerDiv.appendChild(itemDiv);
                hasContent = true;
            }
        })

        return hasContent ? containerDiv : null;
    }


    // --- Funzioni Principali dell'Applicazione (Nuovo Codice) ---

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
                processRicette();
                renderCategories();
                renderGallery();
            })
            .catch(error => {
                console.error('Errore nel caricamento del ricettario:', error);
                displayErrorMessage('Impossibile caricare le ricette. Riprova più tardi.');
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
    }

    /**
     * Renderizza la galleria delle ricette.
     */
    function renderGallery(filter = '') {
         if (!gallery) return;
        gallery.innerHTML = '';
        const lowerCaseFilter = filter.toLowerCase().trim();
        const filteredRicette = allRicette.filter(ricetta =>
            ricetta.nome.toLowerCase().includes(lowerCaseFilter) ||
            (ricetta.descrizione && ricetta.descrizione.toLowerCase().includes(lowerCaseFilter)) ||
            ricetta.categoria.toLowerCase().includes(lowerCaseFilter)
        );

        if (filteredRicette.length === 0) {
            gallery.innerHTML = '<p>Nessuna ricetta trovata.</p>';
            return;
        }
        filteredRicette.forEach(createAndAppendCard);
    }

     /**
     * Crea una singola card per una ricetta e la aggiunge alla galleria.
     */
/**
 * Crea una singola card per una ricetta e la aggiunge alla galleria.
 * Popola con innerHTML e include l'immagine di sfondo.
 */
function createAndAppendCard(ricetta) {
  if (!gallery) return;
  
  const card = createElement('div', 'card'); // Usa la funzione helper!
  
  // --- COLLEGAMENTO IMMAGINE ---
  const imageFilename = generateImageFilename(ricetta.nome); // Genera nome file con underscore
  const imageUrl = `img/${imageFilename}.jpeg`; // Percorso corretto (verifica estensione .webp)
  
  // Applica lo stile background-image
  card.style.backgroundImage = `url('${imageUrl}')`;
  // Aggiungi la classe per gli stili CSS specifici
  card.classList.add('card-has-image');
  // --- FINE COLLEGAMENTO IMMAGINE ---
  
  // Crea il wrapper per il contenuto, necessario per z-index
  const contentWrapper = createElement('div', 'card-content-wrapper');
  
  // Usa innerHTML per popolare il *wrapper*, non la card direttamente
  contentWrapper.innerHTML = `
        <h3></h3>
        <p></p>
        <span class="category-tag"></span>
    `;
  
  // Imposta il testo sugli elementi *dentro* il wrapper
  contentWrapper.querySelector('h3').textContent = ricetta.nome;
  contentWrapper.querySelector('p').textContent = ricetta.descrizione || '';
  contentWrapper.querySelector('.category-tag').textContent = `Categoria: ${ricetta.categoria}`;
  
  // Aggiungi il wrapper alla card
  card.appendChild(contentWrapper);
  
  // Aggiungi l'event listener alla card
  card.addEventListener('click', () => openModal(ricetta));
  // Aggiungi la card completa alla galleria
  gallery.appendChild(card);
}

// Assicurati che questa funzione sia presente e corretta (con underscore):
/**
 * Genera un nome file sicuro per l'immagine da un nome di ricetta.
 * Converte in minuscolo, sostituisce spazi/caratteri speciali con UNDERSCORE.
 * @param {string} recipeName - Il nome della ricetta.
 * @returns {string} Il nome del file senza estensione.
 */
function generateImageFilename(recipeName) {
  if (!recipeName) return 'default_placeholder'; // Fallback con underscore
  
  return recipeName
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Rimuove accenti
    .replace(/[^a-z0-9_]+/g, '_') // Sostituisce con _
    .replace(/_+/g, '_') // Rimuove _ multipli
    .replace(/^_*|_*$/g, ''); // Rimuove _ iniziali/finali
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
            renderGallery('');
        });
        categoryList.appendChild(showAllLi);

        ricettarioData.categorie.forEach(categoria => {
            const li = createElement('li', null, categoria.nome);
            li.dataset.categoryName = categoria.nome;
            li.addEventListener('click', (event) => {
                renderGallery(categoria.nome);
                setActiveCategory(event.currentTarget);
            });
            categoryList.appendChild(li);
        });
    }

    /**
     * Aggiorna lo stato visivo della categoria attiva.
     */
    function setActiveCategory(targetElement) {
        if (activeCategoryElement) {
            activeCategoryElement.classList.remove('active-category');
        }
        if (targetElement) {
            targetElement.classList.add('active-category');
            activeCategoryElement = targetElement;
        } else {
            activeCategoryElement = null;
        }
    }

    /**
     * Apre il modal e popola con TUTTI i dettagli della ricetta usando le funzioni di rendering.
     * VERSIONE RIVISTA USANDO DOM MANIPULATION E FUNZIONI RENDER_*
     */
    function openModal(ricetta) {
        if (!modal || !modalContent) return;

        // Pulisce contenuto precedente
        modalContent.innerHTML = '';

        // --- 1. Crea Header del Modal ---
        const modalHeader = createElement('div', 'modal-header');
        const titleH2 = createElement('h2', null, ricetta.nome);
        // Usa la classe CSS per il bottone, come definito nel CSS e gestito dal listener delegato
        const closeButton = createElement('button', 'modal-close-button', '\u00D7'); // Simbolo ×
        closeButton.setAttribute('aria-label', 'Chiudi modal');
        modalHeader.appendChild(titleH2);
        modalHeader.appendChild(closeButton);
        modalContent.appendChild(modalHeader);

        // --- 2. Crea Corpo del Modal ---
        const modalBody = createElement('div', 'modal-body');

        // Info Base (Categoria e Descrizione)
        modalBody.appendChild(createElement('p', 'categoria-info')) // Aggiunta classe per stile
            .innerHTML = `<strong>Categoria:</strong> ${ricetta.categoria}`; // innerHTML per tag strong
        modalBody.appendChild(createElement('p', 'descrizione-info', ricetta.descrizione || 'Nessuna descrizione disponibile.')); // Aggiunta classe per stile

        // --- 3. Aggiungi Sezioni Dinamiche (chiamando le funzioni render_*) ---
        const sections = [
            // Chiave nel JSON della ricetta : Funzione di rendering corrispondente
            { key: 'ingredienti', renderFunc: renderIngredienti },
            { key: 'procedimento', renderFunc: renderProcedimento },
            { key: 'varianti', renderFunc: renderVarianti },
            { key: 'utilizzo', renderFunc: renderUtilizzo },
            { key: 'struttura_generale', renderFunc: renderStruttura },
            { key: 'esempi_personalizzazione', renderFunc: renderEsempi },
            { key: 'tips_tecnici', renderFunc: renderTips },
            { key: 'note_tecniche', renderFunc: (data) => renderNote(data, 'note_tecniche') }, // Passa la chiave a renderNote
            { key: 'note_finali', renderFunc: (data) => renderNote(data, 'note_finali') }, // Passa la chiave a renderNote
            { key: 'finitura_consigliata', renderFunc: renderFinitura },
            { key: 'pairing_consigliato', renderFunc: renderPairing },
        ];

        sections.forEach(section => {
            // Controlla se la chiave esiste nella ricetta e ha dati
            if (ricetta[section.key] && (!Array.isArray(ricetta[section.key]) || ricetta[section.key].length > 0)) {
                // Chiama la funzione di rendering associata
                const sectionElement = section.renderFunc(ricetta[section.key]);
                // Se la funzione ritorna un elemento (non null), aggiungilo al corpo
                if (sectionElement) {
                    modalBody.appendChild(sectionElement);
                }
            }
        });

        // Aggiungi campi semplici rimanenti (es. vino)
        if (ricetta.vino_abbinato) {
            modalBody.appendChild(createElement('p', 'vino-info section-container', `Vino consigliato: ${ricetta.vino_abbinato}`));
        }

        // --- 4. Aggiungi Corpo al Modal Content ---
        modalContent.appendChild(modalBody);

        // --- 5. Mostra il Modal ---
        modal.style.display = 'block';
        // Porta il focus sul titolo per accessibilità
        titleH2.focus();
    }


    /**
     * Chiude il modal.
     */
    function closeModal() {
        if (!modal) return;
        modal.style.display = 'none';
        modalContent.innerHTML = ''; // Pulisce per sicurezza
    }

    /**
    * Mostra un messaggio di errore nella galleria.
    */
    function displayErrorMessage(message) {
        if (gallery) {
            gallery.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

    // --- Event Listeners (Nuovo Codice) ---

    if (zoomSlider && gallery) {
        zoomSlider.addEventListener('input', function () {
            const zoomLevel = parseFloat(zoomSlider.value) || 1;
            const minWidth = BASE_CARD_WIDTH * zoomLevel;
            gallery.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}px, 1fr))`;
        });
        zoomSlider.dispatchEvent(new Event('input'));
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            setActiveCategory(null);
            renderGallery(searchInput.value);
        });
    }

    // Gestione Chiusura Modal (Delegazione Eventi - NESSUNA MODIFICA NECESSARIA QUI)
    if (modal) {
        modal.addEventListener('click', function (event) {
            if (event.target === modal) { // Clic su overlay
                closeModal();
            }
            if (event.target.closest('.modal-close-button')) { // Clic su bottone chiusura (o figlio)
                 closeModal();
            }
        });
    }

    // --- Inizializzazione ---
    loadRicettario();
});
