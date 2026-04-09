class IPTVApp {
    constructor() {
        this.channels = [];
        this.currentChannel = null;
        this.currentHls = null;
        // Usar proxy da própria aplicação
        this.playlistUrl = localStorage.getItem('playlistUrl') || 'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/novalista.m3u8';
        this.epgUrl = localStorage.getItem('epgUrl') || '';
        this.filteredChannels = [];
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        
        // Carregar playlist automaticamente
        if (this.playlistUrl) {
            this.loadPlaylist();
        }
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
        this.refreshPlaylistBtn?.addEventListener('click', () => this.loadPlaylist());
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
    
    async loadPlaylist() {
        if (!this.playlistUrl) {
            this.showError('Por favor, configure uma URL de playlist M3U nas configurações');
            return;
        }
        
        this.showLoading();
        
        try {
            let m3uContent = null;
            
            // Tentar via proxy da Vercel primeiro
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(this.playlistUrl)}`;
            
            console.log('Tentando carregar via proxy:', proxyUrl);
            
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                m3uContent = await response.text();
                console.log('Playlist carregada com sucesso via proxy');
            } else {
                throw new Error('Proxy request failed');
            }
            
            if (!m3uContent) {
                throw new Error('Não foi possível carregar a playlist');
            }
            
            this.parseM3U(m3uContent);
            
            if (this.epgUrl) {
                await this.loadEPG();
            }
        } catch (error) {
            console.error('Erro ao carregar playlist:', error);
            this.showError('Erro ao carregar playlist. Verifique a URL e tente novamente.');
            
            // Mostrar instruções
            this.channelListEl.innerHTML = `
                <div class="error-container">
                    <p>⚠️ Erro ao carregar a playlist</p>
                    <p style="font-size: 12px; margin-top: 10px;">Verifique se a URL está correta e tente novamente.</p>
                    <button onclick="window.app.showSettings()" class="btn-primary" style="margin-top: 15px;">Configurar URL</button>
                </div>
            `;
        }
    }
    
    parseM3U(content) {
        const lines = content.split('\n');
        const channels = [];
        let currentChannel = null;
        let validChannelsCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                // Extrair informações do canal
                const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
                const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
                const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
                const groupMatch = line.match(/group-title="([^"]*)"/);
                
                // Nome do canal (após a última vírgula)
                const lastCommaIndex = line.lastIndexOf(',');
                let channelName = 'Canal Desconhecido';
                if (lastCommaIndex !== -1) {
                    channelName = line.substring(lastCommaIndex + 1).trim();
                }
                
                currentChannel = {
                    id: tvgIdMatch ? tvgIdMatch[1] : `channel_${i}`,
                    name: tvgNameMatch ? tvgNameMatch[1] : channelName,
                    logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
                    group: groupMatch ? groupMatch[1] : 'Geral',
                    url: ''
                };
            } else if (line && !line.startsWith('#') && currentChannel) {
                currentChannel.url = line;
                
                // Verificar se a URL é válida
                if (currentChannel.url && 
                    (currentChannel.url.startsWith('http://') || currentChannel.url.startsWith('https://'))) {
                    channels.push(currentChannel);
                    validChannelsCount++;
                }
                currentChannel = null;
            }
        }
        
        this.channels = channels;
        this.filteredChannels = [...channels];
        
        console.log(`Total de canais carregados: ${channels.length}`);
        
        if (channels.length > 0) {
            this.renderCategoryFilter();
            this.renderChannelList();
            this.showSuccess(`${channels.length} canais carregados com sucesso!`);
        } else {
            this.showError('Nenhum canal encontrado na playlist. Verifique o formato do arquivo M3U.');
        }
    }
    
    renderCategoryFilter() {
        if (!this.categoryFilter) return;
        
        const categories = ['Todos', ...new Set(this.channels.map(ch => ch.group).filter(g => g && g !== 'Geral'))];
        
        this.categoryFilter.innerHTML = categories.map(cat => 
            `<option value="${cat}">${cat}</option>`
        ).join('');
        
        this.categoryFilter.addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });
    }
    
    filterByCategory(category) {
        if (category === 'Todos') {
            this.filteredChannels = [...this.channels];
        } else {
            this.filteredChannels = this.channels.filter(ch => ch.group === category);
        }
        
        const searchTerm = this.searchInput?.value || '';
        if (searchTerm) {
            this.filteredChannels = this.filteredChannels.filter(ch => 
                ch.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        this.renderChannelList();
    }
    
    async loadEPG() {
        try {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(this.epgUrl)}`;
            const response = await fetch(proxyUrl);
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
    
    renderChannelList() {
        if (!this.channelListEl) return;
        
        if (this.filteredChannels.length === 0) {
            this.channelListEl.innerHTML = '<div class="no-channels">Nenhum canal encontrado</div>';
            return;
        }
        
        // Agrupar por categoria
        const grouped = {};
        this.filteredChannels.forEach(channel => {
            const group = channel.group || 'Geral';
            if (!grouped[group]) {
                grouped[group] = [];
            }
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
                         data-group="${this.escapeHtml(channel.group)}" 
                         data-logo="${this.escapeHtml(channel.logo)}">
                        <div class="channel-info-container">
                            ${channel.logo ? `<img src="${channel.logo}" class="channel-logo" alt="${channel.name}" onerror="this.style.display='none'">` : '<div class="channel-logo-placeholder">📺</div>'}
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
        
        // Adicionar event listeners
        document.querySelectorAll('.channel-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                const name = item.dataset.name;
                const group = item.dataset.group;
                const logo = item.dataset.logo;
                this.playChannel(url, name, group, logo);
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
    
    playChannel(url, name, group, logo) {
        if (!url || url === 'undefined') {
            this.showError('URL do canal inválida');
            return;
        }
        
        this.currentChannel = { url, name, group, logo };
        
        // Atualizar UI
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.url === url) {
                item.classList.add('active');
            }
        });
        
        this.currentChannelNameEl.textContent = name;
        this.currentChannelGroupEl.textContent = group;
        if (logo && this.currentChannelLogoEl) {
            this.currentChannelLogoEl.src = logo;
            this.currentChannelLogoEl.style.display = 'block';
        } else if (this.currentChannelLogoEl) {
            this.currentChannelLogoEl.style.display = 'none';
        }
        this.channelInfoEl.classList.remove('hidden');
        
        // Limpar instância HLS anterior
        if (this.currentHls) {
            this.currentHls.destroy();
        }
        
        // Criar player
        this.playerContainer.innerHTML = `
            <video id="videoPlayer" controls autoplay style="width: 100%; height: 100%; object-fit: contain;">
                <source src="${url}" type="application/vnd.apple.mpegurl">
                Seu navegador não suporta vídeo HTML5.
            </video>
            <div id="playerError" class="player-error hidden">
                <p>⚠️ Erro ao carregar o canal</p>
                <button onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
        
        const videoPlayer = document.getElementById('videoPlayer');
        
        // Tentar reproduzir
        if (url.includes('.m3u8') || url.includes('playlist.m3u8')) {
            if (Hls && Hls.isSupported()) {
                this.currentHls = new Hls({
                    debug: false,
                    enableWorker: true,
                    lowLatencyMode: true
                });
                this.currentHls.loadSource(url);
                this.currentHls.attachMedia(videoPlayer);
                this.currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoPlayer.play().catch(e => console.log('Auto-play prevented:', e));
                });
                this.currentHls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS Error:', data);
                    if (data.fatal) {
                        this.showPlayerError('Stream indisponível no momento');
                    }
                });
            } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                videoPlayer.src = url;
                videoPlayer.play().catch(e => console.log('Auto-play prevented:', e));
            } else {
                this.showPlayerError('Seu navegador não suporta streaming HLS');
            }
        } else {
            videoPlayer.src = url;
            videoPlayer.play().catch(e => {
                console.log('Auto-play prevented:', e);
            });
        }
        
        videoPlayer.addEventListener('error', (e) => {
            console.error('Player error:', e);
            this.showPlayerError('Erro ao carregar o stream. O canal pode estar offline.');
        });
    }
    
    showPlayerError(message = 'Erro ao carregar o canal') {
        const errorDiv = document.getElementById('playerError');
        if (errorDiv) {
            errorDiv.classList.remove('hidden');
            const p = errorDiv.querySelector('p');
            if (p) p.innerHTML = `⚠️ ${message}`;
        }
    }
    
    showLoading() {
        this.channelListEl.innerHTML = '<div class="loading"><div class="spinner"></div>Carregando canais...</div>';
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <span>⚠️ ${message}</span>
            <button onclick="this.parentElement.remove()">✕</button>
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 8000);
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.innerHTML = `
            <span>✅ ${message}</span>
            <button onclick="this.parentElement.remove()">✕</button>
        `;
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
