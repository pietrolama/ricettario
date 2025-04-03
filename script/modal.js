// modal.js (Integrato con logica di rendering completa dal vecchio script)
import { createElement, generateImageFilename } from './utils.js';

// =============================================
// FUNZIONI HELPER DI RENDERING (Estratte e adattate)
// =============================================

/**
 * Renderizza la sezione Ingredienti nel modale, scalando le quantità.
 * @param {Array} ingredientiData - L'array dei gruppi di ingredienti dalla ricetta.
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

  // Se non abbiamo porzioni base valide, usiamo le desiderate come base (non scala)
  const base = (porzioniBase && porzioniBase > 0) ? porzioniBase : (porzioniDesiderate || 1);
  const target = porzioniDesiderate || base; // Se non specificate desiderate, mostra base

  // Crea il contenitore principale per la sezione ingredienti
  const container = createElement('div', 'ingredients-section section-container');
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
      const numBase = item.quantita_num;
      const unit = item.unita || '';
      let displayNumScaled = null;

      // --- Logica di Scaling ---
      if (numBase !== null && numBase !== undefined && base > 0 && target > 0) {
        const numScaled = (numBase / base) * target;
        // Arrotonda a 2 decimali solo se non è un intero o un numero molto piccolo
        if (numScaled === 0) {
          displayNumScaled = 0; // Mostra 0 se il risultato è 0
        } else if (Number.isInteger(numScaled)) {
          displayNumScaled = numScaled;
        } else if (numScaled < 0.1 && numScaled > 0) {
          displayNumScaled = numScaled.toFixed(3); // Più precisione per numeri piccoli
        } else {
          displayNumScaled = numScaled.toFixed(2); // Arrotonda a 2 decimali
        }
        quantityString = `${displayNumScaled} ${unit}`.trim();
      } else if (unit.toLowerCase() === 'q.b.') {
        quantityString = 'q.b.';
      } else if (unit && numBase === null) { // Es: solo unità come "pizzico"
        quantityString = unit; // Mostra solo l'unità
        if (!isNaN(parseInt(unit))) { // Caso speciale es. "1 pizzico" gestito come unità
          quantityString = unit;
        }
      } else if (numBase !== null && numBase !== undefined) { // Caso in cui non si scala (mostra base)
        const displayNumBase = Number.isInteger(numBase) ? numBase : numBase.toFixed(2);
        quantityString = `${displayNumBase} ${unit}`.trim();
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
      return; // Salta fasi vuote o malformate
    }

    // Aggiungi titolo fase se presente
    if (faseObj.fase) {
      container.appendChild(createElement('h4', 'subsection-group-title', faseObj.fase.trim()));
    }

    // Crea lista ordinata <ol>
    const list = createElement('ol');
    faseObj.passaggi.forEach(step => {
      if (typeof step === 'string' && step.trim()) {
        list.appendChild(createElement('li', null, step.trim()));
        hasContent = true;
      }
    });

    // Aggiungi lista se contiene elementi
    if (list.hasChildNodes()) {
      container.appendChild(list);
    }
  });

  return hasContent ? container : null;
}

/** Renderizza una sezione generica (es. note, tips, impiattamento) come lista o paragrafo. */
function renderGenericListSection(data, title, tag = 'ul') {
  // Verifica se ci sono dati validi
  const hasValidData = data && (
    (Array.isArray(data) && data.some(item => (typeof item === 'string' && item.trim()) || (typeof item === 'object' && item !== null))) ||
    (typeof data === 'string' && data.trim())
  );
  if (!hasValidData) return null;

  const container = createElement('div', `generic-section section-container ${title.toLowerCase().replace(/\s+/g, '-')}`);
  container.appendChild(createElement('h3', 'subsection-title', title));

  if (Array.isArray(data)) {
    const list = createElement(tag); // 'ul' o 'ol'
    let added = false;
    data.forEach(item => {
      if (typeof item === 'string' && item.trim()) {
        list.appendChild(createElement('li', null, item.trim()));
        added = true;
      } else if (typeof item === 'object' && item !== null) {
        // Gestione base per oggetti (mostra come JSON) - potrebbe servire logica più specifica
        try {
          list.appendChild(createElement('li', 'json-item', JSON.stringify(item, null, 2))); // Formattato
          added = true;
        } catch (e) { console.warn("Impossibile serializzare oggetto in sezione generica:", item); }
      }
    });
    if (added) container.appendChild(list);
    else return null; // Nessun item valido aggiunto
  } else if (typeof data === 'string') {
    container.appendChild(createElement('p', null, data.trim())); // Mostra stringa come paragrafo
  } else {
    return null; // Tipo non gestito
  }
  return container;
}

/** Renderizza la sezione Varianti (può contenere sottosezioni). */
function renderVarianti(variantiData) {
  // Gestisce sia array che singolo oggetto
  const variantiArray = Array.isArray(variantiData) ? variantiData : (variantiData ? [variantiData] : []);
  if (variantiArray.length === 0) return null;

  const container = createElement('div', 'varianti-section section-container');
  container.appendChild(createElement('h3', 'subsection-title', 'Varianti'));
  let mainHasContent = false;

  variantiArray.forEach(variante => {
    if (!variante || typeof variante !== 'object') return;

    const varianteDiv = createElement('div', 'variante-item subsection-container'); // Classe per stile variante singola
    let varianteHasContent = false;

    // Renderizza le chiavi note di una variante
    if (variante.nome) { varianteDiv.appendChild(createElement('h4', 'subsection-group-title', variante.nome)); varianteHasContent = true; }
    if (variante.descrizione) { varianteDiv.appendChild(createElement('p', 'descrizione-info', variante.descrizione)); varianteHasContent = true; }
    if (variante.note) { varianteDiv.appendChild(createElement('p', 'variante-note', variante.note)); varianteHasContent = true; } // Per la chiave "note" trovata

    // Renderer specifici per eventuali sotto-dati
    if (variante.ingredienti) { const el = renderIngredienti(variante.ingredienti); if (el) { varianteDiv.appendChild(el); varianteHasContent = true; } }
    if (variante.procedimento) { const el = renderProcedimento(variante.procedimento); if (el) { varianteDiv.appendChild(el); varianteHasContent = true; } }
    if (variante.applicazioni) { varianteDiv.appendChild(createElement('p', 'applicazioni-info', `Applicazioni: ${variante.applicazioni}`)); varianteHasContent = true; }

    // Aggiungi altri campi specifici delle varianti se necessario

    // Aggiungi la variante al container principale solo se ha contenuto
    if (varianteHasContent) {
      container.appendChild(varianteDiv);
      mainHasContent = true;
    }
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
    // Assicurati che la chiave appartenga all'oggetto e che il valore sia un array non vuoto
    if (Object.prototype.hasOwnProperty.call(usiData, key) && Array.isArray(usiData[key]) && usiData[key].length > 0) {

      const subContainer = createElement('div', 'uso-subsection subsection-container'); // Usa classi per stile
      // Formatta la chiave per usarla come titolo (es. 'liquido_fermentato' -> 'Liquido Fermentato')
      const titleText = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
      const title = createElement('h4', 'subsection-group-title', titleText);
      subContainer.appendChild(title);

      const list = createElement('ul');
      let addedItem = false;
      usiData[key].forEach(item => {
        // Aggiungi solo stringhe non vuote
        if (typeof item === 'string' && item.trim()) {
          list.appendChild(createElement('li', null, item.trim()));
          addedItem = true;
        }
      });

      // Aggiungi la sottosezione solo se la lista contiene elementi
      if (addedItem) {
        subContainer.appendChild(list);
        container.appendChild(subContainer);
        hasContent = true;
      }
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

    // Renderizza ingredienti specifici della fase (se presenti)
    if (fase.ingredienti) { const el = renderIngredienti(fase.ingredienti); if (el) { faseDiv.appendChild(el); faseHasContent = true; } }

    // Renderizza procedimento specifico della fase (se presente)
    if (Array.isArray(fase.procedimento) && fase.procedimento.length > 0) {
      const procContainer = createElement('div', 'sub-procedimento'); // Contenitore per il procedimento interno
      procContainer.appendChild(createElement('h5', 'sub-subsection-title', 'Procedimento Fase')); // Titolo per chiarezza
      const procList = createElement('ol');
      let addedStep = false;
      fase.procedimento.forEach(procFase => { // Il procedimento può essere un array di oggetti {fase, passaggi}
        if (procFase && Array.isArray(procFase.passaggi)) {
          // Potrebbe esserci un titolo anche qui, ma per semplicità lo ignoriamo e concateniamo i passaggi
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
        faseHasContent = true;
      }
    }

    // Aggiungi la fase solo se ha contenuto
    if (faseHasContent) {
      container.appendChild(faseDiv);
      hasContent = true;
    }
  });
  return hasContent ? container : null;
}

/** Renderizza Esempi Personalizzazione. */
function renderEsempi(esempiData) {
  if (!Array.isArray(esempiData) || esempiData.length === 0) return null;

  const container = createElement('div', 'esempi-section section-container');
  container.appendChild(createElement('h3', 'subsection-title', 'Esempi Personalizzazione'));
  const list = createElement('ul', 'esempi-list'); // Lista per gli esempi

  esempiData.forEach(esempio => {
    if (!esempio || typeof esempio !== 'object') return;

    const li = createElement('li');
    let contentParts = [];

    if (esempio.ingrediente) {
      // Crea uno span bold per l'ingrediente, poi aggiunge il testo normale
      const strong = createElement('strong');
      strong.textContent = `${esempio.ingrediente}: `;
      li.appendChild(strong);
    }
    if (esempio.note_umami_aromi_dominanti) contentParts.push(`Aromi: ${esempio.note_umami_aromi_dominanti}.`);
    if (esempio.suggerimenti) contentParts.push(`Suggerimenti: ${esempio.suggerimenti}.`);

    // Aggiunge il testo restante dopo l'elemento strong
    if (contentParts.length > 0) {
      li.appendChild(document.createTextNode(contentParts.join(' ')));
    }

    // Aggiungi li solo se ha contenuto (almeno ingrediente o dettagli)
    if (li.childNodes.length > 0) {
      list.appendChild(li);
    }
  });

  if (list.hasChildNodes()) {
    container.appendChild(list);
    return container;
  } else {
    return null; // Nessun esempio valido trovato
  }
}


/** Renderizza Pairing Consigliato. */
function renderPairing(pairingData) {
  if (!Array.isArray(pairingData) || pairingData.length === 0) return null;

  const container = createElement('div', 'pairing-section section-container'); // Classe specifica
  container.appendChild(createElement('h3', 'subsection-title', 'Abbinamenti Consigliati'));
  const list = createElement('ul');
  let added = false;

  pairingData.forEach(pair => {
    if (!pair || !pair.bevanda) return; // Salta se manca la bevanda

    const li = createElement('li');
    // Usa innerHTML per permettere corsivo nella nota
    let text = `<strong>${pair.bevanda.trim()}</strong>`;
    if (pair.note) {
      text += ` <em>(${pair.note.trim()})</em>`; // Nota in corsivo
    }
    li.innerHTML = text;
    list.appendChild(li);
    added = true;
  });

  if (added) {
    container.appendChild(list);
    return container;
  } else {
    return null;
  }
}


// =============================================
// MAPPA DEI RENDERER
// =============================================
// Mappa le chiavi del JSON alle funzioni di rendering corrispondenti
const sectionRenderers = {
  'ingredienti': renderIngredienti,
  'procedimento': renderProcedimento,
  'varianti': renderVarianti,
  'utilizzo': renderUsi, // Gestisce sia 'utilizzo' che 'usi'
  'usi': renderUsi,
  'struttura_generale': renderStruttura,
  'esempi_personalizzazione': renderEsempi,
  'tips_tecnici': (data) => renderGenericListSection(data, 'Tips Tecnici'),
  'note_tecniche': (data) => renderGenericListSection(data, 'Note Tecniche'),
  'note_finali': (data) => renderGenericListSection(data, 'Note Finali'),
  'note': (data) => renderGenericListSection(data, 'Note'), // Chiave generica 'note'
  'note_dello_chef': (data) => renderGenericListSection(data, 'Note dello Chef'),
  'note_di_degustazione': (data) => renderGenericListSection(data, 'Note di Degustazione'),
  'finitura_consigliata': (data) => renderGenericListSection(data, 'Finitura Consigliata'),
  'pairing_consigliato': renderPairing,
  // Gestisce 'vino_abbinato' come caso semplice
  'vino_abbinato': (data) => data ? createElement('div', 'vino-info section-container', [ // Usa div e aggiungi titolo
    createElement('h3', 'subsection-title', 'Vino Consigliato'),
    createElement('p', null, data)
  ]) : null,
  'attrezzature': (data) => renderGenericListSection(data, 'Attrezzature'),
  'presentazione_consigliata': (data) => renderGenericListSection(data, 'Presentazione Consigliata'),
  // Usa lista ordinata <ol> per impiattamento/assemblaggio
  'impiattamento': (data) => renderGenericListSection(data, 'Impiattamento', 'ol'),
  'assemblaggio_del_piatto': (data) => renderGenericListSection(data, 'Assemblaggio del Piatto', 'ol')
  // Aggiungi altre chiavi specifiche se necessario
};


// =============================================
// FUNZIONI PRINCIPALI MODAL (openModal, closeModal)
// =============================================

export function openModal(ricetta, modal, modalContent, bodyElement) {
  console.log("Apro il modal per:", ricetta.nome);
  if (!modal || !modalContent || !ricetta || !bodyElement) {
    console.error("openModal: Argomenti mancanti o nulli", { ricetta, modal, modalContent, bodyElement });
    return;
  }

  modalContent.innerHTML = ''; // Pulisci subito

  // ---- Contenitore Testo ----
  const textWrapper = createElement('div', 'modal-text-content');

  // ---- Header ----
  const modalHeader = createElement('div', 'modal-header');
  const titleH2 = createElement('h2', null, ricetta.nome);
  const closeButton = createElement('button', 'modal-close-button', '\u00D7', { 'aria-label': 'Chiudi dettagli ricetta' });
  modalHeader.appendChild(titleH2);
  modalHeader.appendChild(closeButton);
  textWrapper.appendChild(modalHeader);

  // ---- Body (Contenuto Ricetta Dettagliato) ----
  const modalBody = createElement('div', 'modal-body');

  // Categoria e Descrizione
  const categoryP = createElement('p', 'categoria-info');
  categoryP.innerHTML = `Categoria: <strong>${ricetta.categoria || 'Non specificata'}</strong>`;
  modalBody.appendChild(categoryP);
  modalBody.appendChild(createElement('p', 'descrizione-info', ricetta.descrizione || 'Nessuna descrizione fornita.'));

  // ---- NUOVO: Contenitore per Selettore Porzioni e Ingredienti ----
  const ingredientsWrapper = createElement('div', 'ingredients-wrapper');
  modalBody.appendChild(ingredientsWrapper);

  // ---- NUOVO: Logica Selettore Porzioni con Bottoni +/- ----

  // 1. DICHIARA porzioniBase QUI, PRIMA della funzione che la usa
  const porzioniBase = ricetta.porzioni_base;

  const servingsContainer = createElement('div', 'servings-selector');
  let servingsDisplay = null; // Riferimento all'elemento che mostra il numero

  // 2. DEFINISCI la funzione DOPO aver dichiarato porzioniBase
  const updateIngredientsList = (servings) => {
    console.log(`Aggiorno ingredienti per: ${servings} porzioni (Base: ${porzioniBase})`); // Ora può accedere a porzioniBase
    const currentIngredientsSection = ingredientsWrapper.querySelector('.ingredients-section');
    if (currentIngredientsSection) {
      currentIngredientsSection.remove();
    }
    // Usa la variabile porzioniBase dichiarata sopra
    const newIngredientsSection = renderIngredienti(ricetta.ingredienti, servings, porzioniBase);
    if (newIngredientsSection) {
      servingsContainer.insertAdjacentElement('afterend', newIngredientsSection);
    }
  };

  // 3. Procedi con la logica per creare il selettore (che ora può usare updateIngredientsList)
  if (porzioniBase && typeof porzioniBase === 'number' && porzioniBase > 0) {
    console.log(`Ricetta ${ricetta.nome} ha porzioni base: ${porzioniBase}`);

    const label = createElement('span', 'servings-label', 'Porzioni: ');
    const counterWrapper = createElement('div', 'servings-counter');
    const btnMinus = createElement('button', 'servings-button minus', '-', { 'aria-label': 'Diminuisci porzioni', 'type': 'button' });
    servingsDisplay = createElement('span', 'servings-display', porzioniBase);
    const btnPlus = createElement('button', 'servings-button plus', '+', { 'aria-label': 'Aumenta porzioni', 'type': 'button' });

    counterWrapper.appendChild(btnMinus);
    counterWrapper.appendChild(servingsDisplay);
    counterWrapper.appendChild(btnPlus);

    servingsContainer.appendChild(label);
    servingsContainer.appendChild(counterWrapper);
    ingredientsWrapper.appendChild(servingsContainer);

    btnMinus.addEventListener('click', () => {
      let currentVal = parseInt(servingsDisplay.textContent);
      if (currentVal > 1) {
        currentVal--;
        servingsDisplay.textContent = currentVal;
        updateIngredientsList(currentVal); // Chiama la funzione definita sopra
      }
    });

    btnPlus.addEventListener('click', () => {
      let currentVal = parseInt(servingsDisplay.textContent);
      currentVal++;
      servingsDisplay.textContent = currentVal;
      updateIngredientsList(currentVal); // Chiama la funzione definita sopra
    });

  } else {
    console.log(`Ricetta ${ricetta.nome} non ha porzioni base valide definite (${porzioniBase}). Scaling disabilitato.`);
  }
  // ---- FINE Logica Selettore Porzioni ----

  // ---- Rendering Dinamico Sezioni ----
  let detailsRendered = false;
  // Renderizza la sezione ingredienti iniziale
  const initialServings = (porzioniBase && porzioniBase > 0) ? porzioniBase : 1;
  const initialIngredientsSection = renderIngredienti(ricetta.ingredienti, initialServings, porzioniBase); // Usa porzioniBase dichiarata all'inizio
  if (initialIngredientsSection) {
    if (ingredientsWrapper.querySelector('.servings-selector')) {
      servingsContainer.insertAdjacentElement('afterend', initialIngredientsSection);
    } else {
      ingredientsWrapper.prepend(initialIngredientsSection);
    }
    detailsRendered = true;
  }

  // Ciclo per le altre sezioni (invariato)
  // ... (resto del codice openModal) ...

  // Ciclo per le altre sezioni (invariato rispetto a prima, ma assicurati che vengano aggiunte DOPO ingredientsWrapper)
  for (const key in ricetta) {
    if (['nome', 'descrizione', 'categoria', 'ingredienti', 'porzioni_base'].includes(key) || !ricetta[key]) continue;

    let sectionElement = null;
    if (sectionRenderers.hasOwnProperty(key)) {
      try {
        sectionElement = sectionRenderers[key](ricetta[key]);
      } catch (e) {
        console.error(`Errore nel renderer specifico per la chiave '${key}' in ricetta '${ricetta.nome}':`, e);
        sectionElement = createElement('p', 'error-message', `Errore nel caricamento della sezione: ${key}`);
      }
    } else {
      console.warn(`Nessun renderer specifico per la chiave '${key}' in ricetta '${ricetta.nome}'. Uso fallback generico.`);
      try {
        const title = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        sectionElement = renderGenericListSection(ricetta[key], title);
      } catch (e) {
        console.error(`Errore nel renderer generico per la chiave '${key}' in ricetta '${ricetta.nome}':`, e);
        sectionElement = createElement('p', 'error-message', `Errore nel caricamento della sezione generica: ${key}`);
      }
    }

    if (sectionElement) {
      // Aggiungi le altre sezioni DOPO il wrapper degli ingredienti
      ingredientsWrapper.insertAdjacentElement('afterend', sectionElement);
      detailsRendered = true; // Segna che abbiamo renderizzato qualcosa
    }
  }


  // Messaggio se non sono stati renderizzati dettagli (invariato)
  if (!detailsRendered && !initialIngredientsSection) { // Controllo aggiuntivo
    modalBody.appendChild(createElement('p', 'info-message', 'Nessun dettaglio disponibile per questa ricetta.'));
  }

  // Aggiungi il corpo popolato al wrapper del testo (invariato)
  textWrapper.appendChild(modalBody);

  // ---- Contenitore Immagine (invariato) ----
  // ... (codice immagine invariato) ...
  const imageContainer = createElement('div', 'modal-image-container');
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
    console.warn(`Immagine ${imageUrl} non trovata. Tento con .png`);
    imageUrl = `img/${imageFilename}.png`;
    recipeImage.src = imageUrl;
    recipeImage.onerror = () => {
      console.warn(`Immagine ${imageUrl} non trovata. Tento con .webp`);
      imageUrl = `img/${imageFilename}.webp`;
      recipeImage.src = imageUrl;
      recipeImage.onerror = () => {
        console.error(`Immagine non trovata per ${ricetta.nome} con estensioni .jpeg, .png, .webp.`);
        setImageError(imageContainer, recipeImage);
      };
    };
  };
  recipeImage.src = imageUrl;
  imageContainer.appendChild(recipeImage);

  // ---- Assembla Contenuto Modal (invariato) ----
  modalContent.appendChild(textWrapper);
  modalContent.appendChild(imageContainer);

  // ---- Mostra il Modal (invariato) ----
  modal.classList.add('active');
  bodyElement.style.overflow = 'hidden';

  // ---- Focus e Chiusura (modificato per focus) ----
  setTimeout(() => {
    // Prova a dare focus al primo bottone del contatore, se esiste
    const focusableElement = servingsContainer.querySelector('.servings-button.minus') || titleH2 || closeButton;
    if (focusableElement) {
      focusableElement.focus();
    } else {
      modalContent.setAttribute('tabindex', '-1');
      modalContent.focus();
      console.warn("Nessun elemento focusabile (counter/titolo/bottone) trovato nel modal.");
    }
  }, 150);

  // Gestore e listener chiusura (invariato)
  const closeModalHandler = () => closeModal(modal, modalContent, bodyElement);
  const escapeListener = (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModalHandler();
    }
  };
  closeButton.addEventListener('click', closeModalHandler);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalHandler();
  });
  window.addEventListener('keydown', escapeListener);
  modal._escapeListener = escapeListener;
}


// La funzione closeModal rimane invariata
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

  setTimeout(() => {
    if (modalContent) modalContent.innerHTML = '';
  }, 350);
}
