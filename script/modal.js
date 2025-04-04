// modal.js - Versione Riscrita e Corretta

import { createElement, generateImageFilename } from './utils.js';

// =============================================
// FUNZIONI HELPER DI RENDERING (Invariate dal tuo codice precedente)
// =============================================

/**
 * Renderizza la sezione Ingredienti nel modale, scalando le quantità.
 * Presume che gli item abbiano 'quantita_num' e 'unita'.
 * @param {Array} ingredientiData - L'array dei gruppi di ingredienti (formato {nome_gruppo, lista_ingredienti:[{ingrediente, quantita_num, unita, note, opzionale}]}).
 * @param {number | null} porzioniDesiderate - Il numero di porzioni per cui scalare.
 * @param {number | null} porzioniBase - Il numero di porzioni base della ricetta.
 * @returns {HTMLElement | null} Il contenitore della sezione ingredienti o null.
 */
function renderIngredienti(ingredientiData, porzioniDesiderate, porzioniBase) {
    // Verifica iniziale dei dati
    if (!Array.isArray(ingredientiData) || ingredientiData.length === 0) {
        console.log("Nessun dato valido per renderIngredienti");
        return null;
    }

    // Gestione porzioni per scaling
    const base = (porzioniBase && porzioniBase > 0) ? porzioniBase : (porzioniDesiderate || 1);
    const target = porzioniDesiderate || base;
    const canScale = (base > 0 && target > 0 && base !== target); // Flag per sapere se dobbiamo scalare

    const container = createElement('div', 'ingredients-section section-container');
    container.id = `ingredients-section-content`; // ID univoco per poterlo sostituire
    container.appendChild(createElement('h3', 'subsection-title', 'Ingredienti'));
    let hasContent = false;

    ingredientiData.forEach(gruppo => {
        if (!gruppo || !Array.isArray(gruppo.lista_ingredienti) || gruppo.lista_ingredienti.length === 0) {
            console.warn("Gruppo ingredienti saltato:", gruppo);
            return;
        }

        if (gruppo.nome_gruppo) {
            const nomeGruppoFmt = gruppo.nome_gruppo.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            container.appendChild(createElement('h4', 'subsection-group-title', nomeGruppoFmt));
        }

        const list = createElement('ul', 'ingredients-list');
        gruppo.lista_ingredienti.forEach(item => {
            if (!item || !item.ingrediente) {
                console.warn("Item ingrediente saltato:", item);
                return;
            }

            let quantityString = '';
            const numBase = item.quantita_num; // Usa il campo numerico base
            const unit = item.unita || '';

            // --- Logica di Scaling e Formattazione ---
            if (numBase !== null && numBase !== undefined) {
                const numToDisplay = canScale ? (numBase / base) * target : numBase;

                // Formattazione numero (migliorata per diverse scale)
                let displayNum;
                 if (numToDisplay === 0) {
                    displayNum = 0;
                 } else if (Number.isInteger(numToDisplay)) {
                    displayNum = numToDisplay; // Intero
                 } else if (numToDisplay < 0.1 && numToDisplay > 0) {
                     // Prova a rappresentare come frazione comune se possibile? O usa decimali.
                     // Semplice per ora: 3 decimali per piccoli numeri
                     displayNum = parseFloat(numToDisplay.toFixed(3));
                 } else if (numToDisplay < 1) {
                     // Arrotonda a 2 decimali sotto 1
                    displayNum = parseFloat(numToDisplay.toFixed(2));
                 } else {
                     // Arrotonda a 1 decimale sopra 1 (o a 0 se .0)
                     displayNum = parseFloat(numToDisplay.toFixed(1));
                 }
                 // Rimuove '.0' per numeri interi dopo toFixed
                 if (Number.isInteger(displayNum)) {
                    displayNum = parseInt(displayNum);
                 }

                quantityString = `${displayNum} ${unit}`.trim();

            } else if (unit.toLowerCase() === 'q.b.' || item.quantita === 'q.b.') { // Controllo anche su 'quantita' stringa per sicurezza
                quantityString = 'q.b.';
            } else if (unit) { // Solo unità (es. "pizzico", "foglia")
                quantityString = unit;
            } else if (item.quantita) { // Fallback alla stringa originale se presente
                 quantityString = item.quantita;
            }
            // --- Fine Logica di Scaling ---

            let liContentHTML = '';
            liContentHTML += `<span class="ingredient-name">${item.ingrediente.trim()}</span>`;
            if (quantityString) {
                liContentHTML += ` <span class="ingredient-quantity">${quantityString}</span>`;
            }
            if (item.note) {
                liContentHTML += ` <em class="ingredient-note">(${item.note.trim()})</em>`;
            }
            if (item.opzionale) {
                liContentHTML += ` <span class="ingredient-optional">(Opzionale)</span>`;
            }

            const li = createElement('li');
            li.innerHTML = liContentHTML;
            if (item.opzionale) {
                li.classList.add('optional-ingredient');
            }
            list.appendChild(li);
            hasContent = true;
        });

        if (list.hasChildNodes()) {
            container.appendChild(list);
        }
    });

    return hasContent ? container : null;
}

// ... (Le altre funzioni renderProcedimento, renderGenericListSection, etc. rimangono INVARIATE) ...
function renderProcedimento(procedimentoData) {
    if (!Array.isArray(procedimentoData) || procedimentoData.length === 0) return null;

    const container = createElement('div', 'procedure-section section-container');
    container.appendChild(createElement('h3', 'subsection-title', 'Procedimento'));
    let hasContent = false;

    procedimentoData.forEach(faseObj => {
        if (!faseObj || !Array.isArray(faseObj.passaggi) || faseObj.passaggi.length === 0) {
             console.warn("Fase procedimento saltata:", faseObj);
            return; // Salta fasi vuote o malformate
        }
        if (faseObj.fase) {
            container.appendChild(createElement('h4', 'subsection-group-title', faseObj.fase.trim()));
        }
        const list = createElement('ol');
        faseObj.passaggi.forEach(step => {
            if (typeof step === 'string' && step.trim()) {
                list.appendChild(createElement('li', null, step.trim()));
                hasContent = true;
            }
        });
        if (list.hasChildNodes()) {
            container.appendChild(list);
        }
    });
    return hasContent ? container : null;
}
function renderGenericListSection(data, title, tag = 'ul') { /* ... codice invariato ... */ }
function renderVarianti(variantiData) { /* ... codice invariato ... */ }
function renderUsi(usiData) { /* ... codice invariato ... */ }
function renderStruttura(strutturaData) { /* ... codice invariato ... */ }
function renderEsempi(esempiData) { /* ... codice invariato ... */ }
function renderPairing(pairingData) { /* ... codice invariato ... */ }


// =============================================
// MAPPA DEI RENDERER (Invariata)
// =============================================
const sectionRenderers = {
  // 'ingredienti': renderIngredienti, // Rimosso, gestito separatamente con scaling
  'procedimento': renderProcedimento,
  'varianti': renderVarianti,
  'utilizzo': renderUsi,
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
  'vino_abbinato': (data) => data ? createElement('div', 'vino-info section-container', [
    createElement('h3', 'subsection-title', 'Vino Consigliato'),
    createElement('p', null, data)
  ]) : null,
  'attrezzature': (data) => renderGenericListSection(data, 'Attrezzature'),
  'presentazione_consigliata': (data) => renderGenericListSection(data, 'Presentazione Consigliata'),
  'impiattamento': (data) => renderGenericListSection(data, 'Impiattamento', 'ol'),
  'assemblaggio_del_piatto': (data) => renderGenericListSection(data, 'Assemblaggio del Piatto', 'ol')
};


// =============================================
// FUNZIONI PRINCIPALI MODAL (openModal, closeModal) - Riscritte
// =============================================

export function openModal(ricetta, modal, modalContent, bodyElement) {
    console.log("Apro il modal per:", ricetta.nome);
    if (!modal || !modalContent || !ricetta || !bodyElement) {
        console.error("openModal: Argomenti mancanti o nulli", { ricetta, modal, modalContent, bodyElement });
        return;
    }

    modalContent.innerHTML = ''; // Pulisci subito

    // ---- Contenitore Testo e Immagine (Figli DIRETTI di modalContent) ----
    const textWrapper = createElement('div', 'modal-text-content'); // Contenitore testo
    const imageContainer = createElement('div', 'modal-image-container'); // Contenitore immagine

    // Aggiungili SUBITO a modalContent (senza wrapper intermedio)
    modalContent.appendChild(textWrapper);
    modalContent.appendChild(imageContainer);

    // ---- Header (Dentro textWrapper) ----
    const modalHeader = createElement('div', 'modal-header');
    const titleH2 = createElement('h2', null, ricetta.nome);
    const closeButton = createElement('button', 'modal-close-button', '\u00D7', { 'aria-label': 'Chiudi dettagli ricetta' });
    modalHeader.appendChild(titleH2);
    modalHeader.appendChild(closeButton);
    textWrapper.appendChild(modalHeader); // Header DENTRO textWrapper

    // ---- Body (Dentro textWrapper - Area Scrollabile) ----
    const modalBody = createElement('div', 'modal-body');
    textWrapper.appendChild(modalBody); // Body DENTRO textWrapper

    // ---- Contenuto Fisso Iniziale (Dentro modalBody) ----
    const categoryP = createElement('p', 'categoria-info');
    categoryP.innerHTML = `Categoria: <strong>${ricetta.categoria || 'Non specificata'}</strong>`;
    modalBody.appendChild(categoryP);
    modalBody.appendChild(createElement('p', 'descrizione-info', ricetta.descrizione || 'Nessuna descrizione fornita.'));

    // ---- Contenitore per Scaling e Ingredienti (Dentro modalBody) ----
    const ingredientsWrapper = createElement('div', 'ingredients-wrapper');
    modalBody.appendChild(ingredientsWrapper); // Aggiungi al modalBody

    // ---- Logica Scaling e Rendering Iniziale Ingredienti (INVARIATA) ----
    const porzioniBase = ricetta.porzioni_base;
    let currentServings = (porzioniBase && porzioniBase > 0) ? porzioniBase : 1;
    let servingsSelectorContainer = null;

    const updateIngredientsUI = (servings) => { /* ... codice funzione updateIngredientsUI invariato ... */ };

    if (porzioniBase && typeof porzioniBase === 'number' && porzioniBase > 0) {
        // ... (codice creazione selettore porzioni invariato) ...
        servingsSelectorContainer = createElement('div', 'servings-selector');
        // ... (creazione label, bottoni, display...)
        ingredientsWrapper.appendChild(servingsSelectorContainer);
        // ... (addEventListener per bottoni +/-) ...
        updateIngredientsUI(porzioniBase); // Render iniziale
    } else {
        // ... (gestione caso senza porzioni base, render iniziale non scalato) ...
        updateIngredientsUI(1);
    }

    // ---- Renderizza Procedimento (Ordine Forzato, DENTRO modalBody) ----
    let procedureRendered = false;
    if (ricetta.procedimento && sectionRenderers.procedimento) {
        // ... (codice rendering procedimento invariato) ...
        // Aggiungi a modalBody:
        const procElement = sectionRenderers.procedimento(ricetta.procedimento);
        if (procElement) modalBody.appendChild(procElement);
        procedureRendered = true;
        // ... (gestione errori) ...
    }

    // ---- Renderizza le ALTRE Sezioni (Ordine Forzato, DENTRO modalBody) ----
    let otherDetailsRendered = false;
    const handledKeys = [ /* ... chiavi da ignorare ... */ ];

    for (const key in ricetta) {
        if (handledKeys.includes(key) || !ricetta[key]) continue;
        if (sectionRenderers.hasOwnProperty(key)) {
            // ... (codice rendering altre sezioni invariato) ...
            // Aggiungi a modalBody:
            const sectionElement = sectionRenderers[key](ricetta[key]);
            if (sectionElement) modalBody.appendChild(sectionElement);
            otherDetailsRendered = true;
            // ... (gestione errori) ...
        } else {
           // ... (warn chiave ignorata) ...
        }
    }

    // ---- Messaggio Fallback (Dentro modalBody) ----
     if (!procedureRendered && !otherDetailsRendered && !(porzioniBase > 0)) {
         modalBody.appendChild(createElement('p', 'info-message', 'Nessun dettaglio aggiuntivo disponibile.'));
    }

    // ---- Contenitore Immagine (Logica Creazione Immagine INVARIATA) ----
    // La creazione di imageContainer e il suo popolamento sono già avvenuti all'inizio
    const imageFilename = generateImageFilename(ricetta.nome);
    // ... (logica immagine con fallback src/onerror) ...
    let imageUrl = `img/${imageFilename}.jpeg`;
    const recipeImage = createElement('img');
    recipeImage.alt = `Immagine: ${ricetta.nome}`;
    recipeImage.loading = 'lazy';
    const setImageError = (container, imgElement) => { /* ... */ };
    recipeImage.onerror = () => { /* ... */ };
    recipeImage.src = imageUrl;
    imageContainer.appendChild(recipeImage); // Popola il contenitore immagine

    // ---- Mostra il Modal (INVARIATO) ----
    modal.classList.add('active');
    bodyElement.style.overflow = 'hidden';

    // ---- Focus e Chiusura (INVARIATO) ----
    setTimeout(() => { /* ... codice focus ... */ }, 150);
    const closeModalHandler = () => closeModal(modal, modalContent, bodyElement);
    const escapeListener = (e) => { /* ... */ };
    closeButton.addEventListener('click', closeModalHandler);
    modal.addEventListener('click', (e) => { /* ... */ });
    window.addEventListener('keydown', escapeListener);
    modal._escapeListener = escapeListener;

} // --- FINE openModal ---


export function closeModal(modal, modalContent, bodyElement) {
    if (!modal || !modal.classList.contains('active')) return;

    console.log("Chiudo il modal");
    modal.classList.remove('active');

    if (!document.body.classList.contains('menu-open')) {
        bodyElement.style.overflow = '';
    }

    if (modal._escapeListener) {
        window.removeEventListener('keydown', modal._escapeListener);
        delete modal._escapeListener;
        console.log("Listener Escape rimosso.");
    }

    // Pulisce il contenuto DOPO l'animazione di uscita
    setTimeout(() => {
        if (modalContent) modalContent.innerHTML = '';
    }, 350); // Durata transizione CSS
}
