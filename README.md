# GeoBlog — Geografia para o ENEM e vestibulares

Blog estático de Geografia feito como trabalho para a disciplina de Geografia, por **Pedro Agostinho Carrero** e **Talita Assis Godoy** (DS3). Sem backend, sem banco de dados e sem integração com planilhas: apenas HTML, CSS e JavaScript.

## Conteúdo

1. Camadas da Terra
2. Placas Tectônicas
3. Terremotos
4. Biomas
5. Climas
6. Camadas da atmosfera
7. Revolução Industrial
8. Primavera Árabe

Cada artigo traz texto explicativo, tabelas, tópicos que mais caem nas provas, referências e 2 questões no estilo ENEM/vestibulares. As questões têm alternativas clicáveis e botão **Responder**: ao acertar, o gabarito comentado é exibido.

## Recursos da página

- Hero com globo terrestre animado (canvas).
- Grade de cards que leva a cada artigo.
- Indicador lateral de leitura: destaca o artigo e a seção atuais, mostra o progresso de cada artigo e o progresso geral. No celular, vira uma faixa fixa no topo.
- Layout responsivo e respeito à preferência de "reduzir movimento" do sistema.

## Estrutura

```
.
├── index.html   # página única com todos os artigos
├── style.css    # estilos
├── script.js    # cards, questões, indicador de leitura e globo
└── README.md
```

## Como usar

Abra o `index.html` no navegador. Não há instalação nem build.

## Como editar

- **Imagem de capa:** no `index.html`, troque `COLE_AQUI_O_LINK_DA_IMAGEM` no atributo `src` da tag `<img class="capa">` de cada artigo. A mesma imagem aparece no card do artigo. Enquanto o link não for preenchido (ou se falhar), a imagem fica oculta.
- **Data de publicação:** troque `DD/MM/AAAA` dentro da tag `<time>` de cada artigo.
- **Questões:** ficam dentro de `<details class="q">` em cada artigo. Mantenha o formato `Gabarito: X.` no parágrafo `.gab`, pois o `script.js` usa essa letra para corrigir.
- **Cores:** variáveis no início do `style.css` (`:root`).

## Hospedagem no GitHub Pages

1. Crie um repositório no GitHub e envie os arquivos na raiz.
2. Vá em **Settings → Pages**.
3. Em **Source**, escolha **Deploy from a branch**, selecione a branch `main` e a pasta `/ (root)`.
4. Salve e aguarde alguns minutos. O site ficará em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Observações

- As questões foram elaboradas no estilo ENEM/vestibulares, para estudo; não são reproduções literais de provas.
- As referências listadas em cada artigo são fontes de consulta gerais.

## Autores

Pedro Agostinho Carrero e Talita Assis Godoy · DS3
