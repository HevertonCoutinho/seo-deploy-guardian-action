# 🛡️ SEO Deploy Guardian (GitHub Action)

> **Auditoria Técnica de SEO Preventiva em CI/CD**
> *Bloqueie deploys antes que eles quebrem sua indexação, tags canonicals ou receita orgânica.*

---

## 🚀 Como Usar no seu Pipeline

Adicione este passo simples no seu arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy em Produção

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  seo-qa:
    runs-on: ubuntu-latest
    steps:
      - name: Baixar código
        uses: actions/checkout@v4

      - name: Compilar site (Ex: Next.js, Vite, Nuxt)
        run: npm run build

      - name: Validar SEO Técnico Pré-Deploy
        uses: HevertonCoutinho/seo-deploy-guardian-action@v1
        with:
          html_file: 'dist/index.html'
          production_domain: 'https://minhaloja.com.br'
          page_type: 'product'
          min_score: '80'
```

---

## 📋 Parâmetros Disponíveis (`with:`)

| Parâmetro | Obrigatório | Padrão | Descrição |
| :--- | :---: | :---: | :--- |
| `html_file` | **Sim** | - | Caminho relativo do HTML gerado no build (ex: `dist/index.html` ou `.next/server/pages/index.html`). |
| `production_domain` | Não | - | Domínio canônico de produção (ex: `https://minhaloja.com.br`) para detectar canonicals apontando para localhost ou staging. |
| `page_type` | Não | `generic` | Tipo da página para checagem estrita de Schema: `product`, `article`, `category`, `home` ou `generic`. |
| `min_score` | Não | `80` | Nota mínima do SEO Score (0 a 100) para aprovar o deploy. |
| `analysis_mode` | Não | `full` | `full` (analisa a página inteira) ou `delta` (ignora erros legados e foca apenas nas novas alterações). |
| `base_html_file` | Não | - | Caminho do HTML da branch base (usado no modo `delta`). |
| `allow_bypass` | Não | `false` | Se `true`, não bloqueia o deploy mesmo com falhas críticas (gera log formal de bypass). |

---

## 🛡️ O que o Guardian Valida?

* 🔴 **CRITICAL (Bloqueia o Deploy):**
  * Diretivas `noindex` ou `none` em páginas públicas.
  * Tag `canonical` ausente, duplicada ou apontando para domínios de staging/homologação (`localhost`, `staging.`, etc.).
* 🟡 **WARNING (Impacta o SEO Score):**
  * Ausência ou duplicidade de `H1`.
  * `Title` ou `Meta Description` ausentes ou acima dos limites (Title > 60 chars, Desc > 160 chars).
  * Imagens sem atributo `alt`.
  * Schemas `JSON-LD` com erro de sintaxe ou sem propriedades de oferta (`Product` sem `price`/`availability`).
* 🟢 **INFO (Boas Práticas):**
  * Scripts bloqueantes no `<head>` sem `defer` ou `async`.
  * Tag `viewport` mobile.

---

Feito com excelência técnica por [Heverton Escudeiro](https://hceweb.com.br).
