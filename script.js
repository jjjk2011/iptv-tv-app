class IPTVApp {
    constructor() {
        this.channels = [];
        this.currentChannel = null;
        this.player = null;
        this.playlistUrl = localStorage.getItem('playlistUrl') || '';
        this.epgUrl = localStorage.getItem('epgUrl') || '';
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSavedPlaylist();
    }
    
    cacheElements() {
        this.channelListEl = document.getElementById('channelList');
        this.playerContainer = document.getElementById('playerContainer');
        this.currentChannelNameEl = document.getElementById('currentChannelName');
        this.currentChannelGroupEl = document.getElementById('currentChannelGroup');
        this.channelInfoEl = document.getElementById('channelInfo');
        this.searchInput = document.getElementById('searchInput');
        this.settingsModal = document.getElementById('settingsModal');
        this.playlistUrlInput = document.getElementById('playlistUrl');
        this.epgUrlInput = document.getElementById('epgUrl');
        
        // Buttons
        this.settingsBtn = document.getElementById('settingsBtn');
        this.loadPlaylistBtn = document.getElementById('loadPlaylistBtn');
        this.refreshPlaylistBtn = document.getElementById('refreshPlaylistBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.closeModalBtns = document.querySelectorAll('.close-btn');
    }
    
    bindEvents() {
        this.settingsBtn?.addEventListener('click', () => this.showSettings());
        this.loadPlaylistBtn?.addEventListener('click', () => this.showSettings());
        this.refreshPlaylistBtn?.addEventListener('click', () => this.loadPlaylist());
        this.saveSettingsBtn?.addEventListener('click', () => this.saveSettings());
        this.searchInput?.addEventListener('input', (e) => this.filterChannels(e.target.value));
        
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.hideSettings());
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.hideSettings();
            }
        });
    }
    
    showSettings() {
        this.playlistUrlInput.value = this.playlistUrl;
        this.epgUrlInput.value = this.epgUrl;
        this.settingsModal.classList.remove('hidden');
    }
    
    hideSettings() {
        this.settingsModal.classList.add('hidden');
    }
    
    saveSettings() {
        this.playlistUrl = this.playlistUrlInput.value;
        this.epgUrl = this.epgUrlInput.value;
        
        localStorage.setItem('playlistUrl', this.playlistUrl);
        localStorage.setItem('epgUrl', this.epgUrl);
        
        this.hideSettings();
        
        if (this.playlistUrl) {
            this.loadPlaylist();
        }
    }
    
    loadSavedPlaylist() {
        if (this.playlistUrl) {
            this.loadPlaylist();
        }
    }
    
    async loadPlaylist() {
        if (!this.playlistUrl) {
            this.showError('Por favor, configure uma URL de playlist M3U nas configurações');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch(this.playlistUrl);
            const m3uContent = await response.text();
            this.parseM3U(m3uContent);
            
            if (this.epgUrl) {
                await this.loadEPG();
            }
        } catch (error) {
            console.error('Erro ao carregar playlist:', error);
            this.showError('Erro ao carregar playlist. Verifique a URL e tente novamente.');
        }
    }
    
    parseM3U(content) {
        const lines = content.split('\n');
        const channels = [];
        let currentChannel = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                // Parse channel info
                const match = line.match(/#EXTINF:-?\d+(?: tvg-id="([^"]*)")?(?: tvg-name="([^"]*)")?(?: tvg-logo="([^"]*)")?(?: group-title="([^"]*)")?,(.*)/);
                
                if (match) {
                    currentChannel = {
                        id: match[1] || `channel_${i}`,
                        name: match[5] || 'Unknown Channel',
                        logo: match[3] || '',
                        group: match[4] || 'General',
                        url: ''
                    };
                }
            } else if (line && !line.startsWith('#') && currentChannel) {
                // This is the stream URL
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = null;
            }
        }
        
        this.channels = channels;
        this.renderChannelList();
        
        if (channels.length === 0) {
            this.showError('Nenhum canal encontrado na playlist');
        } else {
            console.log(`Carregados ${channels.length} canais`);
        }
    }
    
    async loadEPG() {
        try {
            const response = await fetch(this.epgUrl);
            const xmlContent = await response.text();
            this.parseEPG(xmlContent);
        } catch (error) {
            console.error('Erro ao carregar EPG:', error);
        }
    }
    
    parseEPG(xmlContent) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        const programmes = xmlDoc.getElementsByTagName('programme');
        
        // Store EPG data for later use
        this.epgData = {};
        
        for (let programme of programmes) {
            const channel = programme.getAttribute('channel');
            const start = programme.getAttribute('start');
            const stop = programme.getAttribute('stop');
            const title = programme.getElementsByTagName('title')[0]?.textContent;
            
            if (!this.epgData[channel]) {
                this.epgData[channel] = [];
            }
            
            this.epgData[channel].push({ start, stop, title });
        }
    }
    
    renderChannelList(filterText = '') {
        if (!this.channelListEl) return;
        
        const filteredChannels = filterText
            ? this.channels.filter(ch => 
                ch.name.toLowerCase().includes(filterText.toLowerCase()) ||
                ch.group.toLowerCase().includes(filterText.toLowerCase())
              )
            : this.channels;
        
        // Group channels by category
        const grouped = {};
        filteredChannels.forEach(channel => {
            if (!grouped[channel.group]) {
                grouped[channel.group] = [];
            }
            grouped[channel.group].push(channel);
        });
        
        let html = '';
        
        for (const [group, channels] of Object.entries(grouped)) {
            html += `
                <div class="channel-group-header">
                    <h3>${group}</h3>
                </div>
            `;
            
            channels.forEach(channel => {
                const isActive = this.currentChannel?.url === channel.url;
                html += `
                    <div class="channel-item ${isActive ? 'active' : ''}" data-url="${channel.url}" data-name="${channel.name}" data-group="${channel.group}">
                        <div>
                            <div class="channel-name">${this.escapeHtml(channel.name)}</div>
                            <div class="channel-group">${this.escapeHtml(channel.group)}</div>
                        </div>
                        ${channel.logo ? `<img src="${channel.logo}" class="channel-logo" alt="${channel.name}" style="width: 30px; height: 30px; object-fit: contain;">` : ''}
                    </div>
                `;
            });
        }
        
        this.channelListEl.innerHTML = html;
        
        // Add click handlers
        document.querySelectorAll('.channel-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                const name = item.dataset.name;
                const group = item.dataset.group;
                this.playChannel(url, name, group);
            });
        });
    }
    
    filterChannels(searchText) {
        this.renderChannelList(searchText);
    }
    
    playChannel(url, name, group) {
        if (!url) {
            this.showError('URL do canal inválida');
            return;
        }
        
        this.currentChannel = { url, name, group };
        
        // Update UI
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.url === url) {
                item.classList.add('active');
            }
        });
        
        this.currentChannelNameEl.textContent = name;
        this.currentChannelGroupEl.textContent = group;
        this.channelInfoEl.classList.remove('hidden');
        
        // Create or update video player
        this.playerContainer.innerHTML = `
            <video id="videoPlayer" controls autoplay style="width: 100%; height: 100%; object-fit: contain;">
                <source src="${url}" type="application/x-mpegURL">
                Seu navegador não suporta vídeo HTML5.
            </video>
        `;
        
        const videoPlayer = document.getElementById('videoPlayer');
        
        // Handle different stream types
        if (url.includes('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoPlayer);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoPlayer.play();
                });
            } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                videoPlayer.src = url;
                videoPlayer.addEventListener('loadedmetadata', () => {
                    videoPlayer.play();
                });
            }
        } else {
            videoPlayer.src = url;
            videoPlayer.play();
        }
        
        // Handle errors
        videoPlayer.addEventListener('error', (e) => {
            console.error('Erro no player:', e);
            this.showError('Erro ao reproduzir o canal. O stream pode estar offline.');
        });
    }
    
    showLoading() {
        this.channelListEl.innerHTML = '<div class="loading">Carregando canais...</div>';
    }
    
    showError(message) {
        this.channelListEl.innerHTML = `<div class="error">${message}</div>`;
        setTimeout(() => {
            if (this.channels.length > 0) {
                this.renderChannelList();
            }
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
const app = new IPTVApp();

// Load HLS.js for m3u8 support
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
document.head.appendChild(script);
