// ricettario.js
import { createElement, generateImageFilename } from './utils.js';
import { openModal } from './modal.js';

// Variabili globali del modulo per i dati e l'elenco piatto delle ricette
export let ricettarioData = null;
export let allRicette = [];

// --- Funzione per aggiornare il contatore ricette nell'header ---
function updateRecipeCount() {
    // Seleziona l'elemento del contatore
    const recipeCounterElement = document.getElementById('recipe-counter');
    // Se l'elemento non esiste nel DOM, esci
    if (!recipeCounterElement) {
        console.warn("Elemento contatore ricette #recipe-counter non trovato nel DOM.");
        return;
    }

    const totalRecipes = allRicette.length; // Ottieni il numero totale di ricette processate

    if (totalRecipes > 0) {
        // Aggiorna il testo con il numero corretto e gestisce il plurale
        recipeCounterElement.textContent = `${totalRecipes} Ricett${totalRecipes === 1 ? 'a' : 'e'}`;
        // Assicura che eventuali classi di stato precedenti siano rimosse
        recipeCounterElement.classList.remove('error', 'loading');
    } else {
        // Messaggio se non ci sono ricette (dopo il caricamento)
        recipeCounterElement.textContent = 'Nessuna ricetta caricata';
        // Rimuovi lo stato di caricamento e aggiungi (opzionalmente) uno stato di errore/vuoto
        recipeCounterElement.classList.remove('loading');
        recipeCounterElement.classList.add('error'); // Puoi decidere se usare 'error' o un'altra classe
    }
}

// --- Funzione principale per caricare e processare i dati del ricettario ---
export function loadRicettario(updateUICallback) {
    // Funzione passata come callback per aggiornare il resto dell'UI dopo il caricamento
    if (typeof updateUICallback !== 'function') {
        console.error("loadRicettario richiede una funzione di callback valida per aggiornare l'UI.");
        return;
    }

    const recipeCounterElement = document.getElementById('recipe-counter');

    // Imposta lo stato iniziale del contatore su "Caricamento"
    if (recipeCounterElement) {
        recipeCounterElement.textContent = 'Caricamento ricette...';
        recipeCounterElement.classList.add('loading');
        recipeCounterElement.classList.remove('error'); // Rimuovi eventuale stato di errore precedente
    }

    // Esegui il fetch del file JSON
    fetch('ricettarioNew.json')
        .then(response => {
            // Controlla se la richiesta HTTP è andata a buon fine
            if (!response.ok) {
                throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
            }
            // Parsa la risposta come JSON
            return response.json();
        })
        .then(data => {
            // I dati sono stati caricati e parsati con successo
            ricettarioData = data; // Salva i dati grezzi
            processRicette();      // Estrai e appiattisci le ricette in allRicette
            updateRecipeCount();   // Aggiorna il contatore nell'header con il numero corretto
            updateUICallback();    // Chiama la funzione per aggiornare il resto dell'UI (categorie, vista iniziale)
        })
        .catch(error => {
            // Gestisce errori durante il fetch o il parsing
            console.error('Errore durante il caricamento o parsing di ricettario.json:', error);

            // Aggiorna il contatore per mostrare l'errore
            if (recipeCounterElement) {
                recipeCounterElement.textContent = 'Errore Caricamento';
                recipeCounterElement.classList.add('error');
                recipeCounterElement.classList.remove('loading');
            }
            // Potresti voler notificare l'utente in modo più visibile
            // o chiamare updateUICallback per mostrare un messaggio di errore nella UI principale.
            // Esempio: updateUICallback(error); // Passa l'errore se la callback lo gestisce
        });
}

// --- Funzione per processare i dati grezzi e popolare l'array allRicette ---
export function processRicette() {
    allRicette = []; // Svuota l'array prima di riempirlo (importante per ricaricamenti)

    // Verifica che i dati e la struttura base esistano
    if (!ricettarioData?.categorie || !Array.isArray(ricettarioData.categorie)) {
        console.warn("processRicette: Dati 'ricettario.json' mancanti o struttura 'categorie' non valida.");
        return; // Esce se la struttura base non è corretta
    }

    // Itera su ogni categoria
    ricettarioData.categorie.forEach(categoria => {
        // Controlli di validità sulla categoria
        if (!categoria || typeof categoria.nome !== 'string' || !categoria.nome.trim()) {
            console.warn("processRicette: Trovata categoria non valida (manca nome?), verrà saltata.", categoria);
            return; // Salta questa categoria e passa alla successiva
        }
        // Controlla se l'array 'ricette' esiste ed è un array
        if (Array.isArray(categoria.ricette)) {
            // Itera su ogni ricetta nella categoria
            categoria.ricette.forEach(ricetta => {
                // Controlli di validità sulla ricetta
                if (!ricetta || typeof ricetta.nome !== 'string' || !ricetta.nome.trim()) {
                    console.warn(`processRicette: Trovata ricetta non valida (manca nome?) nella categoria '${categoria.nome}', verrà saltata.`, ricetta);
                    return; // Salta questa ricetta e passa alla successiva
                }
                // Aggiunge la ricetta all'array piatto 'allRicette',
                // includendo il nome della categoria per riferimenti futuri.
                allRicette.push({
                    ...ricetta, // Copia tutte le proprietà della ricetta originale
                    categoria: categoria.nome // Aggiunge/sovrascrive la proprietà 'categoria'
                });
            });
        } else {
            // Segnala se una categoria non ha un array 'ricette'
            console.warn(`processRicette: La categoria '${categoria.nome}' non contiene un array 'ricette' valido.`);
        }
    });

    // Log finale utile per il debug
    console.log(`processRicette: Terminato. Trovate e processate ${allRicette.length} ricette totali.`);
}

// --- Funzione per renderizzare la galleria (o vista "tutte") ---
// Nota: Questa funzione ora è usata principalmente per la logica di filtraggio
//       quando chiamata dalla ricerca o da un click categoria nel vecchio modo.
//       La visualizzazione effettiva è gestita da renderAllRecipes in main.js
export function renderGallery(filter = '', galleryElement) {
    // Se l'elemento galleria non esiste, esci
    if (!galleryElement) {
        console.error("renderGallery: Elemento galleria non fornito.");
        return;
    }

    // Usa requestAnimationFrame per ottimizzare il rendering
    requestAnimationFrame(() => {
        galleryElement.innerHTML = ''; // Pulisce il contenuto precedente
        const lowerCaseFilter = filter.toLowerCase().trim();

        // Filtra l'array globale 'allRicette'
        const filteredRicette = allRicette.filter(ricetta =>
            !filter || // Se non c'è filtro, include tutto
            ricetta.nome.toLowerCase().includes(lowerCaseFilter) ||
            (ricetta.descrizione && ricetta.descrizione.toLowerCase().includes(lowerCaseFilter)) ||
            ricetta.categoria.toLowerCase().includes(lowerCaseFilter)
            // Aggiungere eventuale ricerca in ingredienti qui se necessario (può impattare performance)
        );

        // Mostra un messaggio se non ci sono risultati
        if (filteredRicette.length === 0) {
            galleryElement.innerHTML = `<p class="gallery-empty-message">Nessuna ricetta trovata ${filter ? 'per "' + filter + '"' : ''}.</p>`;
        } else {
            // Crea un fragment per aggiungere le card in modo efficiente
            const fragment = document.createDocumentFragment();
            filteredRicette.forEach(ricetta => {
                // Usa la funzione createAndAppendCard per creare ogni card
                fragment.appendChild(createAndAppendCard(ricetta));
            });
            // Aggiunge tutte le card al DOM in una sola operazione
            galleryElement.appendChild(fragment);
        }
    });
}


// --- Funzione per creare l'elemento HTML di una singola card ---
// Questa è la funzione standard usata sia da #allRecipesContainer che da #singleSezioneContainer
export function createAndAppendCard(ricetta) {
    const card = createElement('div', 'card'); // Crea il div della card
    const imageFilename = generateImageFilename(ricetta.nome); // Genera nome file immagine
    const imageUrl = `img/${imageFilename}.jpeg`; // Costruisce URL immagine (assume JPEG)

    // Imposta immagine come sfondo CSS (con fallback gestito da CSS)
    card.style.setProperty('--card-bg-image', `url('${imageUrl}')`);
    card.classList.add('card-has-image'); // Aggiunge classe per stile con immagine

    // Wrapper per il contenuto testuale sovrapposto
    const contentWrapper = createElement('div', 'card-content-wrapper');
    const title = createElement('h3', null, ricetta.nome); // Titolo
    const description = createElement('p', null, ricetta.descrizione || ''); // Descrizione (o stringa vuota)
    const categoryTag = createElement('span', 'category-tag', ricetta.categoria); // Tag categoria

    // Aggiunge titolo, descrizione e tag al wrapper
    contentWrapper.appendChild(title);
    contentWrapper.appendChild(description);
    contentWrapper.appendChild(categoryTag);
    // Aggiunge il wrapper alla card
    card.appendChild(contentWrapper);

    // Aggiunge l'event listener per aprire il modal al click sulla card
    card.addEventListener('click', () => {
        // Recupera gli elementi modali necessari nel momento del click
        const modal = document.getElementById('recipeModal');
        const modalContent = document.getElementById('modalContent');
        const bodyElement = document.body;

        // Verifica che gli elementi esistano prima di chiamare openModal
        if (!modal || !modalContent || !bodyElement) {
            console.error("Errore: Impossibile trovare gli elementi del modal nel DOM.");
            return;
        }

        // Chiama la funzione per aprire il modal, passando la ricetta e gli elementi DOM
        openModal(ricetta, modal, modalContent, bodyElement);
    });

    // Ritorna l'elemento card completo
    return card;
}


// --- Funzione per renderizzare le categorie nella sidebar ---
export function renderCategories(categoryListElement, searchInput, filterCallback, setActiveCategoryCallback) {
    // Verifica elementi e dati necessari
    if (!categoryListElement || !ricettarioData?.categorie) {
        console.error("renderCategories: Elemento lista categorie o dati mancanti.");
        return;
    }
    if (typeof filterCallback !== 'function' || typeof setActiveCategoryCallback !== 'function') {
         console.error("renderCategories: Callback mancanti.");
        return;
    }

    const fragment = document.createDocumentFragment(); // Per efficienza

    // --- Elemento "Mostra tutte" ---
    const showAllLi = createElement('li', null, 'Mostra tutte');
    showAllLi.dataset.categoryTarget = 'all'; // Identificatore per la logica di click
    showAllLi.setAttribute('role', 'button');
    showAllLi.tabIndex = 0; // Rende focusabile
    // Listener per click e tastiera (Enter/Space)
    const handleShowAllClick = (e) => {
        setActiveCategoryCallback(e.currentTarget); // Aggiorna UI sidebar
        if (searchInput) searchInput.value = ''; // Pulisce ricerca
        filterCallback(''); // Chiama la callback per mostrare tutto (filtro vuoto)
    };
    showAllLi.addEventListener('click', handleShowAllClick);
    showAllLi.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') handleShowAllClick(e); });
    fragment.appendChild(showAllLi);

    // --- Elementi Categorie Specifiche ---
    ricettarioData.categorie.forEach(categoria => {
        // Salta categorie non valide
        if (!categoria || !categoria.nome || !categoria.id) {
             console.warn("renderCategories: Saltata categoria non valida", categoria);
            return;
        }

        const li = createElement('li', null, categoria.nome);
        li.dataset.categoryId = categoria.id; // ID univoco della categoria/sezione
        li.dataset.categoryName = categoria.nome; // Nome (utile per vecchi filtri)
        li.dataset.categoryTarget = 'specific'; // Identificatore per logica click
        li.setAttribute('role', 'button');
        li.tabIndex = 0;

        // Listener per click e tastiera (Enter/Space)
        const handleSpecificCategoryClick = (e) => {
            setActiveCategoryCallback(e.currentTarget); // Aggiorna UI sidebar
            // Qui la logica è gestita da handleCategoryClick in main.js
            // Non chiamiamo direttamente filterCallback qui per centralizzare la logica
        };
         // Nota: Il listener effettivo che chiama showSingleSection/showAllRecipes
         // viene aggiunto in main.js dopo che questi elementi sono nel DOM.
         // Qui potremmo aggiungere solo logica base o nessuna.
         // Per ora, lo lasciamo vuoto, la logica complessa è in main.js

        fragment.appendChild(li);
    });

    // Appende tutti gli elementi creati alla lista nel DOM
    categoryListElement.innerHTML = ''; // Svuota prima
    categoryListElement.appendChild(fragment);
}
