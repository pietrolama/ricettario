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

    // ---- Contenitore Testo e Immagine (Flex) ----
    const modalInnerWrapper = createElement('div', 'modal-inner-wrapper'); // Nuovo wrapper per layout
    const textWrapper = createElement('div', 'modal-text-content');
    const imageContainer = createElement('div', 'modal-image-container');
    modalInnerWrapper.appendChild(textWrapper);
    modalInnerWrapper.appendChild(imageContainer);
    modalContent.appendChild(modalInnerWrapper); // Aggiungi wrapper al contenuto

    // ---- Header ----
    const modalHeader = createElement('div', 'modal-header');
    const titleH2 = createElement('h2', null, ricetta.nome);
    const closeButton = createElement('button', 'modal-close-button', '\u00D7', { 'aria-label': 'Chiudi dettagli ricetta' });
    modalHeader.appendChild(titleH2);
    modalHeader.appendChild(closeButton);
    textWrapper.appendChild(modalHeader); // Header dentro textWrapper

    // ---- Body (Area Scrollabile Testo) ----
    const modalBody = createElement('div', 'modal-body');
    textWrapper.appendChild(modalBody); // Body dentro textWrapper

    // ---- Contenuto Fisso Iniziale ----
    const categoryP = createElement('p', 'categoria-info');
    categoryP.innerHTML = `Categoria: <strong>${ricetta.categoria || 'Non specificata'}</strong>`;
    modalBody.appendChild(categoryP);
    modalBody.appendChild(createElement('p', 'descrizione-info', ricetta.descrizione || 'Nessuna descrizione fornita.'));

    // ---- Contenitore per Scaling e Ingredienti ----
    // Verrà aggiunto al modalBody
    const ingredientsWrapper = createElement('div', 'ingredients-wrapper');
    modalBody.appendChild(ingredientsWrapper);

    // ---- Logica Scaling e Rendering Iniziale Ingredienti ----
    const porzioniBase = ricetta.porzioni_base; // Assumendo che il campo sia 'porzioni_base'
    let currentServings = (porzioniBase && porzioniBase > 0) ? porzioniBase : 1;
    let servingsSelectorContainer = null; // Per riferimento futuro

    // Funzione per aggiornare la lista ingredienti nel DOM
    const updateIngredientsUI = (servings) => {
        console.log(`Aggiorno ingredienti per: ${servings} porzioni (Base: ${porzioniBase})`);
        const existingSection = ingredientsWrapper.querySelector('#ingredients-section-content');
        if (existingSection) {
            existingSection.remove(); // Rimuovi la vecchia lista
        }
        // Renderizza la nuova lista usando la funzione fornita
        const newIngredientsSection = renderIngredienti(ricetta.ingredienti, servings, porzioniBase);
        if (newIngredientsSection) {
            // Aggiungi la nuova sezione DENTRO ingredientsWrapper
            // Se il selettore esiste, mettila dopo, altrimenti all'inizio
             if (servingsSelectorContainer) {
                 servingsSelectorContainer.insertAdjacentElement('afterend', newIngredientsSection);
             } else {
                 ingredientsWrapper.prepend(newIngredientsSection);
             }
        } else {
             // Fallback se renderIngredienti ritorna null
             ingredientsWrapper.innerHTML += '<p>Errore nel caricamento ingredienti.</p>';
        }
    };

    // Crea UI Selettore Porzioni (solo se ci sono porzioni base valide)
    if (porzioniBase && typeof porzioniBase === 'number' && porzioniBase > 0) {
        console.log(`Ricetta ${ricetta.nome} ha porzioni base: ${porzioniBase}`);
        servingsSelectorContainer = createElement('div', 'servings-selector'); // Contenitore selettore

        const label = createElement('span', 'servings-label', 'Porzioni: ');
        const counterWrapper = createElement('div', 'servings-counter');
        const btnMinus = createElement('button', 'servings-button minus', '-', { 'aria-label': 'Diminuisci porzioni', 'type': 'button' });
        const servingsDisplay = createElement('span', 'servings-display', porzioniBase);
        const btnPlus = createElement('button', 'servings-button plus', '+', { 'aria-label': 'Aumenta porzioni', 'type': 'button' });

        counterWrapper.appendChild(btnMinus);
        counterWrapper.appendChild(servingsDisplay);
        counterWrapper.appendChild(btnPlus);
        servingsSelectorContainer.appendChild(label);
        servingsSelectorContainer.appendChild(counterWrapper);
        ingredientsWrapper.appendChild(servingsSelectorContainer); // Aggiungi selettore al wrapper

        // Event Listeners per i bottoni
        btnMinus.addEventListener('click', () => {
            if (currentServings > 1) {
                currentServings--;
                servingsDisplay.textContent = currentServings;
                updateIngredientsUI(currentServings);
            }
        });
        btnPlus.addEventListener('click', () => {
            currentServings++;
            servingsDisplay.textContent = currentServings;
            updateIngredientsUI(currentServings);
        });

        // Renderizza gli ingredienti iniziali con le porzioni base
        updateIngredientsUI(porzioniBase);

    } else {
        console.log(`Ricetta ${ricetta.nome} non ha porzioni base valide (${porzioniBase}). Scaling disabilitato.`);
        // Renderizza comunque gli ingredienti (non scalati o con base 1)
        updateIngredientsUI(1); // Mostra ingredienti per 1 porzione se non c'è base
    }

    // ---- Renderizza Procedimento (Ordine Forzato) ----
    let procedureRendered = false;
    if (ricetta.procedimento && sectionRenderers.procedimento) {
        try {
            const procElement = sectionRenderers.procedimento(ricetta.procedimento);
            if (procElement) {
                modalBody.appendChild(procElement); // Aggiungi al body principale
                procedureRendered = true;
            }
        } catch (e) {
            console.error(`Errore nel renderer 'procedimento':`, e);
            modalBody.appendChild(createElement('p', 'error-message', `Errore caricamento procedimento.`));
        }
    }

    // ---- Renderizza le ALTRE Sezioni (dopo Ingredienti e Procedimento) ----
    let otherDetailsRendered = false;
    const handledKeys = [ // Chiavi già gestite o da ignorare
        'nome', 'descrizione', 'categoria', 'porzioni_base', 'ingredienti', 'procedimento'
        // Aggiungi qui altri metadati non visualizzabili se necessario: 'id', 'immagine_src', etc.
    ];

    for (const key in ricetta) {
        if (handledKeys.includes(key) || !ricetta[key]) {
            continue; // Salta chiavi già gestite o vuote
        }

        if (sectionRenderers.hasOwnProperty(key)) {
            try {
                const sectionElement = sectionRenderers[key](ricetta[key]);
                if (sectionElement) {
                    modalBody.appendChild(sectionElement); // Aggiungi al body principale
                    otherDetailsRendered = true;
                }
            } catch (e) {
                console.error(`Errore nel renderer per la chiave '${key}':`, e);
                modalBody.appendChild(createElement('p', 'error-message', `Errore caricamento sezione: ${key}`));
            }
        } else {
            console.warn(`Nessun renderer definito per la chiave '${key}'. Sezione ignorata.`);
        }
    }

    // Messaggio se mancano dettagli *oltre* a ingredienti/procedimento
    if (!procedureRendered && !otherDetailsRendered && !(porzioniBase > 0)) { // Se non c'era neanche lo scaling
         modalBody.appendChild(createElement('p', 'info-message', 'Nessun dettaglio aggiuntivo disponibile.'));
    }

    // ---- Contenitore Immagine (Logica invariata) ----
    const imageFilename = generateImageFilename(ricetta.nome);
    let imageUrl = `img/${imageFilename}.jpeg`;
    const recipeImage = createElement('img');
    recipeImage.alt = `Immagine: ${ricetta.nome}`;
    recipeImage.loading = 'lazy';

    const setImageError = (container, imgElement) => {
        container.innerHTML = '<p class="image-error">Immagine non disponibile</p>';
        container.style.backgroundColor = 'var(--color-surface-alt)';
        imgElement.remove();
    };
    recipeImage.onerror = () => {
        imageUrl = `img/${imageFilename}.png`; recipeImage.src = imageUrl;
        recipeImage.onerror = () => {
             imageUrl = `img/${imageFilename}.webp`; recipeImage.src = imageUrl;
             recipeImage.onerror = () => { setImageError(imageContainer, recipeImage); };
        };
    };
    recipeImage.src = imageUrl;
    imageContainer.appendChild(recipeImage);


    // ---- Mostra il Modal ----
    modal.classList.add('active');
    bodyElement.style.overflow = 'hidden';

    // ---- Focus e Chiusura ----
    setTimeout(() => {
        const focusableElement = servingsSelectorContainer?.querySelector('.servings-button.minus') || titleH2 || closeButton;
        if (focusableElement) {
            focusableElement.focus();
        } else {
            modalContent.setAttribute('tabindex', '-1'); modalContent.focus();
        }
    }, 150);

    const closeModalHandler = () => closeModal(modal, modalContent, bodyElement);
    const escapeListener = (e) => { if (e.key === 'Escape') closeModalHandler(); };
    closeButton.addEventListener('click', closeModalHandler);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModalHandler(); });
    window.addEventListener('keydown', escapeListener);
    modal._escapeListener = escapeListener; // Salva riferimento per rimozione

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
