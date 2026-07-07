function chargerStats() {
    const employes = DB.get('employes');
    const presents = DB.get('presents');
    const visiteursPresents = DB.get('visiteursPresents');
    const historique = DB.get('historique');
    const aujourdhui = new Date().toISOString().split('T')[0];
    
    document.getElementById('totalEmp').textContent = employes.length;
    document.getElementById('totalPresents').textContent = presents.length;
    document.getElementById('visiteursJour').textContent = 
        historique.filter(h => h.type === 'visiteur' && h.action === 'entree' && h.date.startsWith(aujourdhui)).length;
    document.getElementById('mouvementsJour').textContent = 
        historique.filter(h => (h.type === 'personnel' || h.type === 'visiteur') && h.date.startsWith(aujourdhui)).length;
    
    // Chart 7 jours
    const labels7 = [], dataPersonnel = [], dataVisiteurs = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        labels7.push(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
        dataPersonnel.push(historique.filter(h => h.type === 'personnel' && h.date.startsWith(ds)).length);
        dataVisiteurs.push(historique.filter(h => h.type === 'visiteur' && h.date.startsWith(ds)).length);
    }
    
    new Chart(document.getElementById('chart7jours'), {
        type: 'bar',
        data: {
            labels: labels7,
            datasets: [
                { label: 'Personnel', data: dataPersonnel, backgroundColor: '#667eea' },
                { label: 'Visiteurs', data: dataVisiteurs, backgroundColor: '#10b981' }
            ]
        },
        options: { responsive: true }
    });
    
    // Répartition
    const nbPersonnel = historique.filter(h => h.type === 'personnel').length;
    const nbVisit = historique.filter(h => h.type === 'visiteur').length;
    new Chart(document.getElementById('chartRepartition'), {
        type: 'doughnut',
        data: {
            labels: ['Personnel', 'Visiteurs'],
            datasets: [{
                data: [nbPersonnel, nbVisit],
                backgroundColor: ['#667eea', '#10b981']
            }]
        },
        options: { responsive: true }
    });
    
    // Services
    const services = {};
    employes.forEach(e => { services[e.service] = (services[e.service] || 0) + 1; });
    new Chart(document.getElementById('chartServices'), {
        type: 'bar',
        data: {
            labels: Object.keys(services),
            datasets: [{ label: 'Nombre d\'employés', data: Object.values(services), backgroundColor: '#764ba2' }]
        },
        options: { responsive: true, indexAxis: 'y' }
    });
    
    // Heures
    const heures = Array(24).fill(0);
    historique.filter(h => h.date.startsWith(aujourdhui)).forEach(h => {
        const heure = new Date(h.date).getHours();
        heures[heure]++;
    });
    new Chart(document.getElementById('chartHeures'), {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}h`),
            datasets: [{
                label: 'Mouvements',
                data: heures,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true }
    });
}

chargerStats();