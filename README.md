# Blog de Geografia

Blog estático com artigos de Geografia para ENEM e vestibulares, feito como trabalho para a disciplina de Geografia. Sem backend, sem banco de dados e sem integração com planilhas: apenas HTML, CSS e JavaScript.

## Conteúdo

1. Camadas da Terra
2. Placas Tectônicas
3. Terremotos
4. Biomas
5. Climas
6. Camadas da atmosfera
7. Revolução Industrial
8. Primavera Árabe

<<<<<<< HEAD
Cada artigo traz texto explicativo, tabelas, tópicos que mais caem nas provas e questões no estilo ENEM/vestibulares, com gabarito comentado.
=======
## Uso
- Novo artigo → preencha, monte exatamente 3 perguntas → **Publicar**. Rascunhos aceitam menos de 3. Data de publicação futura agenda o artigo.
>>>>>>> dcf22c3932421007b93e3a69615018c24726bb60

## Estrutura

```
.
├── index.html   # página única com todos os artigos
├── style.css    # estilos
├── script.js    # menu mobile, destaque do índice e comportamento das questões
└── README.md
```

## Como usar

Abra o `index.html` no navegador. Não há instalação nem build.

## Como editar

- **Imagem de capa:** no `index.html`, troque `COLE_AQUI_O_LINK_DA_IMAGEM` no atributo `src` da tag `<img class="capa">` de cada artigo. Enquanto o link não for preenchido (ou se falhar), a imagem fica oculta.
- **Data de publicação:** troque `DD/MM/AAAA` dentro da tag `<time>` de cada artigo.
- **Cores:** variáveis no início do `style.css` (`:root`).

## Hospedagem no GitHub Pages

1. Crie um repositório no GitHub e envie os arquivos na raiz.
2. Vá em **Settings → Pages**.
3. Em **Source**, escolha **Deploy from a branch**, selecione a branch `main` e a pasta `/ (root)`.
4. Salve e aguarde alguns minutos. O site ficará em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Observações

- As questões foram elaboradas no estilo ENEM/vestibulares, para estudo; não são reproduções literais de provas.
- As referências listadas em cada artigo são fontes de consulta gerais.

## Autor

Carrero e Talita