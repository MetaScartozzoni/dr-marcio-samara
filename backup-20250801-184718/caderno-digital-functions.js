// Funcionalidades específicas do Caderno Digital
// Integração com recursos de captura de foto e anotações

class CadernoDigital {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.ferramentaAtiva = 'texto';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.fotos = [];
        this.anotacoes = [];
    }

    inicializar() {
        // Não inicializar câmera automaticamente
        this.setupCanvas();
        this.setupEventListeners();
    }

    async setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            return video;
        } catch (error) {
            console.log('Câmera não disponível:', error);
            return null;
        }
    }

    async capturarFoto() {
        try {
            const video = await this.setupCamera();
            if (!video) {
                // Fallback para input file
                document.getElementById('foto-input').click();
                return;
            }

            // Criar modal para captura
            const modal = this.criarModalCamera(video);
            document.body.appendChild(modal);

        } catch (error) {
            console.error('Erro ao capturar foto:', error);
            document.getElementById('foto-input').click();
        }
    }

    criarModalCamera(video) {
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const videoContainer = document.createElement('div');
        videoContainer.style.cssText = `
            position: relative;
            max-width: 90%;
            max-height: 70%;
        `;

        video.style.cssText = `
            width: 100%;
            height: auto;
            border-radius: 10px;
        `;

        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 20px;
            margin-top: 20px;
        `;

        const captureBtn = document.createElement('button');
        captureBtn.innerHTML = '<i class="fas fa-camera"></i> Capturar';
        captureBtn.style.cssText = `
            background: #2ecc71;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 16px;
            cursor: pointer;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar';
        cancelBtn.style.cssText = `
            background: #e74c3c;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 16px;
            cursor: pointer;
        `;

        // Event listeners
        captureBtn.onclick = () => {
            this.processarCaptura(video);
            this.fecharModal(modal);
        };

        cancelBtn.onclick = () => {
            this.fecharModal(modal);
        };

        videoContainer.appendChild(video);
        controls.appendChild(captureBtn);
        controls.appendChild(cancelBtn);
        modal.appendChild(videoContainer);
        modal.appendChild(controls);

        return modal;
    }

    processarCaptura(video) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        
        const fotoData = {
            id: Date.now(),
            src: dataURL,
            timestamp: new Date().toISOString(),
            nome: `Foto_${new Date().toLocaleString('pt-BR').replace(/[/:\s]/g, '_')}`
        };
        
        this.fotos.push(fotoData);
        this.renderizarGaleria();
        
        // Parar stream da câmera
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    fecharModal(modal) {
        const video = modal.querySelector('video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        document.body.removeChild(modal);
    }

    setupCanvas() {
        // Configurar canvas para anotações
        const canvasContainer = document.querySelector('.canvas-container');
        if (!canvasContainer) return;

        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            cursor: crosshair;
            pointer-events: none;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        canvasContainer.appendChild(this.canvas);
        
        this.redimensionarCanvas();
        window.addEventListener('resize', () => this.redimensionarCanvas());
    }

    redimensionarCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
    }

    ativarFerramenta(ferramenta) {
        this.ferramentaAtiva = ferramenta;
        
        if (ferramenta === 'desenho' || ferramenta === 'regua' || ferramenta === 'marca') {
            this.canvas.style.pointerEvents = 'auto';
            this.setupDrawing();
        } else {
            this.canvas.style.pointerEvents = 'none';
        }
    }

    setupDrawing() {
        this.canvas.addEventListener('mousedown', (e) => this.iniciarDesenho(e));
        this.canvas.addEventListener('mousemove', (e) => this.desenhar(e));
        this.canvas.addEventListener('mouseup', () => this.finalizarDesenho());
        
        // Touch events para mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    iniciarDesenho(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        
        this.configurarEstilo();
    }

    desenhar(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        if (this.ferramentaAtiva === 'regua') {
            this.desenharRegua(currentX, currentY);
        } else {
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
        }
    }

    finalizarDesenho() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        // Salvar estado do canvas
        this.salvarAnotacao();
    }

    configurarEstilo() {
        switch (this.ferramentaAtiva) {
            case 'desenho':
                this.ctx.strokeStyle = '#2c3e50';
                this.ctx.lineWidth = 2;
                this.ctx.lineCap = 'round';
                break;
            case 'marca':
                this.ctx.strokeStyle = '#f1c40f';
                this.ctx.lineWidth = 10;
                this.ctx.lineCap = 'round';
                this.ctx.globalAlpha = 0.5;
                break;
            case 'regua':
                this.ctx.strokeStyle = '#e74c3c';
                this.ctx.lineWidth = 1;
                this.ctx.lineCap = 'butt';
                break;
        }
    }

    desenharRegua(endX, endY) {
        // Limpar e redesenhar linha da régua
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Redesenhar anotações anteriores
        this.redesenharAnotacoes();
        
        // Desenhar linha atual
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Calcular e mostrar distância
        const distancia = Math.sqrt(
            Math.pow(endX - this.startX, 2) + 
            Math.pow(endY - this.startY, 2)
        );
        
        // Mostrar medição
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(
            `${Math.round(distancia)}px`, 
            (this.startX + endX) / 2, 
            (this.startY + endY) / 2 - 10
        );
    }

    salvarAnotacao() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.anotacoes.push({
            id: Date.now(),
            data: imageData,
            ferramenta: this.ferramentaAtiva,
            timestamp: new Date().toISOString()
        });
    }

    redesenharAnotacoes() {
        this.anotacoes.forEach(anotacao => {
            this.ctx.putImageData(anotacao.data, 0, 0);
        });
    }

    exportarPDF() {
        // Implementar exportação para PDF com jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        // Adicionar dados do paciente
        const paciente = document.getElementById('pacienteSelect').value;
        pdf.setFontSize(16);
        pdf.text(`Caderno Digital - ${paciente}`, 20, 20);
        
        // Adicionar data
        pdf.setFontSize(12);
        pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
        
        let yPosition = 50;
        
        // Adicionar fotos
        this.fotos.forEach((foto, index) => {
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            
            try {
                pdf.addImage(foto.src, 'JPEG', 20, yPosition, 80, 60);
                pdf.text(`Foto ${index + 1} - ${foto.nome}`, 110, yPosition + 30);
                yPosition += 80;
            } catch (error) {
                console.error('Erro ao adicionar imagem ao PDF:', error);
            }
        });
        
        // Salvar PDF
        pdf.save(`Caderno_${paciente}_${new Date().toLocaleDateString('pt-BR')}.pdf`);
    }

    sincronizarDados() {
        // Implementar sincronização com servidor
        const dados = {
            paciente: document.getElementById('pacienteSelect').value,
            fotos: this.fotos,
            anotacoes: this.anotacoes.map(a => ({
                ...a,
                data: null // Não enviar ImageData diretamente
            })),
            timestamp: new Date().toISOString()
        };
        
        // Salvar localmente
        localStorage.setItem('cadernoDigital', JSON.stringify(dados));
        
        // Em produção, enviar para API
        console.log('Dados sincronizados:', dados);
        
        // Mostrar feedback
        this.mostrarNotificacao('Dados sincronizados com sucesso!', 'success');
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${tipo === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = mensagem;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    renderizarGaleria() {
        const galeria = document.getElementById('galeria-fotos');
        if (!galeria) return;
        
        galeria.innerHTML = '';
        
        this.fotos.forEach(foto => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            item.innerHTML = `
                <img src="${foto.src}" alt="${foto.nome}">
                <div class="photo-overlay">
                    <div class="photo-actions">
                        <button onclick="cadernoDigital.editarFoto(${foto.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="cadernoDigital.adicionarAnotacao(${foto.id})" title="Anotar">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button onclick="cadernoDigital.removerFoto(${foto.id})" title="Remover">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            galeria.appendChild(item);
        });
    }

    editarFoto(id) {
        const foto = this.fotos.find(f => f.id === id);
        if (!foto) return;
        
        // Implementar editor básico de imagem
        console.log('Editando foto:', foto);
    }

    adicionarAnotacao(id) {
        const foto = this.fotos.find(f => f.id === id);
        if (!foto) return;
        
        // Carregar foto no canvas para anotação
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        };
        img.src = foto.src;
    }

    removerFoto(id) {
        if (confirm('Tem certeza que deseja remover esta foto?')) {
            this.fotos = this.fotos.filter(foto => foto.id !== id);
            this.renderizarGaleria();
        }
    }
}

// Instância global
const cadernoDigital = new CadernoDigital();

// CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
