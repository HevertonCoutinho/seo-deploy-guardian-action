/**
 * SEO Deploy Guardian - GitHub Action Runner
 * https://github.com/HevertonCoutinho/seo-deploy-guardian-action
 */
const fs = require('fs');
const https = require('https');
const http = require('http');

async function run() {
  try {
    const apiUrl = process.env.INPUT_API_URL || 'https://seo-deploy-guardian.vercel.app/api/v1/validate';
    const apiKey = process.env.INPUT_API_KEY || '';
    const htmlFile = process.env.INPUT_HTML_FILE;
    const baseHtmlFile = process.env.INPUT_BASE_HTML_FILE;
    const analysisMode = process.env.INPUT_ANALYSIS_MODE || 'full';
    const productionDomain = process.env.INPUT_PRODUCTION_DOMAIN || '';
    const pageType = process.env.INPUT_PAGE_TYPE || 'generic';
    const minScore = parseInt(process.env.INPUT_MIN_SCORE || '80', 10);
    const allowBypass = process.env.INPUT_ALLOW_BYPASS === 'true';

    console.log('🛡️ [SEO Deploy Guardian] Iniciando auditoria preventiva de SEO pré-deploy...');

    if (!htmlFile || !fs.existsSync(htmlFile)) {
      throw new Error(`Arquivo HTML de entrada não encontrado no caminho: "${htmlFile}". Verifique a etapa de build.`);
    }

    const htmlContent = fs.readFileSync(htmlFile, 'utf-8');
    let baseHtmlContent = null;

    if (analysisMode === 'delta' && baseHtmlFile && fs.existsSync(baseHtmlFile)) {
      baseHtmlContent = fs.readFileSync(baseHtmlFile, 'utf-8');
      console.log('🔍 Modo Delta ativo: comparando com a versão base para ignorar falhas legadas.');
    }

    const payload = JSON.stringify({
      html: htmlContent,
      base_html: baseHtmlContent,
      analysis_mode: analysisMode,
      production_domain: productionDomain,
      page_type: pageType,
      min_score: minScore,
      allow_bypass: allowBypass
    });

    const parsedUrl = new URL(apiUrl);
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      }
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const { summary, audit_details } = result;

          console.log('\n======================================================');
          console.log(`📊 SEO SCORE: ${summary.seo_score}/100 (Mínimo exigido: ${summary.min_score_required})`);
          console.log(`🚦 DECISÃO: ${summary.status_deploy}`);
          console.log(`⏱️ Tempo de análise: ${summary.execution_time_ms}ms`);
          console.log('======================================================\n');

          if (audit_details && audit_details.critical_errors && audit_details.critical_errors.length > 0) {
            console.log('🔴 FALHAS CRÍTICAS ENCONTRADAS:');
            audit_details.critical_errors.forEach(err => {
              console.log(`  - [${err.element}] ${err.issue}`);
              console.log(`    Impacto: ${err.impact}`);
            });
            console.log('');
          }

          if (audit_details && audit_details.warnings && audit_details.warnings.length > 0) {
            console.log('🟡 AVISOS DE OTIMIZAÇÃO:');
            audit_details.warnings.forEach(warn => {
              console.log(`  - [${warn.element}] ${warn.issue}`);
            });
            console.log('');
          }

          if (summary.deploy_blocked) {
            console.error('❌ DEPLOY REJEITADO: Falhas críticas de SEO detectadas. O pipeline foi interrompido.');
            process.exit(1);
          } else {
            if (summary.status_deploy === 'BYPASSED') {
              console.log('⚠️ AVISO: Deploy aprovado via sobrescrita manual (Bypass ativo).');
            } else {
              console.log('✅ SINAL VERDE: Página aprovada nas regras de governança de SEO!');
            }
            process.exit(0);
          }
        } catch (e) {
          console.error('Erro ao interpretar resposta da API:', data);
          process.exit(1);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Erro de conexão com o SEO Deploy Guardian:', err.message);
      // Por padrão em CI/CD, não trava o deploy se o serviço de validação estiver inacessível
      process.exit(0);
    });

    req.write(payload);
    req.end();

  } catch (error) {
    console.error('Erro na execução do SEO Guardian:', error.message);
    process.exit(1);
  }
}

run();
