// =============================================
// modal.js - VERSIONE COMPLETA E CORRETTA
// =============================================

import { createElement, generateImageFilename } from './utils.js';

// =============================================
// FUNZIONI HELPER DI RENDERING (Dal tuo codice precedente)
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
    // Aggiungiamo un ID specifico all'elemento che contiene la lista,
    // così possiamo sostituirlo facilmente durante l'aggiornamento.
    container.id = `ingredients-section-content-${Date.now()}`; // ID univoco per evitare conflitti
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
                 if (numToDisplay === 0 && numBase !== 0) { // Evita zero se non era zero in origine
                    // Mostra un valore molto piccolo o lascia la stringa originale?
                    // Per ora mostriamo un valore piccolo con più decimali
                     displayNum = parseFloat(numToDisplay.toFixed(3));
                 } else if (numToDisplay === 0) {
                    displayNum = 0;
                 } else if (Number.isInteger(numToDisplay)) {
                    displayNum = numToDisplay; // Intero
                 } else if (numToDisplay < 0.1 && numToDisplay > 0) {
                     displayNum = parseFloat(numToDisplay.toFixed(3)); // 3 decimali per piccoli numeri
                 } else if (numToDisplay < 1) {
                    displayNum = parseFloat(numToDisplay.toFixed(2)); // 2 decimali sotto 1
                 } else {
                     displayNum = parseFloat(numToDisplay.toFixed(1)); // 1 decimale sopra 1
                 }
                 // Rimuove '.0' per numeri interi dopo toFixed
                 if (Number.isInteger(displayNum)) {
                    displayNum = parseInt(displayNum);
                 }

                quantityString = `${displayNum} ${unit}`.trim();

            } else if (unit.toLowerCase() === 'q.b.' || item.quantita === 'q.b.') {
                quantityString = 'q.b.';
            } else if (unit) { // Solo unità
                quantityString = unit;
            } else if (item.quantita) { // Fallback alla stringa originale
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

/** Renderizza la sezione Procedimento nel modale. */
function renderProcedimento(procedimentoData) {
    if (!Array.isArray(procedimentoData) || procedimentoData.length === 0) return null;

    const container = createElement('div', 'procedure-section section-container');
    container.appendChild(createElement('h3', 'subsection-title', 'Procedimento'));
    let hasContent = false;

    procedimentoData.forEach(faseObj => {
        if (!faseObj || !Array.isArray(faseObj.passaggi) || faseObj.passaggi.length === 0) {
            console.warn("Fase procedimento saltata:", faseObj);
            return;
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

/** Renderizza una sezione generica (es. note, tips, impiattamento) come lista o paragrafo. */
function renderGenericListSection(data, title, tag = 'ul') {
    const hasValidData = data && (
        (Array.isArray(data) && data.some(item => (typeof item === 'string' && item.trim()) || (typeof item === 'object' && item !== null))) ||
        (typeof data === 'string' && data.trim())
    );
    if (!hasValidData) return null;

    const container = createElement('div', `generic-section section-container ${title.toLowerCase().replace(/\s+/g, '-')}`);
    container.appendChild(createElement('h3', 'subsection-title', title));

    if (Array.isArray(data)) {
        const list = createElement(tag);
        let added = false;
        data.forEach(item => {
            if (typeof item === 'string' && item.trim()) {
                list.appendChild(createElement('li', null, item.trim()));
                added = true;
            } else if (typeof item === 'object' && item !== null) {
                try {
                    list.appendChild(createElement('li', 'json-item', JSON.stringify(item, null, 2)));
                    added = true;
                } catch (e) { console.warn("Impossibile serializzare oggetto in sezione generica:", item); }
            }
        });
        if (added) container.appendChild(list); else return null;
    } else if (typeof data === 'string') {
        container.appendChild(createElement('p', null, data.trim()));
    } else {
        return null;
    }
    return container;
}

/** Renderizza la sezione Varianti (può contenere sottosezioni). */
function renderVarianti(variantiData) {
    const variantiArray = Array.isArray(variantiData) ? variantiData : (variantiData ? [variantiData] : []);
    if (variantiArray.length === 0) return null;

    const container = createElement('div', 'varianti-section section-container');
    container.appendChild(createElement('h3', 'subsection-title', 'Varianti'));
    let mainHasContent = false;

    variantiArray.forEach(variante => {
        if (!variante || typeof variante !== 'object') return;
        const varianteDiv = createElement('div', 'variante-item subsection-container');
        let varianteHasContent = false;
        if (variante.nome) { varianteDiv.appendChild(createElement('h4', 'subsection-group-title', variante.nome)); varianteHasContent = true; }
        if (variante.descrizione) { varianteDiv.appendChild(createElement('p', 'descrizione-info', variante.descrizione)); varianteHasContent = true; }
        if (variante.note) { varianteDiv.appendChild(createElement('p', 'variante-note', variante.note)); varianteHasContent = true; }
        // Usa la funzione renderIngredienti corretta che gestisce lo scaling (passando null per le porzioni se non si vuole scalare qui)
        if (variante.ingredienti) { const el = renderIngredienti(variante.ingredienti, null, null); if (el) { varianteDiv.appendChild(el); varianteHasContent = true; } }
        if (variante.procedimento) { const el = renderProcedimento(variante.procedimento); if (el) { varianteDiv.appendChild(el); varianteHasContent = true; } }
        if (variante.applicazioni) { varianteDiv.appendChild(createElement('p', 'applicazioni-info', `Applicazioni: ${variante.applicazioni}`)); varianteHasContent = true; }
        if (varianteHasContent) { container.appendChild(varianteDiv); mainHasContent = true; }
    });
    return mainHasContent ? container : null;
}

/** Renderizza la sezione Utilizzo/Usi (gestisce un oggetto con chiavi come sottotitoli). */
function renderUsi(usiData) {
    if (!usiData || typeof usiData !== 'object' || Object.keys(usiData).length === 0) return null;

    const container = createElement('div', 'usi-section section-container');
    container.appendChild(createElement('h3', 'subsection-title', 'Utilizzo / Usi'));
    let hasContent = false;

    for (const key in usiData) {
        if (Object.prototype.hasOwnProperty.call(usiData, key) && Array.isArray(usiData[key]) && usiData[key].length > 0) {
            const subContainer = createElement('div', 'uso-subsection subsection-container');
            const titleText = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            const title = createElement('h4', 'subsection-group-title', titleText);
            subContainer.appendChild(title);
            const list = createElement('ul');
            let addedItem = false;
            usiData[key].forEach(item => {
                if (typeof item === 'string' && item.trim()) { list.appendChild(createElement('li', null, item.trim())); addedItem = true; }
            });
            if (addedItem) { subContainer.appendChild(list); container.appendChild(subContainer); hasContent = true; }
        }
    }
    return hasContent ? container : null;
}

/** Renderizza la Struttura Generale (complessa, con fasi e sotto-procedimenti). */
function renderStruttura(strutturaData) {
    if (!Array.isArray(strutturaData) || strutturaData.length === 0) return null;

    const container = createElement('div', 'struttura-section section-container');
    container.appendChild(createElement('h3', 'subsection-title', 'Struttura Generale'));
    let hasContent = false;

    strutturaData.forEach(fase => {
        if (!fase || typeof fase !== 'object') return;
        const faseDiv = createElement('div', 'fase-struttura subsection-container');
        let faseHasContent = false;
        if (fase.fase) { faseDiv.appendChild(createElement('h4', 'subsection-group-title', fase.fase)); faseHasContent = true; }
        if (fase.ingredienti_base) { faseDiv.appendChild(createElement('p', 'info', `Ingredienti Base: ${fase.ingredienti_base}`)); faseHasContent = true; }
        // Usa la funzione renderIngredienti corretta (non scala qui)
        if (fase.ingredienti) { const el = renderIngredienti(fase.ingredienti, null, null); if (el) { faseDiv.appendChild(el); faseHasContent = true; } }
        if (Array.isArray(fase.procedimento) && fase.procedimento.length > 0) {
            const procContainer = createElement('div', 'sub-procedimento');
            procContainer.appendChild(createElement('h5', 'sub-subsection-title', 'Procedimento Fase'));
            const procList = createElement('ol');
            let addedStep = false;
            fase.procedimento.forEach(procFase => {
                if (procFase && Array.isArray(procFase.passaggi)) {
                    procFase.passaggi.forEach(step => {
                        if (typeof step === 'string' && step.trim()) { procList.appendChild(createElement('li', null, step.trim())); addedStep = true; }
                    });
                }
            });
            if (addedStep) { procContainer.appendChild(procList); faseDiv.appendChild(procContainer); faseHasContent = true; }
        }
        if (faseHasContent) { container.appendChild(faseDiv); hasContent = true; }
    });
    return hasContent ? container : null;
}

/** Renderizza Esempi Personalizzazione. */
function renderEsempi(esempiData) {
    if (!Array.isArray(esempiData) || esempiData.length === 0) return null;

    const container = createElement('div', 'esempi-section section-container');
    container.appendChild(createElement('h3', 'subsection-title', 'Esempi Personalizzazione'));
    const list = createElement('ul', 'esempi-list');

    esempiData.forEach(esempio => {
        if (!esempio || typeof esempio !== 'object') return;
        const li = createElement('li');
        let contentParts = [];
        if (esempio.ingrediente) { const strong = createElement('strong'); strong.textContent = `${esempio.ingrediente}: `; li.appendChild(strong); }
        if (esempio.note_umami_aromi_dominanti) contentParts.push(`Aromi: ${esempio.note_umami_aromi_dominanti}.`);
        if (esempio.suggerimenti) contentParts.push(`Suggerimenti: ${esempio.suggerimenti}.`);
        if (contentParts.length > 0) li.appendChild(document.createTextNode(contentParts.join(' ')));
        if (li.childNodes.length > 0) list.appendChild(li);
    });

    if (list.hasChildNodes()) { container.appendChild(list); return container; }
    else { return null; }
}

/** Renderizza Pairing Consigliato. */
function renderPairing(pairingData) {
    if (!Array.isArray(pairingData) || pairingData.length === 0) return null;

    const container = createElement('div', 'pairing-section section-container');
    container.appendChild(createElement('h3', 'subsection-title', 'Abbinamenti Consigliati'));
    const list = createElement('ul');
    let added = false;

    pairingData.forEach(pair => {
        if (!pair || !pair.bevanda) return;
        const li = createElement('li');
        let text = `<strong>${pair.bevanda.trim()}</strong>`;
        if (pair.note) text += ` <em>(${pair.note.trim()})</em>`;
        li.innerHTML = text; list.appendChild(li); added = true;
    });

    if (added) { container.appendChild(list); return container; }
    else { return null; }
}


// =============================================
// MAPPA DEI RENDERER (Corretta - ingredienti rimosso)
// =============================================
const sectionRenderers = {
  // 'ingredienti': renderIngredienti, // RIMOSSO
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
// FUNZIONI PRINCIPALI MODAL (openModal, closeModal) - Corrette per Ordine/Scrolling
// =============================================

export function openModal(ricetta, modal, modalContent, bodyElement) {
    console.log("Apro il modal per:", ricetta.nome);
    if (!modal || !modalContent || !ricetta || !bodyElement) {
        console.error("openModal: Argomenti mancanti o nulli", { ricetta, modal, modalContent, bodyElement });
        return;
    }

    modalContent.innerHTML = ''; // Pulisci subito

    // ---- Contenitori Principali (Figli diretti di modalContent) ----
    const textWrapper = createElement('div', 'modal-text-content'); // Area testo (scrollabile)
    const imageContainer = createElement('div', 'modal-image-container'); // Area immagine
    modalContent.appendChild(textWrapper);
    modalContent.appendChild(imageContainer);

    // ---- Header (Figlio di textWrapper) ----
    const modalHeader = createElement('div', 'modal-header');
    const titleH2 = createElement('h2', null, ricetta.nome);
    const closeButton = createElement('button', 'modal-close-button', '\u00D7', { 'aria-label': 'Chiudi dettagli ricetta' });
    modalHeader.appendChild(titleH2);
    modalHeader.appendChild(closeButton);
    textWrapper.appendChild(modalHeader);

    // ---- Body (Figlio di textWrapper - Contenuto che cresce) ----
    const modalBody = createElement('div', 'modal-body');
    textWrapper.appendChild(modalBody);

    // ---- Contenuto Iniziale Fisso (Dentro modalBody) ----
    const categoryP = createElement('p', 'categoria-info');
    categoryP.innerHTML = `Categoria: <strong>${ricetta.categoria || 'Non specificata'}</strong>`;
    modalBody.appendChild(categoryP);
    modalBody.appendChild(createElement('p', 'descrizione-info', ricetta.descrizione || 'Nessuna descrizione fornita.'));

    // ---- Contenitore per Scaling e Ingredienti (Dentro modalBody) ----
    const ingredientsWrapper = createElement('div', 'ingredients-wrapper');
    modalBody.appendChild(ingredientsWrapper);

    // ---- Logica Scaling e Rendering INIZIALE Ingredienti ----
    const porzioniBase = ricetta.porzioni_base;
    let currentServings = (porzioniBase && porzioniBase > 0) ? porzioniBase : 1;
    let servingsSelectorContainer = null;
    let currentIngredientsElement = null;

    const updateIngredientsUI = (servings) => {
        console.log(`Aggiorno ingredienti per: ${servings} porzioni (Base: ${porzioniBase})`);
        if (currentIngredientsElement && currentIngredientsElement.parentNode) {
            currentIngredientsElement.remove();
        }
        currentIngredientsElement = renderIngredienti(ricetta.ingredienti, servings, porzioniBase);
        if (currentIngredientsElement) {
            if (servingsSelectorContainer) {
                servingsSelectorContainer.insertAdjacentElement('afterend', currentIngredientsElement);
            } else {
                ingredientsWrapper.prepend(currentIngredientsElement);
            }
        } else {
             console.error("renderIngredienti ha restituito null.");
        }
    };

    if (porzioniBase && typeof porzioniBase === 'number' && porzioniBase > 0) {
        servingsSelectorContainer = createElement('div', 'servings-selector');
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
        ingredientsWrapper.appendChild(servingsSelectorContainer);

        btnMinus.addEventListener('click', () => {
            if (currentServings > 1) { currentServings--; servingsDisplay.textContent = currentServings; updateIngredientsUI(currentServings); }
        });
        btnPlus.addEventListener('click', () => {
            currentServings++; servingsDisplay.textContent = currentServings; updateIngredientsUI(currentServings);
        });

        updateIngredientsUI(porzioniBase); // Render iniziale con scaling
    } else {
        updateIngredientsUI(1); // Render iniziale senza scaling (base 1)
    }

    // ---- Renderizza PROCEDIMENTO (Ordine Forzato, DENTRO modalBody) ----
    let procedureRendered = false;
    if (ricetta.procedimento && sectionRenderers.procedimento) {
        try {
            const procElement = sectionRenderers.procedimento(ricetta.procedimento);
            if (procElement) {
                modalBody.appendChild(procElement);
                procedureRendered = true;
            }
        } catch (e) {
            console.error(`Errore nel renderer 'procedimento':`, e);
            modalBody.appendChild(createElement('p', 'error-message', `Errore caricamento procedimento.`));
        }
    }

    // ---- Renderizza le ALTRE Sezioni (DENTRO modalBody, dopo il procedimento) ----
    let otherDetailsRendered = false;
    const handledKeys = [
        'nome', 'descrizione', 'categoria', 'porzioni_base', 'ingredienti', 'procedimento'
    ];

    for (const key in ricetta) {
        if (handledKeys.includes(key) || !ricetta[key]) continue;

        if (sectionRenderers.hasOwnProperty(key)) {
            try {
                const sectionElement = sectionRenderers[key](ricetta[key]);
                if (sectionElement) {
                    modalBody.appendChild(sectionElement);
                    otherDetailsRendered = true;
                }
            } catch (e) {
                console.error(`Errore nel renderer per '${key}':`, e);
                modalBody.appendChild(createElement('p', 'error-message', `Errore caricamento sezione: ${key}`));
            }
        } else {
            console.warn(`Nessun renderer definito per la chiave '${key}'. Sezione ignorata.`);
        }
    }

    // ---- Messaggio Fallback (Dentro modalBody) ----
    if (!currentIngredientsElement && !procedureRendered && !otherDetailsRendered) {
         modalBody.appendChild(createElement('p', 'info-message', 'Nessun dettaglio disponibile per questa ricetta.'));
    }

    // ---- Contenitore Immagine (Logica Creazione Immagine INVARIATA) ----
    const imageFilename = generateImageFilename(ricetta.nome);
    let imageUrl = `img/${imageFilename}.jpeg`;
    const recipeImage = createElement('img');
    recipeImage.alt = `Immagine: ${ricetta.nome}`;
    recipeImage.loading = 'lazy';
    const setImageError = (container, imgElement) => {
        container.innerHTML = '<p class="image-error">Immagine non disponibile</p>';
        container.style.backgroundColor = 'var(--color-surface-alt)';
        if(imgElement) imgElement.remove();
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

    // ---- Mostra il Modal (INVARIATO) ----
    modal.classList.add('active');
    bodyElement.style.overflow = 'hidden';

    // ---- Focus e Chiusura (INVARIATO) ----
    setTimeout(() => {
        const focusableElement = servingsSelectorContainer?.querySelector('.servings-button.minus') || titleH2 || closeButton;
        if (focusableElement) focusableElement.focus();
        else { modalContent.setAttribute('tabindex', '-1'); modalContent.focus(); }
    }, 150);

    const closeModalHandler = () => closeModal(modal, modalContent, bodyElement);
    const escapeListener = (e) => { if (e.key === 'Escape') closeModalHandler(); };
    closeButton.addEventListener('click', closeModalHandler);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModalHandler(); });
    window.addEventListener('keydown', escapeListener);
    modal._escapeListener = escapeListener;

} // --- FINE openModal ---


// --- closeModal (INVARIATO) ---
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
    }
    setTimeout(() => {
        if (modalContent) modalContent.innerHTML = '';
    }, 350); // Corrisponde alla durata transizione CSS
}
