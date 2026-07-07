function chargerVisiteurs() {
    const visiteursPresents = DB.get('visiteursPresents');
    const admin = isAdmin();
    document.getElementById('nbVisiteurs').textContent = visiteursPresents.length;
    
    document.getElementById('listeVisiteursPresents').innerHTML = visiteursPresents.length === 0
        ? '<p style="color:#999;text-align:center;padding:20px;">Aucun visiteur présent</p>'
        : visiteursPresents.map(v => `
            <div class="personne-card">
                <h4>🚶 ${v.nom}</h4>
                <p><strong>CIN:</strong> ${v.cin}</p>
                <p><strong>Tél:</strong> ${v.tel || '-'}</p>
                <p><strong>Entreprise:</strong> ${v.entreprise || '-'}</p>
                <p><strong>Motif:</strong> ${v.motif}</p>
                <p><strong>Visite:</strong> ${v.personneVisitee}</p>
                <p><strong>Badge N°:</strong> ${v.badge || '-'}</p>
                <p><strong>Entrée:</strong> ${new Date(v.heureEntree).toLocaleString('fr-FR')}</p>
                <div class="card-actions">
                    <button class="btn-warning" onclick="reimprimerBadge(${v.id})" title="Réimprimer badge">🖨️</button>
                    <button class="btn-danger" onclick="sortieVisiteur(${v.id})">🚪 Sortie</button>
                    ${admin ? `
                        <button class="btn-secondary" onclick="modifierVisiteur(${v.id})" title="Modifier">✏️</button>
                        <button class="btn-danger" onclick="supprimerVisiteur(${v.id})" title="Supprimer">🗑️</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
}

function getVisiteurDataFromForm() {
    return {
        nom: document.getElementById('nomVisiteur').value,
        cin: document.getElementById('cinVisiteur').value,
        tel: document.getElementById('telVisiteur').value,
        entreprise: document.getElementById('entrepriseVisiteur').value,
        motif: document.getElementById('motifVisite').value,
        personneVisitee: document.getElementById('personneVisitee').value,
        serviceVisite: document.getElementById('serviceVisite').value,
        badge: document.getElementById('badgeVisiteur').value || `V${Date.now().toString().slice(-4)}`,
        heureEntree: new Date().toISOString(),
        enregistrePar: getCurrentUser().nomComplet
    };
}

// Enregistrement autorisé pour tous
function enregistrerVisiteur(imprimer = true) {
    const visiteur = getVisiteurDataFromForm();
    
    DB.add('visiteurs', visiteur);
    const visiteursPresents = DB.get('visiteursPresents');
    visiteursPresents.push(visiteur);
    DB.set('visiteursPresents', visiteursPresents);
    
    DB.logHistorique({
        type: 'visiteur',
        nom: visiteur.nom,
        details: `CIN: ${visiteur.cin} | ${visiteur.motif} | Visite: ${visiteur.personneVisitee}`,
        action: 'entree'
    });
    
    if (imprimer) {
        const params = new URLSearchParams(visiteur).toString();
        window.open('badge.html?' + params, '_blank', 'width=400,height=700');
    }
    
    document.getElementById('formVisiteur').reset();
    chargerVisiteurs();
    alert('✅ Visiteur enregistré !');
}

document.getElementById('formVisiteur').addEventListener('submit', (e) => {
    e.preventDefault();
    enregistrerVisiteur(true);
});

function enregistrerSansBadge() {
    const form = document.getElementById('formVisiteur');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    enregistrerVisiteur(false);
}

// Sortie autorisée pour tous
function sortieVisiteur(id) {
    let visiteursPresents = DB.get('visiteursPresents');
    const visiteur = visiteursPresents.find(v => v.id === id);
    if (!visiteur) return;
    if (!confirm(`Sortie de ${visiteur.nom} ?`)) return;
    
    visiteursPresents = visiteursPresents.filter(v => v.id !== id);
    DB.set('visiteursPresents', visiteursPresents);
    
    DB.logHistorique({
        type: 'visiteur',
        nom: visiteur.nom,
        details: `CIN: ${visiteur.cin} | Badge: ${visiteur.badge}`,
        action: 'sortie'
    });
    
    chargerVisiteurs();
    alert('✅ Sortie enregistrée');
}

function reimprimerBadge(id) {
    const v = DB.get('visiteursPresents').find(x => x.id === id);
    if (!v) return;
    const params = new URLSearchParams(v).toString();
    window.open('badge.html?' + params, '_blank', 'width=400,height=700');
}

// 🔒 MODIFICATION - ADMIN UNIQUEMENT
function modifierVisiteur(id) {
    if (!checkPermission('modifier un visiteur')) return;
    
    let visiteursPresents = DB.get('visiteursPresents');
    const visiteur = visiteursPresents.find(v => v.id === id);
    if (!visiteur) return;
    
    const nouveauMotif = prompt('Nouveau motif :', visiteur.motif);
    if (!nouveauMotif) return;
    
    const nouvellePersonne = prompt('Personne à visiter :', visiteur.personneVisitee);
    if (!nouvellePersonne) return;
    
    visiteursPresents = visiteursPresents.map(v => 
        v.id === id 
            ? { ...v, motif: nouveauMotif, personneVisitee: nouvellePersonne, modifiePar: getCurrentUser().nomComplet }
            : v
    );
    DB.set('visiteursPresents', visiteursPresents);
    
    DB.logHistorique({
        type: 'action',
        nom: visiteur.nom,
        details: `Modification visiteur: ${visiteur.cin}`,
        action: 'modification'
    });
    
    chargerVisiteurs();
    alert('✅ Visiteur modifié');
}

// 🔒 SUPPRESSION - ADMIN UNIQUEMENT
function supprimerVisiteur(id) {
    if (!checkPermission('supprimer un visiteur')) return;
    
    let visiteursPresents = DB.get('visiteursPresents');
    const visiteur = visiteursPresents.find(v => v.id === id);
    if (!visiteur) return;
    
    if (!confirm(`⚠️ Supprimer définitivement le visiteur ${visiteur.nom} ?\n\nCette action est irréversible.`)) return;
    
    visiteursPresents = visiteursPresents.filter(v => v.id !== id);
    DB.set('visiteursPresents', visiteursPresents);
    
    DB.logHistorique({
        type: 'action',
        nom: visiteur.nom,
        details: `Suppression visiteur: ${visiteur.cin}`,
        action: 'suppression'
    });
    
    chargerVisiteurs();
    alert('✅ Visiteur supprimé');
}

chargerVisiteurs();