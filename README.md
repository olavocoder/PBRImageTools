# 🎨 Mask Map & Tools

Uma aplicação web moderna para processamento criativo de imagens, oferecendo ferramentas essenciais para criadores de conteúdo 3D e designers.

## 📋 Descrição

**Mask Map Generator** é uma suite de ferramentas para processamento de imagens com foco especial em texturas PBR (Physically Based Rendering). A aplicação é totalmente gratuita e funciona 100% no navegador, sem necessidade de upload de arquivos para servidores externos.

## 🎯 Funcionalidades

### 1. 🎨 Mask Map Generator
Combina múltiplos canais de imagem em um único mapa de máscaras PBR:

- **Canal R (Vermelho)**: Metallic
- **Canal G (Verde)**: Ambient Occlusion (AO)
- **Canal B (Azul)**: Detail Mask
- **Canal A (Alfa)**: Smoothness (Roughness invertido)

Suporta múltiplos formatos: PNG, JPG, TGA, EXR

### 2. 🔹 PBR Generator
Alterna entre canais para criar e visualizar diferentes mapas PBR

### 3. 💧 Watermark Removal
Ferramentas para remover marcas d'água de imagens

## 🚀 Como Usar

### Mask Map Generator

1. **Importar Imagens**:
   - Arraste e solte suas imagens nos campos de entrada, ou
   - Clique para abrir o navegador de arquivos

2. **Configurar Canais**:
   - Cada campo representa um canal:
     - Metallic → Será escrito no canal vermelho (R)
     - Ambient Occlusion → Será escrito no canal verde (G)
     - Detail Mask → Será escrito no canal azul (B)
     - Roughness → Será escrito no canal alfa (A)

3. **Opções**:
   - Marque "Invert (Roughness → Smoothness)" para converter roughness em smoothness

4. **Gerar**:
   - Clique em "Generate Mask Map" para combinar os canais

5. **Download**:
   - Escolha o formato desejado (PNG, JPG)
   - Clique em "Download" para salvar o arquivo

## 📁 Estrutura do Projeto

```
MaskmapApp/
├── index.html          # Estrutura HTML principal
├── style.css           # Estilos de interface
├── script.js           # Lógica principal do Mask Map Generator
├── pbr.js              # Lógica do PBR Generator
├── watermark.js        # Lógica do Watermark Removal
├── tabs.js             # Gerenciador de abas
└── README.md           # Este arquivo
```

## 🛠️ Tecnologias

- **HTML5**: Estrutura semântica
- **CSS3**: Design responsivo e moderno
- **JavaScript (Vanilla)**: Processamento de imagens no navegador
- **Canvas API**: Manipulação de imagens
- **FileReader API**: Leitura de arquivos locais

## ✨ Recursos

- ✅ Processamento 100% local (sem upload para servidor)
- ✅ Interface intuitiva com drag & drop
- ✅ Preview em tempo real
- ✅ Suporta múltiplos formatos de imagem
- ✅ Responsivo e mobile-friendly
- ✅ Tema escuro moderno

## 💡 Dicas de Uso

- As imagens podem ter tamanhos diferentes; elas serão dimensionadas para o tamanho da maior
- O invert de roughness é feito através da fórmula: `smoothness = 1 - roughness`
- Todos os processamentos ocorrem localmente no seu navegador

## 📝 Notas de Desenvolvimento

- A aplicação usa Canvas API para composição de canais
- Cada arquivo JS é modular e responsável por uma funcionalidade específica
- O gerenciador de abas permite fácil extensão com novos processadores

## 🤝 Contribuições

Para sugestões ou melhorias, abra uma issue ou entre em contato com o desenvolvedor.

## 📄 Licença

Este projeto é fornecido como está, sem garantias explícitas ou implícitas.

---

**Desenvolvido com ❤️ para criadores 3D**
