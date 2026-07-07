const DB = {
    init() {
        if (!localStorage.getItem('users')) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password: this.hash('admin123'),
                    nomComplet: 'Administrateur',
                    role: 'admin',
                    email: 'admin@entreprise.com',
                    actif: true,
                    dateCreation: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'agent',
                    password: this.hash('agent123'),
                    nomComplet: 'Agent Sécurité',
                    role: 'agent',
                    email: 'agent@entreprise.com',
                    actif: true,
                    dateCreation: new Date().toISOString()
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
        
        if (!localStorage.getItem('employes')) localStorage.setItem('employes', '[]');
        if (!localStorage.getItem('visiteurs')) localStorage.setItem('visiteurs', '[]');
        if (!localStorage.getItem('historique')) localStorage.setItem('historique', '[]');
        if (!localStorage.getItem('presents')) localStorage.setItem('presents', '[]');
        if (!localStorage.getItem('visiteursPresents')) localStorage.setItem('visiteursPresents', '[]');
    },
    
    // Simple "hash" (démo). Utilisez bcrypt côté serveur en prod !
    hash(str) {
        return btoa(str + 'salt_key_2024');
    },
    
    get(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    },
    
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    add(key, item) {
        const items = this.get(key);
        item.id = Date.now();
        items.push(item);
        this.set(key, items);
        return item;
    },
    
    update(key, id, updates) {
        const items = this.get(key);
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            this.set(key, items);
            return items[index];
        }
        return null;
    },
    
    delete(key, id) {
        let items = this.get(key);
        items = items.filter(i => i.id !== id);
        this.set(key, items);
    },
    
    logHistorique(entry) {
        const historique = this.get('historique');
        const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        entry.id = Date.now();
        entry.date = new Date().toISOString();
        entry.agent = user.nomComplet || 'Système';
        historique.push(entry);
        this.set('historique', historique);
    }
};

DB.init();