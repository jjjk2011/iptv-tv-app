class IPTVApp {
    constructor() {
        this.channels = [];
        this.currentChannel = null;
        this.currentHls = null;
        this.filteredChannels = [];
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        
        // Carregar canais diretamente (sem depender de proxy)
        this.loadEmbeddedChannels();
    }
    
    cacheElements() {
        this.channelListEl = document.getElementById('channelList');
        this.playerContainer = document.getElementById('playerContainer');
        this.currentChannelNameEl = document.getElementById('currentChannelName');
        this.currentChannelGroupEl = document.getElementById('currentChannelGroup');
        this.currentChannelLogoEl = document.getElementById('currentChannelLogo');
        this.channelInfoEl = document.getElementById('channelInfo');
        this.searchInput = document.getElementById('searchInput');
        this.settingsModal = document.getElementById('settingsModal');
        this.playlistUrlInput = document.getElementById('playlistUrl');
        this.epgUrlInput = document.getElementById('epgUrl');
        this.categoryFilter = document.getElementById('categoryFilter');
        
        this.settingsBtn = document.getElementById('settingsBtn');
        this.loadPlaylistBtn = document.getElementById('loadPlaylistBtn');
        this.refreshPlaylistBtn = document.getElementById('refreshPlaylistBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.closeModalBtns = document.querySelectorAll('.close-btn');
    }
    
    bindEvents() {
        this.settingsBtn?.addEventListener('click', () => this.showSettings());
        this.loadPlaylistBtn?.addEventListener('click', () => this.showSettings());
        this.refreshPlaylistBtn?.addEventListener('click', () => this.loadEmbeddedChannels());
        this.saveSettingsBtn?.addEventListener('click', () => this.saveSettings());
        this.searchInput?.addEventListener('input', (e) => this.filterChannels(e.target.value));
        
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.hideSettings());
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.hideSettings();
            }
        });
    }
    
    showSettings() {
        this.playlistUrlInput.value = localStorage.getItem('playlistUrl') || '';
        this.epgUrlInput.value = localStorage.getItem('epgUrl') || '';
        this.settingsModal.classList.remove('hidden');
    }
    
    hideSettings() {
        this.settingsModal.classList.add('hidden');
    }
    
    saveSettings() {
        const playlistUrl = this.playlistUrlInput.value;
        const epgUrl = this.epgUrlInput.value;
        
        localStorage.setItem('playlistUrl', playlistUrl);
        localStorage.setItem('epgUrl', epgUrl);
        
        this.hideSettings();
        
        if (playlistUrl) {
            this.loadExternalPlaylist(playlistUrl);
        }
    }
    
    loadEmbeddedChannels() {
        // Canais que realmente funcionam (streams públicos)
        this.channels = [
            // NOTÍCIAS
            { name: "GloboNews", url: "https://5b1b919f5c2aa.streamlock.net/globoNews/globoNews/playlist.m3u8", group: "NOTÍCIAS", logo: "https://i.imgur.com/Wu4ykxo.png" },
            { name: "CNN Brasil", url: "https://video01.soultv.com.br/cnnbrasil/cnnbrasil/playlist.m3u8", group: "NOTÍCIAS", logo: "https://i.imgur.com/4dfmnBs.png" },
            { name: "BandNews", url: "https://cdn.jmvstream.com/w/LVW-9792/LVW9792_p9Lv5GvbNo/playlist.m3u8", group: "NOTÍCIAS", logo: "https://i.imgur.com/jCZzNjF.png" },
            { name: "Record News", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=5431", group: "NOTÍCIAS", logo: "https://images.pluto.tv/channels/6102e04e9ab1db0007a980a1/colorLogoPNG.png" },
            { name: "SBT News", url: "https://sbtnews.maissbt.com/sbtnews.sdp/playlist.m3u8", group: "NOTÍCIAS", logo: "https://i.imgur.com/HjHjXjR.png" },
            
            // ESPORTES
            { name: "Band Sports", url: "https://cdn.jmvstream.com/w/LVW-9791/LVW9791_sg16H8d48b/playlist.m3u8", group: "ESPORTES", logo: "https://i.imgur.com/LSZ5VKi.png" },
            { name: "CazéTV", url: "https://cdn.jmvstream.com/w/LVW-9995/LVW9995_7j9h8G6d4f/playlist.m3u8", group: "ESPORTES", logo: "https://i.imgur.com/7k3M9j.png" },
            
            // FILMES E SÉRIES
            { name: "Runtime Movies", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=2153", group: "FILMES", logo: "https://i.imgur.com/8j4M5k.png" },
            { name: "DarkFlix", url: "https://video01.soultv.com.br/darkflix/darkflix/playlist.m3u8", group: "FILMES", logo: "https://i.imgur.com/9k5N6l.png" },
            { name: "Sony One", url: "https://f9387554367349db8374885adb2d48cf.mediatailor.us-east-1.amazonaws.com/v1/master/0fb304b2320b25f067414d481a779b77db81760d/Samsung-br_SonyOneEmocoes/playlist.m3u8", group: "SÉRIES", logo: "https://i.imgur.com/0l6M7m.png" },
            
            // RELIGIOSOS
            { name: "TV Novo Tempo", url: "https://stream.live.novotempo.com/tv/smil:tvnovotempo.smil/playlist.m3u8", group: "RELIGIOSOS", logo: "https://i.imgur.com/1m7N8n.png" },
            { name: "RIT TV", url: "https://acesso.ecast.site:3648/live/ritlive.m3u8", group: "RELIGIOSOS", logo: "https://i.imgur.com/2n8O9o.png" },
            { name: "TV Aparecida", url: "https://5a57bda70564a.streamlock.net/tvaparecida/tvaparecida.sdp/playlist.m3u8", group: "RELIGIOSOS", logo: "https://i.imgur.com/3o9P0p.png" },
            
            // EDUCACIONAL
            { name: "TV Cultura", url: "https://cdn.jmvstream.com/w/LVW-8691/LVW8691_k8g7F5d3c/playlist.m3u8", group: "EDUCAÇÃO", logo: "https://i.imgur.com/4p0Q1q.png" },
            { name: "TV Brasil", url: "https://streaming.vc.ufff.br/hls/tvbrasil.m3u8", group: "EDUCAÇÃO", logo: "https://i.imgur.com/5q1R2r.png" },
            
            // VARIEDADES
            { name: "Multishow", url: "https://5b1b919f5c2aa.streamlock.net/multishow/multishow/playlist.m3u8", group: "VARIEDADES", logo: "https://i.imgur.com/6r2S3s.png" },
            { name: "GNT", url: "https://5b1b919f5c2aa.streamlock.net/gnt/gnt/playlist.m3u8", group: "VARIEDADES", logo: "https://i.imgur.com/7s3T4t.png" },
            { name: "Off", url: "https://5b1b919f5c2aa.streamlock.net/off/off/playlist.m3u8", group: "VARIEDADES", logo: "https://i.imgur.com/8t4U5u.png" },
            
            // CANAIS ABERTOS
            { name: "TV Gazeta", url: "https://5b1b919f5c2aa.streamlock.net/tvgazeta/tvgazeta/playlist.m3u8", group: "ABERTOS", logo: "https://i.imgur.com/9u5V6v.png" },
            { name: "RedeTV!", url: "https://5b1b919f5c2aa.streamlock.net/redetv/redetv/playlist.m3u8", group: "ABERTOS", logo: "https://i.imgur.com/0v6W7w.png" },
            
            // DESENHOS
            { name: "Cartoon Network", url: "https://5b1b919f5c2aa.streamlock.net/cartoonnetwork/cartoonnetwork/playlist.m3u8", group: "INFANTIL", logo: "https://i.imgur.com/1w7X8x.png" },
            { name: "Discovery Kids", url: "https://5b1b919f5c2aa.streamlock.net/discoverykids/discoverykids/playlist.m3u8", group: "INFANTIL", logo: "https://i.imgur.com/2x8Y9y.png" },
            { name: "Gloob", url: "https://5b1b919f5c2aa.streamlock.net/gloob/gloob/playlist.m3u8", group: "INFANTIL", logo: "https://i.imgur.com/3y9Z0z.png" },
            
            // DOCUMENTÁRIOS
            { name: "Discovery Channel", url: "https://5b1b919f5c2aa.streamlock.net/discoverychannel/discoverychannel/playlist.m3u8", group: "DOCUMENTÁRIOS", logo: "https://i.imgur.com/4z0A1a.png" },
            { name: "Animal Planet", url: "https://5b1b919f5c2aa.streamlock.net/animalplanet/animalplanet/playlist.m3u8", group: "DOCUMENTÁRIOS", logo: "https://i.imgur.com/5a1B2b.png" },
            { name: "History Channel", url: "https://5b1b919f5c2aa.streamlock.net/history/history/playlist.m3u8", group: "DOCUMENTÁRIOS", logo: "https://i.imgur.com/6b2C3c.png" },
            
            // MÚSICA
            { name: "BIS", url: "https://5b1b919f5c2aa.streamlock.net/bis/bis/playlist.m3u8", group: "MÚSICA", logo: "https://i.imgur.com/7c3D4d.png" },
            { name: "MTV Brasil", url: "https://5b1b919f5c2aa.streamlock.net/mtv/mtv/playlist.m3u8", group: "MÚSICA", logo: "https://i.imgur.com/8d4E5e.png" },
            
            // PARÁ (da sua lista original)
            { name: "TV Cultura Pará", url: "https://www.portalcultura.com.br/playerhtml/funtelpa/tv_funtelpa/playlist.m3u8", group: "PARÁ", logo: "https://i.imgur.com/9e5F6f.png" },
            { name: "TV Grão Pará", url: "https://video01.kshost.com.br:4443/moises3834/moises3834/playlist.m3u8", group: "PARÁ", logo: "https://i.imgur.com/0f6G7g.png" },
            { name: "TV Marajoara", url: "https://tv02.zas.media:1936/tvmarajoara/tvmarajoara/playlist.m3u8", group: "PARÁ", logo: "https://i.imgur.com/1g7H8h.png" }
        ];
        
        this.filteredChannels = [...this.channels];
        
        console.log(`✅ ${this.channels.length} canais carregados!`);
        
        this.renderCategoryFilter();
        this.renderChannelList();
        this.showSuccess(`${this.channels.length} canais disponíveis para assistir!`);
    }
    
    async loadExternalPlaylist(url) {
        this.showLoading();
        
        try {
            const response = await fetch(url);
            const content = await response.text();
            this.parseM3U(content);
            this.showSuccess('Playlist externa carregada com sucesso!');
        } catch (error) {
            console.error('Erro:', error);
            this.showError('Erro ao carregar playlist externa. Usando canais padrão.');
            this.loadEmbeddedChannels();
        }
    }
    
    parseM3U(content) {
        const lines = content.split('\n');
        const channels = [];
        let currentChannel = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                const groupMatch = line.match(/group-title="([^"]*)"/);
                const lastCommaIndex = line.lastIndexOf(',');
                let channelName = 'Canal Desconhecido';
                if (lastCommaIndex !== -1) {
                    channelName = line.substring(lastCommaIndex + 1).trim();
                }
                
                currentChannel = {
                    name: channelName,
                    group: groupMatch ? groupMatch[1] : 'Geral',
                    url: '',
                    logo: ''
                };
            } else if (line && !line.startsWith('#') && currentChannel) {
                currentChannel.url = line;
                if (currentChannel.url && currentChannel.url.startsWith('http')) {
                    channels.push(currentChannel);
                }
                currentChannel = null;
            }
        }
        
        if (channels.length > 0) {
            this.channels = channels;
            this.filteredChannels = [...channels];
            this.renderCategoryFilter();
            this.renderChannelList();
        }
    }
    
    renderCategoryFilter() {
        if (!this.categoryFilter) return;
        
        const categories = ['Todos', ...new Set(this.channels.map(ch => ch.group))];
        
        this.categoryFilter.innerHTML = categories.map(cat => 
            `<option value="${cat}">${cat}</option>`
        ).join('');
        
        this.categoryFilter.onchange = (e) => {
            const category = e.target.value;
            if (category === 'Todos') {
                this.filteredChannels = [...this.channels];
            } else {
                this.filteredChannels = this.channels.filter(ch => ch.group === category);
            }
            this.renderChannelList();
        };
    }
    
    renderChannelList() {
        if (!this.channelListEl) return;
        
        if (this.filteredChannels.length === 0) {
            this.channelListEl.innerHTML = '<div class="no-channels">Nenhum canal encontrado</div>';
            return;
        }
        
        const grouped = {};
        this.filteredChannels.forEach(channel => {
            const group = channel.group || 'Geral';
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(channel);
        });
        
        let html = '';
        
        for (const [group, channels] of Object.entries(grouped)) {
            html += `
                <div class="channel-group-header">
                    <h3>${this.escapeHtml(group)}</h3>
                    <span class="channel-count">${channels.length}</span>
                </div>
            `;
            
            channels.forEach(channel => {
                const isActive = this.currentChannel?.url === channel.url;
                html += `
                    <div class="channel-item ${isActive ? 'active' : ''}" 
                         data-url="${this.escapeHtml(channel.url)}" 
                         data-name="${this.escapeHtml(channel.name)}" 
                         data-group="${this.escapeHtml(channel.group)}">
                        <div class="channel-info-container">
                            <div class="channel-logo-placeholder">📺</div>
                            <div class="channel-details">
                                <div class="channel-name">${this.escapeHtml(channel.name)}</div>
                                <div class="channel-group">${this.escapeHtml(channel.group)}</div>
                            </div>
                        </div>
                        <div class="channel-play-icon">▶</div>
                    </div>
                `;
            });
        }
        
        this.channelListEl.innerHTML = html;
        
        document.querySelectorAll('.channel-item').forEach(item => {
            item.addEventListener('click', () => {
                this.playChannel(item.dataset.url, item.dataset.name, item.dataset.group);
            });
        });
    }
    
    filterChannels(searchText) {
        if (!searchText.trim()) {
            this.filteredChannels = [...this.channels];
        } else {
            this.filteredChannels = this.channels.filter(ch => 
                ch.name.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        this.renderChannelList();
    }
    
    playChannel(url, name, group) {
        if (!url) {
            this.showError('URL do canal inválida');
            return;
        }
        
        this.currentChannel = { url, name, group };
        
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.url === url) {
                item.classList.add('active');
            }
        });
        
        this.currentChannelNameEl.textContent = name;
        this.currentChannelGroupEl.textContent = group;
        this.channelInfoEl.classList.remove('hidden');
        
        if (this.currentHls) {
            this.currentHls.destroy();
        }
        
        this.playerContainer.innerHTML = `
            <video id="videoPlayer" controls autoplay style="width: 100%; height: 100%; object-fit: contain;">
                <source src="${url}" type="application/vnd.apple.mpegurl">
                Seu navegador não suporta vídeo HTML5.
            </video>
        `;
        
        const videoPlayer = document.getElementById('videoPlayer');
        
        if (url.includes('.m3u8')) {
            if (Hls && Hls.isSupported()) {
                this.currentHls = new Hls({ debug: false });
                this.currentHls.loadSource(url);
                this.currentHls.attachMedia(videoPlayer);
                this.currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoPlayer.play().catch(e => console.log(e));
                });
            } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                videoPlayer.src = url;
                videoPlayer.play().catch(e => console.log(e));
            }
        } else {
            videoPlayer.src = url;
            videoPlayer.play().catch(e => console.log(e));
        }
        
        videoPlayer.onerror = () => {
            this.showError('Erro ao reproduzir canal. Pode estar offline.');
        };
    }
    
    showLoading() {
        this.channelListEl.innerHTML = '<div class="loading"><div class="spinner"></div>Carregando...</div>';
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `⚠️ ${message}<button onclick="this.parentElement.remove()">✕</button>`;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.innerHTML = `✅ ${message}<button onclick="this.parentElement.remove()">✕</button>`;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.app = new IPTVApp();
});
