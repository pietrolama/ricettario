// modal.js (Integrato con logica di rendering completa dal vecchio script)
import { createElement, generateImageFilename } from './utils.js';

// =============================================
// FUNZIONI HELPER DI RENDERING (Estratte e adattate)
// =============================================

/** Renderizza la sezione Ingredienti nel modale. */
function renderIngredienti(ingredientiData) {
    // Verifica iniziale dei dati
    if (!Array.isArray(ingredientiData) || ingredientiData.length === 0) {
        console.log("Nessun dato valido per renderIngredienti");
        return null;
    }

    // Crea il contenitore principale per la sezione ingredienti
    const container = createElement('div', 'ingredients-section section-container'); // Usa classi specifiche se necessario
    container.appendChild(createElement('h3', 'subsection-title', 'Ingredienti')); // Titolo della sezione
    let hasContent = false; // Flag per tracciare se è stato aggiunto contenuto utile

    // Itera su ogni gruppo di ingredienti (es. "Per l'impasto", "Per la farcia")
    ingredientiData.forEach(gruppo => {
        // Salta gruppi non validi o senza lista ingredienti
        if (!gruppo || !Array.isArray(gruppo.lista_ingredienti) || gruppo.lista_ingredienti.length === 0) {
            console.warn("Gruppo ingredienti saltato:", gruppo);
            return;
        }

        // Aggiungi un sottotitolo se il gruppo ha un nome
        if (gruppo.nome_gruppo) {
            // Formatta il nome del gruppo (es. rimuovi underscore, capitalizza)
            const nomeGruppoFmt = gruppo.nome_gruppo.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            container.appendChild(createElement('h4', 'subsection-group-title', nomeGruppoFmt));
        }

        // Crea la lista <ul> per gli ingredienti di questo gruppo
        const list = createElement('ul');
        gruppo.lista_ingredienti.forEach(item => {
            // Salta item non validi o senza nome ingrediente
            if (!item || !item.ingrediente) {
                console.warn("Item ingrediente saltato:", item);
                return;
            }

            // Costruisci la stringa dell'ingrediente formattata
            let textParts = [];
            if (item.quantita) textParts.push(item.quantita.trim());
            textParts.push(item.ingrediente.trim());
            if (item.per) textParts.push(`(per ${item.per.trim()})`);
            if (item.note) textParts.push(`<em>(${item.note.trim()})</em>`); // Usa <em> per le note

            let text = textParts.join(' ').replace(/\s+/g, ' '); // Unisci con spazio singolo

            // Crea l'elemento <li> e aggiungi il contenuto (usando innerHTML per <em>)
            if (text) {
                const li = createElement('li');
                li.innerHTML = text; // Imposta HTML per permettere tag come <em>
                list.appendChild(li);
                hasContent = true; // Segna che abbiamo aggiunto contenuto
            }
        });

        // Aggiungi la lista al container solo se contiene elementi
        if (list.hasChildNodes()) {
            container.appendChild(list);
        }
    });

    // Ritorna il container solo se contiene effettivamente qualcosa
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
        if(contentParts.length > 0) {
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
    modalBody.appendChild(createElement('p', 'categoria-info', `Categoria: <strong>${ricetta.categoria || 'Non specificata'}</strong>`));
    modalBody.appendChild(createElement('p', 'descrizione-info', ricetta.descrizione || 'Nessuna descrizione fornita.'));

    // ---- Rendering Dinamico Sezioni ----
    let detailsRendered = false; // Flag per vedere se abbiamo renderizzato qualcosa
    for (const key in ricetta) {
        // Salta le chiavi già gestite o non utili qui
        if (['nome', 'descrizione', 'categoria'].includes(key) || !ricetta[key]) continue;

        let sectionElement = null;
        if (sectionRenderers.hasOwnProperty(key)) {
            // Usa il renderer specifico se esiste
            try {
                 sectionElement = sectionRenderers[key](ricetta[key]);
            } catch (e) {
                console.error(`Errore nel renderer specifico per la chiave '${key}' in ricetta '${ricetta.nome}':`, e);
                sectionElement = createElement('p', 'error-message', `Errore nel caricamento della sezione: ${key}`);
            }
        } else {
             // Fallback generico per chiavi non mappate (ma solo se ha un valore)
             console.warn(`Nessun renderer specifico per la chiave '${key}' in ricetta '${ricetta.nome}'. Uso fallback generico.`);
             try {
                // Formatta la chiave per usarla come titolo
                const title = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                sectionElement = renderGenericListSection(ricetta[key], title);
             } catch (e) {
                 console.error(`Errore nel renderer generico per la chiave '${key}' in ricetta '${ricetta.nome}':`, e);
                 sectionElement = createElement('p', 'error-message', `Errore nel caricamento della sezione generica: ${key}`);
             }
        }

        // Aggiungi l'elemento al body solo se è stato creato
        if (sectionElement) {
            modalBody.appendChild(sectionElement);
            detailsRendered = true; // Abbiamo aggiunto almeno una sezione
        }
    }

    // Messaggio se non sono stati renderizzati dettagli (improbabile ma possibile)
    if (!detailsRendered) {
         modalBody.appendChild(createElement('p', 'info-message', 'Nessun dettaglio aggiuntivo disponibile per questa ricetta.'));
    }

    // Aggiungi il corpo popolato al wrapper del testo
    textWrapper.appendChild(modalBody);

    // ---- Contenitore Immagine ----
    const imageContainer = createElement('div', 'modal-image-container');
    const imageFilename = generateImageFilename(ricetta.nome);
    // Tentativo primario (es. JPEG)
    let imageUrl = `img/${imageFilename}.jpeg`;
    const recipeImage = createElement('img');
    recipeImage.alt = `Immagine: ${ricetta.nome}`;
    recipeImage.loading = 'lazy';

    const setImageError = (container, imgElement) => {
        container.innerHTML = '<p class="image-error">Immagine non disponibile</p>';
        container.style.backgroundColor = 'var(--color-surface-alt)';
        imgElement.remove(); // Rimuovi l'elemento img fallito
    };

    recipeImage.onerror = () => {
        console.warn(`Immagine ${imageUrl} non trovata. Tento con .png`);
        imageUrl = `img/${imageFilename}.png`;
        recipeImage.src = imageUrl; // Prova PNG
        recipeImage.onerror = () => {
            console.warn(`Immagine ${imageUrl} non trovata. Tento con .webp`);
            imageUrl = `img/${imageFilename}.webp`;
            recipeImage.src = imageUrl; // Prova WEBP
            recipeImage.onerror = () => { // Fallback finale
                console.error(`Immagine non trovata per ${ricetta.nome} con estensioni .jpeg, .png, .webp.`);
                setImageError(imageContainer, recipeImage);
            };
        };
    };
    recipeImage.src = imageUrl; // Imposta SRC iniziale (JPEG)
    imageContainer.appendChild(recipeImage);


    // ---- Assembla Contenuto Modal ----
    modalContent.appendChild(textWrapper); // Prima il testo
    modalContent.appendChild(imageContainer); // Poi l'immagine

    // ---- Mostra il Modal ----
    modal.classList.add('active');
    bodyElement.style.overflow = 'hidden'; // Blocca scroll body

    // ---- Focus e Chiusura ----
    setTimeout(() => {
        const focusableElement = titleH2 || closeButton;
        if (focusableElement) {
            focusableElement.focus();
        } else {
            modalContent.setAttribute('tabindex', '-1');
            modalContent.focus();
             console.warn("Nessun elemento focusabile (titolo/bottone) trovato nell'header del modal.");
        }
    }, 150);

    // Gestore unico per chiusura (per rimozione facile)
    const closeModalHandler = () => closeModal(modal, modalContent, bodyElement);

    // Listener per Escape (da aggiungere e rimuovere dinamicamente)
    const escapeListener = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModalHandler();
        }
    };

    // Aggiungi listener
    closeButton.addEventListener('click', closeModalHandler);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModalHandler();
    });
    // Aggiungi il listener escape e salva il riferimento per rimuoverlo
    window.addEventListener('keydown', escapeListener);
    modal._escapeListener = escapeListener; // Salva riferimento sul nodo

}

export function closeModal(modal, modalContent, bodyElement) {
    if (!modal || !modal.classList.contains('active')) return; // Già chiuso o non valido

    console.log("Chiudo il modal");
    modal.classList.remove('active'); // Rimuove classe per nascondere e animare uscita

    // Ripristina scroll body, ma controlla se il menu mobile è aperto
    if (!document.body.classList.contains('menu-open')) {
        bodyElement.style.overflow = '';
    }

    // Rimuovi listener Escape se esiste
    if (modal._escapeListener) {
        window.removeEventListener('keydown', modal._escapeListener);
        delete modal._escapeListener; // Pulisci riferimento
         console.log("Listener Escape rimosso.");
    }

    // Pulisci contenuto DOPO la transizione CSS
    setTimeout(() => {
        if (modalContent) modalContent.innerHTML = '';
    }, 350); // Corrisponde (o leggermente >) alla durata transizione
}