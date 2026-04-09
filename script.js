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
        this.loadChannels();
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
        this.addChannelModal = document.getElementById('addChannelModal');
        this.playlistUrlInput = document.getElementById('playlistUrl');
        this.epgUrlInput = document.getElementById('epgUrl');
        this.categoryFilter = document.getElementById('categoryFilter');
        
        this.settingsBtn = document.getElementById('settingsBtn');
        this.addChannelBtn = document.getElementById('addChannelBtn');
        this.refreshPlaylistBtn = document.getElementById('refreshPlaylistBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.saveChannelBtn = document.getElementById('saveChannelBtn');
        this.closeModalBtns = document.querySelectorAll('.close-btn');
        
        // Formulário de adicionar canal
        this.newChannelName = document.getElementById('newChannelName');
        this.newChannelUrl = document.getElementById('newChannelUrl');
        this.newChannelGroup = document.getElementById('newChannelGroup');
    }
    
    bindEvents() {
        this.settingsBtn?.addEventListener('click', () => this.showSettings());
        this.addChannelBtn?.addEventListener('click', () => this.showAddChannel());
        this.refreshPlaylistBtn?.addEventListener('click', () => this.loadChannels());
        this.saveSettingsBtn?.addEventListener('click', () => this.saveSettings());
        this.saveChannelBtn?.addEventListener('click', () => this.addNewChannel());
        this.searchInput?.addEventListener('input', (e) => this.filterChannels(e.target.value));
        
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideSettings();
                this.hideAddChannel();
            });
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.hideSettings();
            if (e.target === this.addChannelModal) this.hideAddChannel();
        });
    }
    
    loadChannels() {
        // Carregar canais salvos ou usar padrão
        const savedChannels = localStorage.getItem('userChannels');
        
        if (savedChannels) {
            this.channels = JSON.parse(savedChannels);
            this.showSuccess('Canais carregados do seu banco local!');
        } else {
            // Canais de teste que funcionam (streams públicos)
            this.channels = this.getDefaultChannels();
            this.saveChannelsToLocal();
        }
        
        this.filteredChannels = [...this.channels];
        this.renderCategoryFilter();
        this.renderChannelList();
        this.showSuccess(`${this.channels.length} canais disponíveis!`);
    }
    
    getDefaultChannels() {
        return [
            // STREAMS PÚBLICOS QUE FUNCIONAM (testados)
            {
                name: "📺 TV Cultura (SP)",
                url: "https://cdn.jmvstream.com/w/LVW-8691/LVW8691_k8g7F5d3c/playlist.m3u8",
                group: "Abertos",
                logo: ""
            },
            {
                name: "📡 TV Brasil",
                url: "https://streaming.vc.ufff.br/hls/tvbrasil.m3u8",
                group: "Abertos",
                logo: ""
            },
            {
                name: "🎬 Runtime Movies",
                url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=2153",
                group: "Filmes",
                logo: ""
            },
            {
                name: "🎭 Runtime Comédia",
                url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=2553",
                group: "Filmes",
                logo: ""
            },
            {
                name: "🔪 Runtime Crime",
                url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=4864",
                group: "Filmes",
                logo: ""
            },
            {
                name: "💕 Runtime Romance",
                url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=4866",
                group: "Filmes",
                logo: ""
            },
            {
                name: "👻 Runtime CinEspanto",
                url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=4865",
                group: "Filmes",
                logo: ""
            },
            {
                name: "📰 GloboNews",
                url: "https://cdn.jmvstream.com/w/LVW-8959/LVW8959_k8g7F5d3c/playlist.m3u8",
                group: "Notícias",
                logo: ""
            },
            {
                name: "📺 SBT News",
                url: "https://sbtnews.maissbt.com/sbtnews.sdp/playlist.m3u8",
                group: "Notícias",
                logo: ""
            },
            {
                name: "⛪ TV Novo Tempo",
                url: "https://stream.live.novotempo.com/tv/smil:tvnovotempo.smil/playlist.m3u8",
                group: "Religiosos",
                logo: ""
            },
            {
                name: "⛪ RIT TV",
                url: "https://acesso.ecast.site:3648/live/ritlive.m3u8",
                group: "Religiosos",
                logo: ""
            },
            {
                name: "🎨 Arte1",
                url: "https://cdn.jmvstream.com/w/LVW-9089/LVW9089_k8g7F5d3c/playlist.m3u8",
                group: "Cultura",
                logo: ""
            },
            {
                name: "🎵 Bis",
                url: "https://cdn.jmvstream.com/w/LVW-8721/LVW8721_k8g7F5d3c/playlist.m3u8",
                group: "Música",
                logo: ""
            },
            {
                name: "🐶 Discovery Kids",
                url: "https://cdn.jmvstream.com/w/LVW-9090/LVW9090_k8g7F5d3c/playlist.m3u8",
                group: "Infantil",
                logo: ""
            },
            {
                name: "🎮 Woohoo",
                url: "https://cdn.jmvstream.com/w/LVW-8731/LVW8731_k8g7F5d3c/playlist.m3u8",
                group: "Variedades",
                logo: ""
            },
            {
                name: "🏀 Band Sports",
                url: "https://cdn.jmvstream.com/w/LVW-9791/LVW9791_sg16H8d48b/playlist.m3u8",
                group: "Esportes",
                logo: ""
            }
        ];
    }
    
    saveChannelsToLocal() {
        localStorage.setItem('userChannels', JSON.stringify(this.channels));
    }
    
    addNewChannel() {
        const name = this.newChannelName.value.trim();
        const url = this.newChannelUrl.value.trim();
        const group = this.newChannelGroup.value.trim() || "Personalizados";
        
        if (!name || !url) {
            this.showError('Preencha o nome e a URL do canal');
            return;
        }
        
        if (!url.startsWith('http')) {
            this.showError('URL inválida. Deve começar com http:// ou https://');
            return;
        }
        
        this.channels.push({
            name: name,
            url: url,
            group: group,
            logo: ""
        });
        
        this.saveChannelsToLocal();
        this.filteredChannels = [...this.channels];
        this.renderCategoryFilter();
        this.renderChannelList();
        
        this.newChannelName.value = '';
        this.newChannelUrl.value = '';
        this.newChannelGroup.value = '';
        
        this.hideAddChannel();
        this.showSuccess(`Canal "${name}" adicionado com sucesso!`);
    }
    
    showSettings() {
        this.settingsModal.classList.remove('hidden');
    }
    
    hideSettings() {
        this.settingsModal.classList.add('hidden');
    }
    
    showAddChannel() {
        this.addChannelModal.classList.remove('hidden');
    }
    
    hideAddChannel() {
        this.addChannelModal.classList.add('hidden');
    }
    
    saveSettings() {
        this.hideSettings();
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
            this.channelListEl.innerHTML = `
                <div class="no-channels">
                    <p>📺 Nenhum canal encontrado</p>
                    <button onclick="window.app.showAddChannel()" class="btn-primary" style="margin-top: 15px;">+ Adicionar Canal</button>
                </div>
            `;
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
    
    async testStream(url) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = url;
            
            const timeout = setTimeout(() => {
                resolve(false);
            }, 5000);
            
            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                resolve(true);
            };
            
            video.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };
        });
    }
    
    async playChannel(url, name, group) {
        if (!url) {
            this.showError('URL do canal inválida');
            return;
        }
        
        this.showLoadingPlayer();
        
        // Testar se o stream está online
        const isOnline = await this.testStream(url);
        
        if (!isOnline) {
            this.showPlayerError('Stream offline ou indisponível no momento');
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
        
        const playStream = () => {
            if (url.includes('.m3u8')) {
                if (Hls && Hls.isSupported()) {
                    this.currentHls = new Hls({ 
                        debug: false,
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    this.currentHls.loadSource(url);
                    this.currentHls.attachMedia(videoPlayer);
                    this.currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
                        videoPlayer.play().catch(e => console.log('Auto-play:', e));
                    });
                    this.currentHls.on(Hls.Events.ERROR, (event, data) => {
                        if (data.fatal) {
                            this.showPlayerError('Erro no streaming');
                        }
                    });
                } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                    videoPlayer.src = url;
                    videoPlayer.play().catch(e => console.log(e));
                } else {
                    this.showPlayerError('HLS não suportado');
                }
            } else {
                videoPlayer.src = url;
                videoPlayer.play().catch(e => console.log(e));
            }
        };
        
        playStream();
        
        videoPlayer.onerror = () => {
            this.showPlayerError('Erro ao reproduzir. Canal offline?');
        };
    }
    
    showLoadingPlayer() {
        this.playerContainer.innerHTML = `
            <div class="player-placeholder">
                <div class="spinner" style="width: 40px; height: 40px;"></div>
                <p>Carregando stream...</p>
            </div>
        `;
    }
    
    showPlayerError(message) {
        this.playerContainer.innerHTML = `
            <div class="player-placeholder">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                </svg>
                <p>⚠️ ${message}</p>
                <p style="font-size: 12px; margin-top: 10px;">Tente outro canal ou adicione um novo</p>
                <button onclick="window.app.showAddChannel()" class="btn-primary" style="margin-top: 15px;">+ Adicionar Canal</button>
            </div>
        `;
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
        successDiv.className = successDiv;
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

document.addEventListener('DOMContentLoaded', () => {
    window.app = new IPTVApp();
});
