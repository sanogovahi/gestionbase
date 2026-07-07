function chargerEmployes() {
    const employes = DB.get('employes');
    const presents = DB.get('presents');
    const search = (document.getElementById('searchEmp')?.value || '').toLowerCase();
    const admin = isAdmin();
    
    // Select
    const select = document.getElementById('selectEmploye');
    select.innerHTML = '<option value="">-- Sélectionner un employé --</option>' +
        employes.map(e => `<option value="${e.id}">${e.nom} (${e.matricule}) - ${e.service}</option>`).join('');
    
    // Table
    const filtered = employes.filter(e => 
        e.nom.toLowerCase().includes(search) ||
        e.matricule.toLowerCase().includes(search) ||
        e.service.toLowerCase().includes(search)
    );
    
    document.getElementById('listeEmployes').innerHTML = filtered.length === 0
        ? '<tr><td colspan="6" style="text-align:center;color:#999;">Aucun employé</td></tr>'
        : filtered.map(e => {
            const present = presents.find(p => p.id === e.id);
            return `
                <tr>
                    <td>${e.matricule}</td>
                    <td>${e.nom}</td>
                    <td>${e.service}</td>
                    <td>${e.poste || '-'}</td>
                    <td>${present ? '<span class="status-actif">✅ Présent</span>' : '<span class="status-inactif">🚪 Absent</span>'}</td>
                    <td>
                        ${admin ? `
                            <div class="btn-group">
                                <button class="btn-warning btn-icon" onclick="modifierEmploye(${e.id})" title="Modifier">✏️</button>
                                <button class="btn-danger btn-icon" onclick="supprimerEmploye(${e.id})" title="Supprimer">🗑️</button>
                            </div>
                        ` : '<span style="color:#999;font-size:0.85em;">🔒 Admin uniquement</span>'}
                    </td>
                </tr>
            `;
        }).join('');
    
    // Présents
    document.getElementById('listePresents').innerHTML = presents.length === 0
        ? '<p style="color:#999;text-align:center;padding:20px;">Aucun employé présent</p>'
        : presents.map(p => `
            <div class="personne-card">
                <h4>👤 ${p.nom}</h4>
                <p><strong>Matricule:</strong> ${p.matricule}</p>
                <p><strong>Service:</strong> ${p.service}</p>
                <p><strong>Entrée:</strong> ${new Date(p.heureEntree).toLocaleString('fr-FR')}</p>
                <div class="card-actions">
                    <button class="btn-danger" onclick="sortieDirecte(${p.id})">🚪 Sortie</button>
                </div>
            </div>
        `).join('');
}

// Ajout d'employé (autorisé pour tous)
document.getElementById('formPersonnel').addEventListener('submit', (e) => {
    e.preventDefault();
    const nouveauEmp = {
        nom: document.getElementById('nomEmploye').value,
        matricule: document.getElementById('matricule').value,
        service: document.getElementById('service').value,
        poste: document.getElementById('poste').value,
        telephone: document.getElementById('telephone').value,
        email: document.getElementById('email').value,
        dateAjout: new Date().toISOString(),
        ajoutePar: getCurrentUser().nomComplet
    };
    
    const employes = DB.get('employes');
    if (employes.some(emp => emp.matricule === nouveauEmp.matricule)) {
        alert('❌ Ce matricule existe déjà !');
        return;
    }
    
    DB.add('employes', nouveauEmp);
    DB.logHistorique({
        type: 'action',
        nom: nouveauEmp.nom,
        details: `Ajout employé: ${nouveauEmp.matricule}`,
        action: 'ajout'
    });
    
    e.target.reset();
    chargerEmployes();
    alert('✅ Employé ajouté !');
});

// Pointage (autorisé pour tous)
function pointerPersonnel(action) {
    const id = parseInt(document.getElementById('selectEmploye').value);
    if (!id) { alert('Veuillez sélectionner un employé'); return; }
    
    const employe = DB.get('employes').find(e => e.id === id);
    let presents = DB.get('presents');
    const dejaPresent = presents.find(p => p.id === id);
    
    if (action === 'entree') {
        if (dejaPresent) { alert('❌ Déjà présent !'); return; }
        presents.push({ ...employe, heureEntree: new Date().toISOString() });
    } else {
        if (!dejaPresent) { alert('❌ Pas présent !'); return; }
        presents = presents.filter(p => p.id !== id);
    }
    
    DB.set('presents', presents);
    DB.logHistorique({
        type: 'personnel',
        nom: employe.nom,
        details: `${employe.matricule} - ${employe.service}`,
        action: action
    });
    
    chargerEmployes();
    alert(`✅ ${action === 'entree' ? 'Entrée' : 'Sortie'} enregistrée pour ${employe.nom}`);
}

function sortieDirecte(id) {
    document.getElementById('selectEmploye').value = id;
    pointerPersonnel('sortie');
}

// 🔒 MODIFICATION - ADMIN UNIQUEMENT
function modifierEmploye(id) {
    if (!checkPermission('modifier un employé')) return;
    
    const employe = DB.get('employes').find(e => e.id === id);
    if (!employe) return;
    
    const nouveauNom = prompt('Nouveau nom :', employe.nom);
    if (!nouveauNom) return;
    
    const nouveauService = prompt('Nouveau service :', employe.service);
    if (!nouveauService) return;
    
    const nouveauPoste = prompt('Nouveau poste :', employe.poste || '');
    
    DB.update('employes', id, {
        nom: nouveauNom,
        service: nouveauService,
        poste: nouveauPoste,
        modifiePar: getCurrentUser().nomComplet,
        dateModification: new Date().toISOString()
    });
    
    DB.logHistorique({
        type: 'action',
        nom: nouveauNom,
        details: `Modification employé: ${employe.matricule}`,
        action: 'modification'
    });
    
    chargerEmployes();
    alert('✅ Employé modifié');
}

// 🔒 SUPPRESSION - ADMIN UNIQUEMENT
function supprimerEmploye(id) {
    if (!checkPermission('supprimer un employé')) return;
    
    const employe = DB.get('employes').find(e => e.id === id);
    if (!employe) return;
    
    if (!confirm(`⚠️ Voulez-vous vraiment supprimer l'employé ${employe.nom} ?\n\nCette action est irréversible.`)) return;
    
    DB.delete('employes', id);
    let presents = DB.get('presents');
    presents = presents.filter(p => p.id !== id);
    DB.set('presents', presents);
    
    DB.logHistorique({
        type: 'action',
        nom: employe.nom,
        details: `Suppression employé: ${employe.matricule}`,
        action: 'suppression'
    });
    
    chargerEmployes();
    alert('✅ Employé supprimé');
}

document.getElementById('searchEmp').addEventListener('input', chargerEmployes);
chargerEmployes();