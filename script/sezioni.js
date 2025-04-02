// sezioni.js
import { ricettarioData } from './ricettario.js';

let sezioniData = [];

// Setter per aggiornare i dati delle sezioni
export function setSezioniData(data) {
  sezioniData = data;
}

export function renderSingleSezione(sectionId) {
  const container = document.getElementById('singleSezioneContainer');
  container.innerHTML = ''; // Svuota
  
  const foundSezione = sezioniData.find(s => s.id.toLowerCase().trim() === sectionId.toLowerCase().trim());

  
  const foundCategory = ricettarioData?.categorie.find(cat =>
    cat.id.toLowerCase().trim() === sectionId.toLowerCase().trim()
  );


  const card = document.createElement('div');
  card.className = 'sezione-card';

  const title = document.createElement('h2');
  title.className = 'sezione-title';
  title.textContent = foundSezione?.titolo || "Sezione senza titolo";
  card.appendChild(title);

  const controls = document.createElement('div');
  controls.className = 'sezione-controls';
  ["Testo", "Ricette", "Entrambi"].forEach(mode => {
    const btn = document.createElement('button');
    btn.className = 'sezione-toggle-btn';
    btn.textContent = mode;
    btn.addEventListener('click', () => toggleView(card, mode.toLowerCase()));
    controls.appendChild(btn);
  });
  card.appendChild(controls);

  const wrapper = document.createElement('div');
  wrapper.className = 'sezione-wrapper';

  const testoDiv = document.createElement('div');
  testoDiv.className = 'sezione-testo';
  const testo = document.createElement('p');
  testo.textContent = foundSezione?.introduzione || "Nessun testo disponibile.";
  testoDiv.appendChild(testo);

  const ricetteDiv = document.createElement('div');
  ricetteDiv.className = 'sezione-ricette';

  if (foundCategory && Array.isArray(foundCategory.ricette)) {
    foundCategory.ricette.forEach(ricetta => {
      const miniCard = document.createElement('div');
      miniCard.className = 'ricetta-mini-card';
      
      const nome = document.createElement('h4');
      nome.textContent = ricetta.nome;
      miniCard.appendChild(nome);

      if (ricetta.descrizione) {
        const desc = document.createElement('p');
        desc.textContent = ricetta.descrizione;
        miniCard.appendChild(desc);
      }

      ricetteDiv.appendChild(miniCard);
    });
  } else {
    ricetteDiv.innerHTML = "<p>Nessuna ricetta per questa sezione.</p>";
  }

  wrapper.appendChild(testoDiv);
  wrapper.appendChild(ricetteDiv);
  card.appendChild(wrapper);
  container.appendChild(card);

  toggleView(card, "entrambi");
}


// Funzione toggleView (già definita)
export function toggleView(card, mode) {
  const testo = card.querySelector(".sezione-testo");
  const ricette = card.querySelector(".sezione-ricette");

  card.classList.remove("mode-testo", "mode-ricette", "mode-entrambi");
  card.classList.add(`mode-${mode}`);

  if (mode === "testo") {
    testo.style.display = "block";
    ricette.style.display = "none";
  } else if (mode === "ricette") {
    testo.style.display = "none";
    ricette.style.display = "block";
  } else {
    testo.style.display = "block";
    ricette.style.display = "block";
  }
}
