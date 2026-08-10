module.exports = {
    requestUrl: async () => ({ json: {} }),
    Notice: class Notice { constructor(msg) {} hide() {} setMessage(msg) {} },
    TFolder: class TFolder { isRoot() { return false; } },
    TFile: class TFile {},
    getIcon: (id) => null,
    getIconIds: () => ['lucide-calendar', 'lucide-compass', 'lucide-sparkles', 'lucide-heart', 'lucide-scale', 'lucide-repeat', 'lucide-trending-up', 'lucide-calendar-check', 'lucide-sun-moon', 'lucide-leaf', 'lucide-wind']
};
