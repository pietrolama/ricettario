// sezioni.js
// Importa la funzione per creare le card standard e ricettarioData
import { ricettarioData, createAndAppendCard } from './ricettario.js';
// Importa openModal se non è già globale o importato altrove dove serve
// import { openModal } from './modal.js';

let sezioniData = [];

// Setter per aggiornare i dati delle sezioni da sezioni.json
export function setSezioniData(data) {
  sezioniData = data;
}

// Funzione semplificata per mostrare/nascondere testo o ricette
function setSectionView(cardElement, modeToShow) {
    const testoContainer = cardElement.querySelector(".sezione-testo");
    const ricetteContainer = cardElement.querySelector(".sezione-ricette");
    const btnTesto = cardElement.querySelector('.sezione-toggle-btn[data-mode="testo"]');
    const btnRicette = cardElement.querySelector('.sezione-toggle-btn[data-mode="ricette"]');

    if (testoContainer) {
        testoContainer.style.display = (modeToShow === 'testo') ? 'block' : 'none';
    }
    if (ricetteContainer) {
        // Le ricette usano 'grid' quando visibili
        ricetteContainer.style.display = (modeToShow === 'ricette') ? 'grid' : 'none';
    }

    // Aggiorna stato bottoni
    if (btnTesto) btnTesto.classList.toggle('active', modeToShow === 'testo');
    if (btnRicette) btnRicette.classList.toggle('active', modeToShow === 'ricette');
}

// Funzione principale per renderizzare una singola sezione
export function renderSingleSezione(sectionId) {
    const container = document.getElementById('singleSezioneContainer');
    container.innerHTML = ''; // Svuota il contenitore

    // Trova i dati della sezione e della categoria corrispondente
    const foundSezione = sezioniData.find(s => s.id.toLowerCase().trim() === sectionId.toLowerCase().trim());
    const foundCategory = ricettarioData?.categorie.find(cat => cat.id.toLowerCase().trim() === sectionId.toLowerCase().trim());

    // Se non troviamo né dati sezione né categoria, mostra messaggio e esci
    if (!foundSezione && !foundCategory) {
        container.innerHTML = "<p>Dati della sezione non trovati.</p>";
        console.error(`Dati non trovati per sectionId: ${sectionId}`);
        return;
    }

    // Crea la card contenitore principale per la sezione
    const card = document.createElement('div');
    card.className = 'sezione-card'; // Classe per lo stile generale

    // Titolo della sezione (da sezioni.json o nome categoria)
    const title = document.createElement('h2');
    title.className = 'sezione-title';
    title.textContent = foundSezione?.titolo || foundCategory?.nome || "Dettagli Sezione";
    card.appendChild(title);

    // --- Controlli Testo/Ricette (Senza "Entrambi") ---
    const controls = document.createElement('div');
    controls.className = 'sezione-controls';

    // Bottone Testo
    const btnTesto = document.createElement('button');
    btnTesto.className = 'sezione-toggle-btn'; // Classe per stile e identificazione
    btnTesto.textContent = "Descrizione"; // Testo più descrittivo?
    btnTesto.dataset.mode = 'testo'; // Identifica la modalità target
    btnTesto.addEventListener('click', () => setSectionView(card, 'testo'));
    controls.appendChild(btnTesto);

    // Bottone Ricette
    const btnRicette = document.createElement('button');
    btnRicette.className = 'sezione-toggle-btn';
    btnRicette.textContent = "Ricette";
    btnRicette.dataset.mode = 'ricette';
    btnRicette.addEventListener('click', () => setSectionView(card, 'ricette'));
    controls.appendChild(btnRicette);

    card.appendChild(controls);

    // --- Wrapper per Contenuto (Testo e Ricette) ---
    const wrapper = document.createElement('div');
    wrapper.className = 'sezione-content-wrapper';

    // --- Testo Introduttivo ---
    const testoDiv = document.createElement('div');
    testoDiv.className = 'sezione-testo'; // Classe per mostrare/nascondere
    if (foundSezione?.introduzione) {
        const testo = document.createElement('p');
        testo.textContent = foundSezione.introduzione;
        testoDiv.appendChild(testo);
    } else {
        // Se non c'è introduzione da sezioni.json, non mostrare nulla o un placeholder
         testoDiv.innerHTML = "<p><em>Nessuna descrizione disponibile per questa sezione.</em></p>";
    }
    wrapper.appendChild(testoDiv);

    // --- Contenitore Ricette (Griglia con Card Standard) ---
    const ricetteDiv = document.createElement('div');
    // Applica le classi necessarie: una per la logica mostra/nascondi,
    // e una per lo stile a griglia. Potrebbero essere la stessa classe.
    ricetteDiv.className = 'sezione-ricette section-recipe-grid'; // Aggiunta 'section-recipe-grid' per stile

    if (foundCategory && Array.isArray(foundCategory.ricette) && foundCategory.ricette.length > 0) {
        const fragment = document.createDocumentFragment();
        foundCategory.ricette.forEach(ricetta => {
            // Crea la card standard usando la funzione importata
            // Assicurati che l'oggetto ricetta abbia la proprietà 'categoria'
            const ricettaCompleta = { ...ricetta, categoria: foundCategory.nome };
            const ricettaCardElement = createAndAppendCard(ricettaCompleta); // Usa la funzione standard
            // La card creata da createAndAppendCard ha GIA' il listener per openModal
            fragment.appendChild(ricettaCardElement);
        });
        ricetteDiv.appendChild(fragment);
    } else {
        ricetteDiv.innerHTML = "<p>Nessuna ricetta disponibile per questa sezione.</p>";
    }
    wrapper.appendChild(ricetteDiv);

    // Aggiungi il wrapper alla card principale
    card.appendChild(wrapper);
    // Aggiungi la card completa al container della pagina
    container.appendChild(card);

    // Imposta la vista iniziale (es. Testo) e attiva il bottone corrispondente
    setSectionView(card, 'testo');

} // Fine renderSingleSezione
